import React, { useEffect, useRef, useState } from "react";

// A simulation of the relay's routing, not a feed of real traffic. Bundles leave the relay,
// are held at the in-flight cap, and travel to one regional block engine: round-robin on the
// rotating port, or the one region a pinned port names.

const REGIONS = [
  { name: "New York", port: 8001, lat: 40.7, lon: -74 },
  { name: "Amsterdam", port: 8002, lat: 52.37, lon: 4.9 },
  { name: "Frankfurt", port: 8003, lat: 50.11, lon: 8.68 },
  { name: "Tokyo", port: 8004, lat: 35.68, lon: 139.69 },
  { name: "Salt Lake City", port: 8005, lat: 40.76, lon: -111.89 },
  { name: "London", port: 8006, lat: 51.5, lon: -0.12 },
  { name: "Singapore", port: 8007, lat: 1.35, lon: 103.82 },
  { name: "Dublin", port: 8008, lat: 53.35, lon: -6.26 },
];

const COLORS = { rule: 0x2a2e36, globe: 0x1e212a, needle: 0x88cada, ink: 0xf4f1ed, muted: 0x999fa9, held: 0xf4ba87 };

function toVec(THREE, lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export default function RelayGlobe() {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const state = useRef({ mode: "rotate", pinned: 0, rate: 40, cap: 24 });
  const [mode, setMode] = useState("rotate");
  const [pinned, setPinned] = useState(0);
  const [rate, setRate] = useState(40);
  const [cap, setCap] = useState(24);
  const [stats, setStats] = useState({ inflight: 0, held: 0, landed: REGIONS.map(() => 0) });
  const [webgl, setWebgl] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    state.current = { mode, pinned, rate, cap };
  }, [mode, pinned, rate, cap]);

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
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.5, 7.4);
      camera.lookAt(-0.2, 0.45, 0);

      const R = 1.6;
      const world = new THREE.Group();
      world.rotation.y = -1.9;
      world.rotation.x = 0.45;
      scene.add(world);

      world.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 48), new THREE.MeshBasicMaterial({ color: COLORS.globe })));
      // graticule hairlines
      const grat = [];
      for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = 0; lon < 360; lon += 4) grat.push(toVec(THREE, lat, lon, R), toVec(THREE, lat, lon + 4, R));
      }
      for (let lon = -180; lon < 180; lon += 30) {
        for (let lat = -84; lat < 84; lat += 4) grat.push(toVec(THREE, lat, lon, R), toVec(THREE, lat + 4, lon, R));
      }
      world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(grat), new THREE.LineBasicMaterial({ color: COLORS.rule })));

      // the relay stays fixed beside the globe, outside any real location; the globe turns under it
      const hubPos = new THREE.Vector3(-2.15, 1.55, 0.6);
      const hub = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 12, 48), new THREE.MeshBasicMaterial({ color: COLORS.ink }));
      hub.position.copy(hubPos);
      scene.add(hub);

      const regionMeshes = [];
      const SEG = 48;
      const arcs = REGIONS.map((reg) => {
        const end = toVec(THREE, reg.lat, reg.lon, R);
        const curve = new THREE.QuadraticBezierCurve3(hubPos.clone(), new THREE.Vector3(), new THREE.Vector3());
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COLORS.needle, transparent: true, opacity: 0.18 }));
        scene.add(line);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.needle }));
        dot.position.copy(end);
        world.add(dot);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.062, 32), new THREE.MeshBasicMaterial({ color: COLORS.needle, transparent: true, opacity: 0, side: THREE.DoubleSide }));
        ring.position.copy(end.clone().multiplyScalar(1.002));
        ring.lookAt(end.clone().multiplyScalar(2));
        world.add(ring);
        regionMeshes.push({ ring, pulse: 0 });
        return { curve, line, end };
      });

      // the arcs follow their regions as the globe turns
      const tmp = new THREE.Vector3();
      const updateArcs = () => {
        world.updateMatrixWorld();
        for (const a of arcs) {
          const endW = world.localToWorld(tmp.copy(a.end));
          a.curve.v2.copy(endW);
          const mid = a.curve.v1.copy(hubPos).add(endW).multiplyScalar(0.5);
          mid.setLength(Math.max(R * 1.35, mid.length() + 0.5));
          const pos = a.line.geometry.attributes.position;
          for (let k = 0; k <= SEG; k++) {
            a.curve.getPoint(k / SEG, tmp);
            pos.setXYZ(k, tmp.x, tmp.y, tmp.z);
          }
          pos.needsUpdate = true;
          a.line.geometry.computeBoundingSphere();
        }
      };

      // packets: a fixed pool of small spheres
      const POOL = 160;
      const packetGeo = new THREE.SphereGeometry(0.02, 8, 6);
      const packetMat = new THREE.MeshBasicMaterial({ color: COLORS.ink });
      const packets = Array.from({ length: POOL }, () => {
        const m = new THREE.Mesh(packetGeo, packetMat);
        m.visible = false;
        scene.add(m);
        return { mesh: m, t: 0, region: 0, live: false };
      });
      const heldMat = new THREE.MeshBasicMaterial({ color: COLORS.held });
      const heldDots = Array.from({ length: 24 }, (_, i) => {
        const m = new THREE.Mesh(packetGeo, heldMat);
        const a = (i / 24) * Math.PI * 2;
        m.position.set(hubPos.x + Math.cos(a) * 0.22, hubPos.y + Math.sin(a) * 0.22, hubPos.z);
        m.visible = false;
        scene.add(m);
        return m;
      });

      let queue = 0;
      let rr = 0;
      let carry = 0;
      const landed = REGIONS.map(() => 0);
      let lastStats = 0;
      let raf = 0;
      let visible = false;
      let last = performance.now();
      let drag = null;
      let spin = 0.05;

      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        const w = r.width;
        const h = Math.max(320, Math.min(560, w * 0.72));
        renderer.setSize(w, h, false);
        canvasRef.current.style.height = `${h}px`;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const step = (dt) => {
        const s = state.current;
        carry += s.rate * dt;
        while (carry >= 1) {
          carry -= 1;
          queue = Math.min(queue + 1, 400);
        }
        let inflight = packets.reduce((n, p) => n + (p.live ? 1 : 0), 0);
        while (queue > 0 && inflight < s.cap) {
          const free = packets.find((p) => !p.live);
          if (!free) break;
          free.live = true;
          free.t = 0;
          free.region = s.mode === "rotate" ? rr++ % REGIONS.length : s.pinned;
          free.mesh.visible = true;
          queue -= 1;
          inflight += 1;
        }
        for (const p of packets) {
          if (!p.live) continue;
          p.t += dt * 0.9;
          if (p.t >= 1) {
            p.live = false;
            p.mesh.visible = false;
            landed[p.region] += 1;
            regionMeshes[p.region].pulse = 1;
            continue;
          }
          p.mesh.position.copy(arcs[p.region].curve.getPointAt(p.t));
        }
        heldDots.forEach((m, i) => {
          m.visible = i < Math.min(queue, heldDots.length);
        });
        regionMeshes.forEach((r) => {
          r.pulse = Math.max(0, r.pulse - dt * 2.2);
          r.ring.material.opacity = r.pulse * 0.9;
          const k = 1 + (1 - r.pulse) * 1.6;
          r.ring.scale.setScalar(k);
        });
        arcs.forEach((a, i) => {
          const on = s.mode === "rotate" || i === s.pinned;
          a.line.material.opacity = on ? 0.3 : 0.06;
        });
        return inflight;
      };

      const render = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!drag) world.rotation.y += spin * dt;
        hub.rotation.x += dt * 0.6;
        updateArcs();
        const inflight = step(dt);
        renderer.render(scene, camera);
        if (now - lastStats > 250) {
          lastStats = now;
          setStats({ inflight, held: queue, landed: landed.slice() });
        }
        raf = requestAnimationFrame(render);
      };
      const kick = () => {
        if (!raf && visible && !document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(render);
        }
      };

      const onDown = (e) => {
        drag = { x: e.clientX, y: e.clientY, ry: world.rotation.y, rx: world.rotation.x };
        canvasRef.current.setPointerCapture(e.pointerId);
      };
      const onMove = (e) => {
        if (!drag) return;
        world.rotation.y = drag.ry + (e.clientX - drag.x) * 0.006;
        world.rotation.x = Math.max(-0.6, Math.min(0.8, drag.rx + (e.clientY - drag.y) * 0.004));
      };
      const onUp = () => {
        drag = null;
      };
      const c = canvasRef.current;
      c.addEventListener("pointerdown", onDown);
      c.addEventListener("pointermove", onMove);
      c.addEventListener("pointerup", onUp);
      c.addEventListener("pointercancel", onUp);

      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        kick();
      });
      io.observe(wrap.current);
      const ro = new ResizeObserver(() => {
        resize();
        if (reduce) renderer.render(scene, camera);
      });
      ro.observe(wrap.current);
      resize();
      document.addEventListener("visibilitychange", kick);

      updateArcs();
      if (reduce) {
        // one still frame with a few packets placed along their arcs
        packets.slice(0, 8).forEach((p, i) => {
          p.mesh.visible = true;
          p.mesh.position.copy(arcs[i].curve.getPointAt(0.35 + (i % 3) * 0.2));
        });
        renderer.render(scene, camera);
        visible = false;
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", kick);
        c.removeEventListener("pointerdown", onDown);
        c.removeEventListener("pointermove", onMove);
        c.removeEventListener("pointerup", onUp);
        c.removeEventListener("pointercancel", onUp);
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

  const total = stats.landed.reduce((a, b) => a + b, 0);

  return (
    <figure className="relay-globe glass">
      <div className="relay-globe__stage" ref={wrap}>
        {webgl ? (
          <canvas ref={canvasRef} className="relay-globe__canvas" aria-label="Globe with the relay above it and arcs to eight regional block engines" role="img" />
        ) : (
          <p className="relay-globe__fallback">This simulation needs WebGL. The routing is described in the list beside it.</p>
        )}
      </div>
      <div className="relay-globe__panel">
        <p className="relay-globe__note">Simulation. Nothing here is live traffic.</p>
        <div className="tabs" role="radiogroup" aria-label="Port">
          <button type="button" role="radio" aria-checked={mode === "rotate"} className="tabs__item" onClick={() => setMode("rotate")}>
            Port 6000, rotating
          </button>
          <button type="button" role="radio" aria-checked={mode === "pin"} className="tabs__item" onClick={() => setMode("pin")}>
            Pinned port, one region
          </button>
        </div>
        <ul className="relay-globe__regions">
          {REGIONS.map((r, i) => {
            const active = mode === "rotate" || i === pinned;
            return (
              <li key={r.name}>
                <button
                  type="button"
                  className={active ? "region is-active" : "region"}
                  aria-pressed={mode === "pin" && i === pinned}
                  onClick={() => {
                    setMode("pin");
                    setPinned(i);
                  }}
                >
                  <span className="region__name">{r.name}</span>
                  <span className="region__port num">{r.port}</span>
                  <span className="region__count num">{stats.landed[i]}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="relay-globe__controls">
          <label className="slider">
            <span>Arrivals a second</span>
            <span className="num slider__value">{rate}</span>
            <input type="range" min="5" max="120" step="5" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </label>
          <label className="slider">
            <span>In-flight cap</span>
            <span className="num slider__value">{cap}</span>
            <input type="range" min="4" max="96" step="4" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
          </label>
        </div>
        <dl className="tally">
          <div>
            <dt>In flight</dt>
            <dd className="num">{stats.inflight}</dd>
          </div>
          <div>
            <dt>Held at the cap</dt>
            <dd className="num tally__open">{stats.held}</dd>
          </div>
          <div>
            <dt>Delivered</dt>
            <dd className="num">{total}</dd>
          </div>
        </dl>
        {still && <p className="relay-globe__note">Motion is reduced, so the globe holds still.</p>}
      </div>
    </figure>
  );
}
