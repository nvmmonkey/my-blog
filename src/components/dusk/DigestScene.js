import React, { useEffect, useRef, useState } from "react";
import { rem } from "./motion";

// A replay of one real LLM-Digest flagship run (#4844, 13 October 2026), time compressed.
// Stage names and durations come from that run; the particles are drawn, not counted.
// "Stall this stage" simulates the stream wall: the stage goes quiet, the fallback model
// takes over, and only that stage reruns.

export const STAGES = [
  { name: "Global news", line: "Themes and key events", secs: 65 },
  { name: "Global macro", line: "Regime, hedge pairs, geo risk", secs: 43 },
  { name: "Finance news", line: "Finance themes, trade ideas", secs: 45 },
  { name: "Tech news", line: "AI, chips, software", secs: 61 },
  { name: "Prediction markets", line: "Fair odds against the market", secs: 149 },
  { name: "Equities", line: "Single names, WSB plays", secs: 61 },
  { name: "Tech and crypto", line: "Crypto themes", secs: 74 },
  { name: "Final narrative", line: "Regime and hedge basket", secs: 64 },
  { name: "Funding arb", line: "Top three carries", secs: 36 },
];

const KINDS = [
  { key: "rss", label: "RSS", n: 98, color: 0xa8b0f2 },
  { key: "tg", label: "Telegram", n: 23, color: 0x88cada },
  { key: "hn", label: "HN and papers", n: 6, color: 0xf4ba87 },
  { key: "x", label: "X lists", n: 45, color: 0xf4f1ed },
];

