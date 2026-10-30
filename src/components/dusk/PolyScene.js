import React, { useEffect, useRef, useState } from "react";
import { rem } from "./motion";

// How the bot catches a mispriced book: one strike cross, replayed in slow motion over the
// network as it is laid out. Binance's move reaches the bot in Dublin over SBE first; the
// bot prices the option, checks its gates and sends the order while Polymarket's book is
// still quoting the old price, because the book only reprices when Polymarket's own relay
// of Binance arrives, and settlement follows Chainlink later still. The lags are the ones
// measured in the bot's logs; the prices in the replay are illustrative.

const SLOW = 4; // replay slow motion
const T = {
  sbe: 0.066, // Binance → bot over SBE (first-frame latency logged, clock offset included)
  decide: 0.0015, // decode, fair value, gates
  submit: 0.31, // order submit, median
  relay: 0.795, // Polymarket's relay of Binance, median staleness from Dublin
  chainlink: 1.65, // Chainlink behind SBE, per-market median
};
const CYCLE = 2.3; // seconds of event time per loop, before the pause

const NODES = {
  binance: { label: "Binance matching engine", short: "Binance", sub: "BTCUSDT, SBE stream", pos: [-4.2, 0.9, 0], color: 0xf4f1ed },
  bot: { label: "poly-bot · Dublin", short: "poly-bot", sub: "decode → N(d2) → gates → order", pos: [0, 1.9, 0], color: 0xc8ec5c },
  clob: { label: "Polymarket CLOB", short: "CLOB", sub: "the order book", pos: [4.2, 0.9, 0], color: 0xa8b0f2 },
  relay: { label: "Polymarket RTDS relay", short: "RTDS relay", sub: "re-broadcasts Binance", pos: [0, -0.4, 0.4], color: 0x88cada },
  chainlink: { label: "Chainlink BTC/USD", short: "Chainlink", sub: "settles the market", pos: [0, -1.9, -0.3], color: 0xf4ba87 },
};

// each path: from, to, start time, arrival time (event seconds), colour
const PATHS = [
  { id: "sbe", from: "binance", to: "bot", t0: 0, t1: T.sbe, color: 0xc8ec5c },
  { id: "order", from: "bot", to: "clob", t0: T.sbe + T.decide, t1: T.sbe + T.decide + T.submit, color: 0xc8ec5c },
  { id: "relay1", from: "binance", to: "relay", t0: 0, t1: T.relay * 0.55, color: 0x88cada },
  { id: "relay2", from: "relay", to: "clob", t0: T.relay * 0.55, t1: T.relay, color: 0x88cada },
  { id: "cl1", from: "binance", to: "chainlink", t0: 0, t1: T.chainlink * 0.55, color: 0xf4ba87 },
  { id: "cl2", from: "chainlink", to: "clob", t0: T.chainlink * 0.55, t1: T.chainlink, color: 0xf4ba87 },
];

const RACE = [
  { key: "sbe", label: "Binance move reaches the bot", t: T.sbe, cls: "is-sbe" },
  { key: "fill", label: "Our order reaches the book", t: T.sbe + T.decide + T.submit, cls: "is-order" },
  { key: "relay", label: "Polymarket's relay reprices the book", t: T.relay, cls: "is-relay" },
  { key: "cl", label: "Chainlink, which settles, moves", t: T.chainlink, cls: "is-cl" },
];

const ms = (s) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);
const stamp = (s) => `+${s.toFixed(3)}s`;

function script(c) {
  // the log for one cycle; c holds this cycle's illustrative prices
  return [
    { t: 0, tag: "BINANCE", cls: "t-ex", msg: [["BTC crosses the strike "], [c.K, "v"], [" → "], [c.S, "v"]] },
    { t: T.sbe, tag: "SBE", cls: "t-sbe", msg: [["bestBidAsk tpl=10001 bid="], [c.bid, "v"], [" ask="], [c.ask, "v"], [" latency="], ["66ms", "k"]] },
    { t: T.sbe + 0.0005, tag: "FAIR", cls: "t-fair", msg: [["N(d2)="], [c.fair, "k"], [" book YES="], [c.stale, "v"], [" gap="], [c.gap, "hot"]] },
    { t: T.sbe + 0.001, tag: "GATES", cls: "t-gate", msg: [["edge ✓  obi "], [c.obi, "v"], [" ✓  ttx "], [`${c.ttx}s`, "v"], [" ✓  |d2| ✓  relay dev ✓  naked 0 ✓"]] },
    { t: T.sbe + T.decide, tag: "ORDER", cls: "t-order", msg: [["BUY YES 10 @ "], [c.px, "hot"], [" GTD-cross → CLOB"]] },
    { t: T.sbe + T.decide + T.submit, tag: "FILL", cls: "t-order", msg: [["YES 10 @ "], [c.px, "hot"], [" taker fee "], [c.fee, "v"], [" · book still quoting "], [c.stale, "v"]] },
    { t: T.relay, tag: "RTDS", cls: "t-relay", msg: [["relay catches up → book YES "], [c.fresh, "v"], [" · gap closed"]] },
    { t: T.chainlink, tag: "CHAINLINK", cls: "t-cl", msg: [["oracle above strike · settlement source agrees"]] },
    { t: T.chainlink + 0.05, tag: "EXIT", cls: "t-gate", msg: [["complete the pair later: buy NO under "], [c.noMax, "v"], [" → YES+NO < $1"]] },
  ];
}

function newCycle(n) {
  const K = 77279.02 + ((n * 137) % 400) - 200;
  const S = K * (1 + (6 + (n % 4)) * 1e-4);
  const fair = 0.86 + (n % 5) * 0.02;
  const stale = 0.49 + (n % 4) * 0.02;
  const px = stale + 0.01;
  return {
    K: K.toFixed(2),
    S: S.toFixed(2),
    bid: (S - 0.005).toFixed(2),
    ask: (S + 0.005).toFixed(2),
    fair: fair.toFixed(2),
    stale: stale.toFixed(2),
    gap: (stale - fair).toFixed(2),
    obi: `+${(0.95 + (n % 4) * 0.01).toFixed(2)}`,
    ttx: 160 + ((n * 29) % 90),
    px: px.toFixed(2),
    fee: (0.07 * px * (1 - px)).toFixed(4),
    fresh: (fair + 0.02).toFixed(2),
    noMax: (1 - px - 0.02).toFixed(2),
  };
}

export default function PolyScene() {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const nodeLabels = useRef({});
  const bookRef = useRef(null);
  const [log, setLog] = useState([]);
  const [now, setNow] = useState(0);
  const [tab, setTab] = useState("sim");
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};
    import("three").then((THREE) => {
      if (disposed || !canvasRef.current) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      } catch {
        setWebgl(false);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      const rig = new THREE.Group();
      scene.add(rig);

      // nodes: dark slabs with a lit edge; the bot carries its four stages inside
      const nodeMesh = {};
      Object.entries(NODES).forEach(([k, n]) => {
        const g = new THREE.Group();
        g.position.set(...n.pos);
        const w = k === "bot" ? 2.2 : 1.5;
        const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.62, 0.62), new THREE.MeshBasicMaterial({ color: 0x1b1f2a, transparent: true, opacity: 0.85 }));
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: n.color, transparent: true, opacity: 0.55 }));
        g.add(box, edge);
        if (k === "bot") {
          g.userData.stages = [0, 1, 2, 3].map((i) => {
            const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.24), new THREE.MeshBasicMaterial({ color: 0x3a404c }));
            c.position.set(-0.75 + i * 0.5, 0, 0.34);
            g.add(c);
            return c;
          });
        }
        g.userData.edge = edge;
        g.userData.flash = 0;
        rig.add(g);
        nodeMesh[k] = g;
      });

      // links: arcs between nodes, faint until a packet runs on them
      const curves = {};
      PATHS.forEach((p) => {
        const a = new THREE.Vector3(...NODES[p.from].pos);
        const b = new THREE.Vector3(...NODES[p.to].pos);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.z += 0.9;
        mid.y += p.id === "sbe" || p.id === "order" ? 0.5 : -0.1;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.2 }));
        rig.add(line);
        const packet = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: p.color }));
        packet.visible = false;
        rig.add(packet);
        const trail = Array.from({ length: 6 }, (_, i) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.05 - i * 0.006, 10, 8), new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.5 - i * 0.07 }));
          m.visible = false;
          rig.add(m);
          return m;
        });
        curves[p.id] = { curve, line, packet, trail, p };
      });

      let cycle = 0;
      let c = newCycle(cycle);
      let lines = script(c);
      let shown = 0;
      let t = 0; // event time
      let out = [];

      const book = (text, cls) => {
        if (bookRef.current) {
          bookRef.current.textContent = text;
          bookRef.current.className = `poly-net__book ${cls}`;
        }
      };
      book(`YES ${c.stale} · stale`, "is-stale");

      const advance = (dt) => {
        t += dt / SLOW;
        if (t > CYCLE + 1.2) {
          cycle += 1;
          c = newCycle(cycle);
          lines = script(c);
          shown = 0;
          t = 0;
          out = [];
          book(`YES ${c.stale} · stale`, "is-stale");
        }
        while (shown < lines.length && lines[shown].t <= t) {
          const l = lines[shown];
          out = [...out, l];
          shown += 1;
          if (l.tag === "FILL") book(`filled YES @ ${c.px}`, "is-fill");
          if (l.tag === "RTDS") book(`YES ${c.fresh} · repriced`, "is-fresh");
          const target = { BINANCE: "binance", SBE: "bot", ORDER: "bot", FILL: "clob", RTDS: "clob", CHAINLINK: "chainlink" }[l.tag];
          if (target) nodeMesh[target].userData.flash = 1;
        }
        Object.values(curves).forEach(({ curve, line, packet, trail, p }) => {
          const k = (t - p.t0) / (p.t1 - p.t0);
          const live = k >= 0 && k <= 1;
          packet.visible = live;
          line.material.opacity = live ? 0.75 : t > p.t1 ? 0.35 : 0.14;
          if (live) {
            curve.getPoint(k, packet.position);
            trail.forEach((m, i) => {
              const kk = k - (i + 1) * 0.035;
              m.visible = kk > 0;
              if (kk > 0) curve.getPoint(kk, m.position);
            });
          } else trail.forEach((m) => (m.visible = false));
        });
        nodeMesh.bot.userData.stages.forEach((s, i) => {
          const on = t >= T.sbe + (i * T.decide) / 4 && t < CYCLE;
          s.material.color.setHex(on ? 0xc8ec5c : 0x3a404c);
        });
        Object.values(nodeMesh).forEach((g) => {
          g.userData.flash = Math.max(0, g.userData.flash - dt * 1.6);
          g.userData.edge.material.opacity = 0.5 + g.userData.flash * 0.5;
          g.scale.setScalar(1 + g.userData.flash * 0.06);
        });
      };

      let w = 1;
      let h = 1;
      const tmp = new THREE.Vector3();
      const placeLabels = () => {
        Object.entries(nodeMesh).forEach(([k, g]) => {
          const el = nodeLabels.current[k];
          if (!el) return;
          tmp.set(0, k === "chainlink" ? -0.55 : 0.55, 0);
          g.localToWorld(tmp);
          tmp.project(camera);
          el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%, ${k === "chainlink" ? "0" : "-100%"})`;
        });
      };
      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        w = r.width;
        h = Math.max(rem(18), Math.min(rem(26), w * 0.62));
        renderer.setSize(w, h, false);
        canvasRef.current.style.height = `${h}px`;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const tan = Math.tan((17 * Math.PI) / 180);
        // narrow screens squeeze the diagram sideways rather than shrink it
        const squeeze = w < rem(38) ? 0.6 : 1;
        rig.scale.set(squeeze, 1, 1);
        const z = Math.max((5.6 * squeeze + 0.6) / (tan * camera.aspect), 3.4 / tan);
        camera.position.set(0, 0.6, z);
        camera.lookAt(0, 0.1, 0);
      };

      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e) => {
        const r = wrap.current.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };

      let raf = 0;
      let visible = false;
      let last = performance.now();
      let lastUi = 0;
      const render = (nowMs) => {
        raf = 0;
        if (!visible || document.hidden) return;
        const dt = Math.max(0, Math.min(0.05, (nowMs - last) / 1000));
        last = nowMs;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        rig.rotation.y = pointer.x * 0.2;
        rig.rotation.x = pointer.y * 0.08;
        advance(dt);
        renderer.render(scene, camera);
        placeLabels();
        if (nowMs - lastUi > 90) {
          lastUi = nowMs;
          setLog(out);
          setNow(t);
        }
        raf = requestAnimationFrame(render);
      };
      const kick = () => {
        if (!raf && visible && !document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(render);
        }
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        kick();
      });
      const ro = new ResizeObserver(() => {
        resize();
        renderer.render(scene, camera);
        placeLabels();
      });
      ro.observe(wrap.current);
      resize();
      globalThis.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", kick);

      if (reduce) {
        advance(CYCLE * SLOW);
        renderer.render(scene, camera);
        placeLabels();
        setLog(out);
        setNow(CYCLE);
      } else io.observe(wrap.current);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        globalThis.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", kick);
        scene.traverse((o) => {
          o.geometry?.dispose?.();
          o.material?.dispose?.();
        });
        renderer.dispose();
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const max = T.chainlink;

  return (
    <figure className="poly-scene glass">
      <div className="poly-scene__stage" ref={wrap}>
        {webgl ? (
          <>
            <canvas ref={canvasRef} className="poly-scene__canvas" role="img" aria-label="Network diagram: Binance sends a price move to the bot in Dublin over SBE in 66 ms; the bot orders on Polymarket's book in about 310 ms; Polymarket's own relay reprices the book after about 795 ms and Chainlink, which settles, after about 1.65 s" />
            {Object.entries(NODES).map(([k, n]) => (
              <span key={k} className={`poly-net__node poly-net__node--${k}`} ref={(el) => (nodeLabels.current[k] = el)}>
                <b>
                  <span className="poly-net__long">{n.label}</span>
                  <span className="poly-net__short">{n.short}</span>
                </b>
                <small>{n.sub}</small>
                {k === "clob" && <i ref={bookRef} className="poly-net__book is-stale" />}
              </span>
            ))}
          </>
        ) : (
          <p className="relay-globe__fallback">This replay needs WebGL. The race is written out below it.</p>
        )}
        <ol className="poly-race" aria-label="Arrival times after a Binance price move">
          {RACE.map((r) => (
            <li key={r.key} className={`${r.cls}${now >= r.t ? " is-done" : ""}`}>
              <span className="poly-race__label">{r.label}</span>
              <span className="poly-race__bar">
                <i style={{ width: `${(Math.min(now, r.t) / max) * 100}%` }} />
                <em style={{ left: `${(r.t / max) * 100}%` }} />
              </span>
              <span className="poly-race__t num">{ms(r.t)}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="poly-scene__panel">
        <p className="relay-globe__note">One strike cross in slow motion, about 4× slower than life. The lags are measured; the prices are illustrative.</p>
        <div className="tabs tabs--row" role="tablist" aria-label="Log">
          <button type="button" role="tab" aria-selected={tab === "sim"} className="tabs__item" onClick={() => setTab("sim")}>
            Replay
          </button>
          <button type="button" role="tab" aria-selected={tab === "real"} className="tabs__item" onClick={() => setTab("real")}>
            From the bot's logs
          </button>
        </div>
        {tab === "sim" ? (
          <ol className="cli" aria-live="off">
            {log.map((l, i) => (
              <li key={`${l.tag}-${i}`} className="cli__row">
                <span className="cli__t num">{stamp(l.t)}</span>
                <span className={`cli__tag ${l.cls}`}>{l.tag}</span>
                <span className="cli__msg">
                  {l.msg.map(([text, kind], j) => (
                    <span key={j} className={kind ? `cli__${kind}` : undefined}>
                      {text}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="cli">
            {REAL.map(([time, tag, cls, msg], i) => (
              <li key={i} className="cli__row">
                <span className="cli__t num">{time}</span>
                <span className={`cli__tag ${cls}`}>{tag}</span>
                <span className="cli__msg">{msg}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </figure>
  );
}

// From the bot's own logs, with addresses, ids, hashes, balances and P&L removed.
const REAL = [
  ["12:22:04.405", "SBE", "t-sbe", "Using Binance SBE binary feed (@bestBidAsk + @depth20)"],
  ["12:22:05.080", "SBE", "t-sbe", "first depth20: bid_levels=20 ask_levels=20 book_imbalance=0.9190 depth_latency_ms=66"],
  ["12:22:05.148", "SBE", "t-sbe", "first bookTicker: bid=75994.25 ask=75994.26 price_latency_ms=66"],
  ["00:46:44.057", "ORDER", "t-order", "EMIT_CTX BUY_YES px=0.53 sz=10 ENTRY_BS_GAP bs_fair=0.9700 bs_gap=-0.475 OBI=+0.9717 ttx=195.9s"],
  ["00:49:57.014", "EXIT", "t-gate", "EMIT_CTX BUY_NO_HEDGE px=0.99 sz=10 reason=hard_stop ttx=3.0s"],
  ["06:12:53.057", "STATUS", "t-fair", "btc=77216.17 rtds=77216.18 strike=77279.01 gap=8.1bps LOCKED · rtds_adv=2.0bps"],
  ["06:12:56.961", "ORDER", "t-order", "TAIL_SELL_LOSER loser_bid=0.03 total_size=25 parallel=3"],
  ["06:15:25.683", "ORDER", "t-order", "ORDER_ACCEPTED Buy 5@$0.999 149ms [spam-no-tier0]"],
  ["06:18:27.803", "MARKET", "t-cl", "MARKET_END btc-updown-15m (NO>strike) fills=3"],
  ["06:19:28.301", "CLAIM", "t-relay", "GASLESS_CLAIM_SUBMITTED latency_ms=458 state=STATE_NEW"],
];