const C = { rule: 0x2c313b, ringIdle: 0x3a404c, needle: 0xc8ec5c, stall: 0xf4ba87, fallback: 0xa8b0f2, ink: 0xf4f1ed };
const SPEED = 14; // real seconds per simulated second
const WALL = 3; // the three-minute stream wall, compressed
const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`);

function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function DigestScene({ compact = false }) {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const labels = useRef({});
  const control = useRef({ stall: false, replay: false });
  const [ui, setUi] = useState({ stage: -1, progress: 0, done: STAGES.map(() => false), fallback: -1, stalled: false, wall: 0, finished: false });
  const [webgl, setWebgl] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduce);
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
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      const rig = new THREE.Group();
      scene.add(rig);
      const rand = mulberry(4844);

      // sources: 127 feeds plus 45 X lists, a loose cloud on the left
      const sources = [];
      KINDS.forEach((k) => {
        for (let i = 0; i < k.n; i++) sources.push({ kind: k });
      });
      const srcGeo = new THREE.SphereGeometry(0.032, 10, 8);
      const srcMesh = new THREE.InstancedMesh(srcGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), sources.length);
      const m4 = new THREE.Matrix4();
      const col = new THREE.Color();
      sources.forEach((s, i) => {
        const u = rand() * 2 - 1;
        const th = rand() * Math.PI * 2;
        const r = 0.35 + Math.cbrt(rand()) * 0.85;
        const rr = Math.sqrt(1 - u * u) * r;
        s.pos = new THREE.Vector3(-4.1 + u * r * 0.55, Math.cos(th) * rr * 1.2, Math.sin(th) * rr);
        s.flash = 0;
        m4.makeTranslation(s.pos.x, s.pos.y, s.pos.z);
        srcMesh.setMatrixAt(i, m4);
        srcMesh.setColorAt(i, col.setHex(s.kind.color).multiplyScalar(0.55));
      });
      rig.add(srcMesh);

      // nine stage rings along the spine
      const spineX = (i) => -2.3 + i * 0.58;
      const spine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.6, 0, 0), new THREE.Vector3(3.3, 0, 0)]),
        new THREE.LineBasicMaterial({ color: C.rule })
      );
      rig.add(spine);
      const rings = STAGES.map((_, i) => {
        const g = new THREE.Group();
        g.position.set(spineX(i), 0, 0);
        g.rotation.y = Math.PI / 2;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.016, 10, 96), new THREE.MeshBasicMaterial({ color: C.ringIdle }));
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshBasicMaterial({ color: C.needle, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.06, 8, 96), new THREE.MeshBasicMaterial({ color: C.needle, transparent: true, opacity: 0, depthWrite: false }));
        g.add(ring, disc, halo);
        rig.add(g);
        return { g, ring, disc, halo, glow: 0 };
      });

      // the report: nine rows that fill as each stage hands its conclusion over
      const report = new THREE.Group();
      report.position.set(4.05, 0, 0);
      report.rotation.y = -0.35;
      const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.15, 1.6)), new THREE.LineBasicMaterial({ color: C.ringIdle }));
      report.add(frame);
      const rows = STAGES.map((_, i) => {
        const w = i === 7 ? 0.9 : 0.5 + ((i * 37) % 30) / 100;
        const row = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.055), new THREE.MeshBasicMaterial({ color: C.ringIdle, transparent: true, opacity: 0.6 }));
        row.position.set(-0.45 + w / 2, 0.6 - i * 0.145, 0.001);
        report.add(row);
        return row;
      });
      rig.add(report);

      // particles: posts on their way into the stage that is reading
      const POOL = 260;
      const pGeo = new THREE.SphereGeometry(0.022, 8, 6);
      const pMesh = new THREE.InstancedMesh(pGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), POOL);
      pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const parts = Array.from({ length: POOL }, () => ({ live: false, t: 0, curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()), speed: 1 }));
      parts.forEach((_, i) => {
        m4.makeScale(0, 0, 0);
        pMesh.setMatrixAt(i, m4);
        pMesh.setColorAt(i, col.setHex(C.ink));
      });
      rig.add(pMesh);

      // hand-off: one bright conclusion travelling to the next ring, or to the report
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: C.needle }));
      hand.visible = false;
      rig.add(hand);
      const handCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
      let handT = 1;

      // run state
      const run = { stage: 0, elapsed: 0, done: STAGES.map(() => false), fallback: -1, stalled: false, wall: 0, finished: false, hold: 0 };
      let carry = 0;
      const tmp = new THREE.Vector3();

      const spawn = (from, to, kindColor) => {
        const p = parts.find((x) => !x.live);
        if (!p) return;
        p.live = true;
        p.t = 0;
        p.speed = 0.8 + rand() * 0.5;
        p.curve.v0.copy(from);
        const a = rand() * Math.PI * 2;
        const rr = Math.sqrt(rand()) * 0.44;
        p.curve.v2.set(to.x, Math.cos(a) * rr, Math.sin(a) * rr);
        p.curve.v1.copy(from).add(p.curve.v2).multiplyScalar(0.5);
        p.curve.v1.y += (rand() - 0.5) * 1.4;
        p.curve.v1.z += 0.4 + rand() * 0.8;
        p.color = kindColor;
        pMesh.setColorAt(parts.indexOf(p), col.setHex(kindColor));
        pMesh.instanceColor.needsUpdate = true;
      };

      const startHand = (i) => {
        handT = 0;
        hand.visible = true;
        handCurve.v0.set(spineX(i), 0, 0);
        if (i < STAGES.length - 1) handCurve.v2.set(spineX(i + 1), 0, 0);
        else handCurve.v2.copy(report.position);
        handCurve.v1.copy(handCurve.v0).add(handCurve.v2).multiplyScalar(0.5);
        handCurve.v1.y += 0.55;
      };

      const reset = () => {
        run.stage = 0;
        run.elapsed = 0;
        run.done = STAGES.map(() => false);
        run.fallback = -1;
        run.stalled = false;
        run.wall = 0;
        run.finished = false;
        run.hold = 0;
        parts.forEach((p) => (p.live = false));
        hand.visible = false;
        handT = 1;
      };

      const finishStage = () => {
        run.done[run.stage] = true;
        startHand(run.stage);
        run.stage += 1;
        run.elapsed = 0;
        if (run.stage >= STAGES.length) {
          run.finished = true;
          run.hold = 0;
        }
      };

      const step = (dt) => {
        if (control.current.replay) {
          control.current.replay = false;
          reset();
        }
        if (control.current.stall) {
          control.current.stall = false;
          if (!run.finished && !run.stalled) {
            run.stalled = true;
            run.wall = 0;
          }
        }
        if (run.finished) {
          run.hold += dt;
          if (run.hold > 6) reset();
        } else if (run.stalled) {
          // the stream goes quiet; after the wall the fallback restarts this stage alone
          run.wall += dt;
          if (run.wall >= WALL) {
            run.stalled = false;
            run.fallback = run.stage;
            run.elapsed = 0;
          }
        } else {
          run.elapsed += dt;
          const s = STAGES[run.stage];
          // the final narrative reads the earlier stages; every other stage reads the feeds
          carry += dt * (run.stage === 7 ? 26 : 34);
          while (carry >= 1) {
            carry -= 1;
            if (run.stage === 7) {
              const k = Math.floor(rand() * 7);
              spawn(tmp.set(spineX(k), 0, 0), rings[7].g.position, C.needle);
            } else {
              const src = sources[Math.floor(rand() * sources.length)];
              src.flash = 1;
              spawn(src.pos, rings[run.stage].g.position, src.kind.color);
            }
          }
          if (run.elapsed >= s.secs / SPEED) finishStage();
        }

        // particles
        parts.forEach((p, i) => {
          if (!p.live) return;
          p.t += dt * p.speed;
          if (p.t >= 1) {
            p.live = false;
            m4.makeScale(0, 0, 0);
          } else {
            p.curve.getPoint(p.t, tmp);
            const sc = p.t > 0.85 ? (1 - p.t) / 0.15 : 1;
            m4.makeScale(sc, sc, sc).setPosition(tmp);
          }
          pMesh.setMatrixAt(i, m4);
        });
        pMesh.instanceMatrix.needsUpdate = true;

        // source flashes
        let flashed = false;
        sources.forEach((s, i) => {
          if (s.flash <= 0) return;
          s.flash = Math.max(0, s.flash - dt * 3);
          srcMesh.setColorAt(i, col.setHex(s.kind.color).multiplyScalar(0.55 + s.flash * 0.6));
          flashed = true;
        });
        if (flashed) srcMesh.instanceColor.needsUpdate = true;

        // rings
        rings.forEach((r, i) => {
          const active = !run.finished && i === run.stage;
          const target = active ? 1 : run.done[i] ? 0.35 : 0;
          r.glow += (target - r.glow) * Math.min(1, dt * 5);
          let c = C.needle;
          if (active && run.stalled) c = C.stall;
          else if (i === run.fallback) c = C.fallback;
          const idle = !active && !run.done[i];
          r.ring.material.color.setHex(idle ? C.ringIdle : c);
          r.disc.material.color.setHex(c);
          r.halo.material.color.setHex(c);
          const beat = active && !run.stalled ? 0.5 + 0.5 * Math.sin(performance.now() / 180) : 1;
          r.disc.material.opacity = r.glow * (active ? 0.1 + 0.06 * beat : 0.05);
          r.halo.material.opacity = r.glow * (active ? 0.35 * beat : 0.12);
          const sc = active ? 1.08 : 1;
          r.g.scale.setScalar(r.g.scale.x + (sc - r.g.scale.x) * Math.min(1, dt * 6));
        });
        rows.forEach((row, i) => {
          row.material.color.setHex(run.done[i] ? (i === run.fallback ? C.fallback : C.needle) : C.ringIdle);
          row.material.opacity = run.done[i] ? 0.95 : 0.45;
        });
        frame.material.color.setHex(run.finished ? C.needle : C.ringIdle);

        if (handT < 1) {
          handT = Math.min(1, handT + dt * 1.6);
          handCurve.getPoint(handT, hand.position);
          if (handT >= 1) hand.visible = false;
        }
      };

      // layout: left to right when wide, top to bottom on a phone
      let vertical = false;
      const tan = Math.tan((35 / 2) * (Math.PI / 180));
      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        const w = r.width;
        vertical = w < rem(38);
        const h = vertical ? Math.min(rem(40), w * 1.5) : Math.max(rem(18), Math.min(rem(30), w * 0.36));
        renderer.setSize(w, h, false);
        canvasRef.current.style.height = `${h}px`;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const L = 5.2;
        const X = 1.45;
        const aspect = camera.aspect;
        const z = vertical ? Math.max(L / tan, X / (tan * aspect)) : Math.max(L / (tan * aspect), X / tan);
        rig.rotation.z = vertical ? -Math.PI / 2 : 0;
        camera.position.set(0, 0.15, z * 1.04);
        camera.lookAt(0, 0, 0);
        base.z = camera.position.z;
      };
      const base = { z: 10 };

      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e) => {
        const r = wrap.current.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };

      const anchors = {
        sources: new THREE.Vector3(-4.1, -1.35, 0),
        stages: new THREE.Vector3(0.02, -0.85, 0),
        report: new THREE.Vector3(4.05, -1.0, 0),
      };
      const placeLabels = () => {
        const r = canvasRef.current.getBoundingClientRect();
        Object.entries(anchors).forEach(([k, v]) => {
          const el = labels.current[k];
          if (!el) return;
          tmp.copy(v);
          rig.localToWorld(tmp);
          tmp.project(camera);
          const x = (tmp.x * 0.5 + 0.5) * r.width;
          const y = (-tmp.y * 0.5 + 0.5) * r.height;
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
        });
      };

      let raf = 0;
      let visible = false;
      let last = performance.now();
      let lastUi = 0;
      const render = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        rig.rotation.y = pointer.x * 0.22;
        rig.rotation.x = pointer.y * 0.12 + Math.sin(now / 4000) * 0.03;
        step(dt);
        renderer.render(scene, camera);
        placeLabels();
        if (now - lastUi > 160) {
          lastUi = now;
          const s = STAGES[run.stage];
          setUi({
            stage: run.finished ? STAGES.length : run.stage,
            progress: s ? Math.min(1, run.elapsed / (s.secs / SPEED)) : 1,
            done: run.done.slice(),
            fallback: run.fallback,
            stalled: run.stalled,
            wall: run.wall / WALL,
            finished: run.finished,
          });
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
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", kick);

      if (reduce) {
        // the finished run, held still
        run.done = STAGES.map(() => true);
        run.finished = true;
        run.stage = STAGES.length;
        step(0.016);
        rings.forEach((r) => (r.glow = 0.35));
        step(0);
        renderer.render(scene, camera);
        placeLabels();
        setUi({ stage: STAGES.length, progress: 1, done: STAGES.map(() => true), fallback: -1, stalled: false, wall: 0, finished: true });
      } else {
        io.observe(wrap.current);
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
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

  const model = ui.fallback >= 0 && ui.stage <= ui.fallback ? "fallback model" : ui.stalled ? "stream quiet" : "claude-opus-5-5";

  return (
    <figure className={compact ? "digest-scene digest-scene--compact glass" : "digest-scene glass"}>
      <div className="digest-scene__stage" ref={wrap}>
        {webgl ? (
          <>
            <canvas ref={canvasRef} className="digest-scene__canvas" role="img" aria-label="Sources stream into nine stage rings in turn; each stage hands its conclusion to the next and the last fills the report" />
            <span className="digest-scene__label" ref={(el) => (labels.current.sources = el)}>
              <strong className="num">127</strong> sources + 45 X lists
            </span>
            <span className="digest-scene__label" ref={(el) => (labels.current.stages = el)}>
              <strong className="num">9</strong> LLM stages
            </span>
            <span className="digest-scene__label" ref={(el) => (labels.current.report = el)}>
              one report
            </span>
          </>
        ) : (
          <p className="relay-globe__fallback">This replay needs WebGL. The nine stages are listed beside it.</p>
        )}
      </div>
      <div className="digest-scene__panel">
        <p className="relay-globe__note">
          Replay of flagship run #4844, 13 Oct 2026, about {SPEED}× faster. The stall is simulated.
        </p>
        <ol className="stages">
          {STAGES.map((s, i) => {
            const state = ui.done[i] ? (i === ui.fallback ? "is-fallback" : "is-done") : i === ui.stage ? (ui.stalled ? "is-stalled" : "is-active") : "";
            return (
              <li key={s.name} className={`stages__item ${state}`}>
                <span className="stages__n num">{String(i + 1).padStart(2, "0")}</span>
                <span className="stages__text">
                  <span className="stages__name">{s.name}</span>
                  {!compact && <span className="stages__line">{s.line}</span>}
                </span>
                <span className="stages__secs num">{fmt(s.secs)}</span>
                <span className="stages__bar" style={{ "--p": ui.done[i] ? 1 : i === ui.stage ? (ui.stalled ? ui.wall : ui.progress) : 0 }} />
              </li>
            );
          })}
        </ol>
        <dl className="tally">
          <div>
            <dt>Took</dt>
            <dd className="num">13m 38s</dd>
          </div>
          <div>
            <dt>Read, tokens</dt>
            <dd className="num">489k</dd>
          </div>
          <div>
            <dt>Wrote, tokens</dt>
            <dd className="num">53.5k</dd>
          </div>
        </dl>
        <p className="digest-scene__model">
          <span>Writing with</span> <code>{model}</code>
        </p>
        {!still && (
          <div className="digest-scene__actions">
            <button type="button" className="btn btn--ghost btn--sm" disabled={ui.finished || ui.stalled} onClick={() => (control.current.stall = true)}>
              Stall this stage
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => (control.current.replay = true)}>
              Replay
            </button>
          </div>
        )}
        {ui.stalled && <p className="relay-globe__note">No tokens for three minutes. The fallback model reruns this stage only.</p>}
        {ui.finished && <p className="relay-globe__note">Verdict: mixed regime, three hedge pairs.</p>}
      </div>
    </figure>
  );
}
