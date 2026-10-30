import React, { useEffect, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

// A simulation of the relay's routing, not a feed of real traffic. Bundles leave the relay,
// are held at the in-flight cap, and arc over the atmosphere to one regional block engine:
// round-robin on the rotating port, or the one region a pinned port names. Some landings
// pop a circular-arbitrage route with a random small gain; routes, amounts and totals are
// all invented for the picture and are not trades or returns.

const REGIONS = [
  { name: "New York", port: 8001, lat: 40.7, lon: -74 },
  { name: "Amsterdam", port: 8002, lat: 52.37, lon: 4.9, label: "Europe ×4" },
  { name: "Frankfurt", port: 8003, lat: 50.11, lon: 8.68, label: "" },
  { name: "Tokyo", port: 8004, lat: 35.68, lon: 139.69 },
  { name: "Salt Lake City", port: 8005, lat: 40.76, lon: -111.89 },
  { name: "London", port: 8006, lat: 51.5, lon: -0.12, label: "" },
  { name: "Singapore", port: 8007, lat: 1.35, lon: 103.82 },
  { name: "Dublin", port: 8008, lat: 53.35, lon: -6.26, label: "" },
];

const ROUTES = [
  { path: "USDC → SOL → USDC", unit: "USDC", lo: 0.001, hi: 0.006 },
  { path: "USDC → JUP → SOL → USDC", unit: "USDC", lo: 0.002, hi: 0.009 },
  { path: "SOL → SPCX → USDC → SOL", unit: "SOL", lo: 0.002, hi: 0.012 },
  { path: "SOL → BONK → SOL", unit: "SOL", lo: 0.001, hi: 0.008 },
  { path: "USDC → WIF → SOL → USDC", unit: "USDC", lo: 0.001, hi: 0.005 },
  { path: "SOL → JTO → USDC → SOL", unit: "SOL", lo: 0.002, hi: 0.01 },
];

const COLORS = { needle: 0x88cada, ink: 0xf4f1ed, held: 0xf4ba87 };
const DAY_SECONDS = 48; // one turn of the globe is one simulated day
const POPS = 7;

function toVec(THREE, lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const EARTH_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uLand;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float land = texture2D(uLand, vUv).r;
    // a dot grid in latitude and longitude, wider apart near the poles
    float lat = (vUv.y - 0.5) * 3.14159;
    vec2 grid = vec2(vUv.x * 220.0 * max(cos(lat), 0.2), vUv.y * 110.0);
    vec2 cell = floor(grid);
    float d = length(fract(grid) - 0.5);
    float dotMask = smoothstep(0.34, 0.22, d);

    float ndl = dot(normalize(vNormalW), normalize(uSun));
    float day = smoothstep(-0.12, 0.28, ndl);

    vec3 seaNight = vec3(0.055, 0.065, 0.1);
    vec3 seaDay = vec3(0.13, 0.19, 0.3);
    vec3 landNight = vec3(0.16, 0.17, 0.24);
    vec3 landDay = vec3(0.6, 0.66, 0.92);
    vec3 col = mix(seaNight, seaDay, day);
    col = mix(col, mix(seaNight, seaDay, day) * 1.25, land * 0.6);
    col = mix(col, mix(landNight, landDay, day), land * dotMask);

    // scattered warm city lights on the night side
    float city = step(0.86, hash(cell)) * land * dotMask * (1.0 - day);
    col += vec3(1.0, 0.72, 0.42) * city * 0.9;

    // the terminator gets a thin dusk band
    float dusk = smoothstep(0.0, 0.12, ndl) * (1.0 - smoothstep(0.12, 0.3, ndl));
    col += vec3(0.9, 0.5, 0.3) * dusk * 0.12;

    float rim = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 3.0);
    col += vec3(0.55, 0.62, 1.0) * rim * 0.35;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uSun;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormalW), vViewDir)), 2.2);
    float lit = 0.35 + 0.65 * smoothstep(-0.4, 0.5, dot(normalize(vNormalW), normalize(uSun)));
    gl_FragColor = vec4(vec3(0.55, 0.65, 1.0) * lit, rim * 0.75);
  }
`;

export default function RelayGlobe() {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const labelRefs = useRef([]);
  const popRefs = useRef([]);
  const state = useRef({ mode: "rotate", pinned: 0, rate: 40, cap: 24 });
  const [mode, setMode] = useState("rotate");
  const [pinned, setPinned] = useState(0);
  const [rate, setRate] = useState(40);
  const [cap, setCap] = useState(24);
  const [stats, setStats] = useState({ inflight: 0, held: 0, landed: REGIONS.map(() => 0) });
  const [day, setDay] = useState({ n: 1, clock: "06:00", cycles: 0, sol: 0, usdc: 0, past: [] });
  const [webgl, setWebgl] = useState(true);
  const [still, setStill] = useState(false);
  const landUrl = useBaseUrl("/img/globe-land.png");

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
      const tilt = new THREE.Group();
      tilt.rotation.x = 0.35;
      tilt.rotation.z = -0.2;
      scene.add(tilt);
      const world = new THREE.Group();
      world.rotation.y = -1.9;
      tilt.add(world);

      const sun = new THREE.Vector3(1.2, 0.35, 0.9).normalize();
      const land = new THREE.TextureLoader().load(landUrl, () => renderer.render(scene, camera));
      land.colorSpace = THREE.NoColorSpace;
      const earthMat = new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG, uniforms: { uLand: { value: land }, uSun: { value: sun } } });
      world.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), earthMat));
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.08, 64, 48),
        new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: ATMO_FRAG, uniforms: { uSun: { value: sun } }, transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      tilt.add(atmo);

      // the relay stays fixed beside the globe; the globe turns under it
      const hubPos = new THREE.Vector3(-2.25, 1.7, 0.7);
      const hub = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 12, 48), new THREE.MeshBasicMaterial({ color: COLORS.ink }));
      hub.position.copy(hubPos);
      scene.add(hub);

      // arcs ride a great circle from the hub's direction to the region, always above the air
      const SEG = 64;
      const ga = new THREE.Vector3();
      const gb = new THREE.Vector3();
      const arcPoint = (from, to, t, out) => {
        ga.copy(from).normalize();
        gb.copy(to).normalize();
        const omega = Math.acos(Math.min(1, Math.max(-1, ga.dot(gb))));
        const s = Math.sin(omega) || 1;
        ga.multiplyScalar(Math.sin((1 - t) * omega) / s).add(gb.multiplyScalar(Math.sin(t * omega) / s)).normalize();
        const r = from.length() * (1 - t) + to.length() * t + (0.25 + (0.45 * omega) / Math.PI) * Math.sin(Math.PI * t);
        return out.copy(ga).multiplyScalar(r);
      };

      const regionMeshes = [];
      const arcs = REGIONS.map((reg) => {
        const end = toVec(THREE, reg.lat, reg.lon, R * 1.004);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COLORS.needle, transparent: true, opacity: 0.18 }));
        scene.add(line);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.needle }));
        dot.position.copy(end);
        world.add(dot);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.062, 32), new THREE.MeshBasicMaterial({ color: COLORS.needle, transparent: true, opacity: 0, side: THREE.DoubleSide }));
        ring.position.copy(end.clone().multiplyScalar(1.002));
        ring.lookAt(end.clone().multiplyScalar(2));
        world.add(ring);
        regionMeshes.push({ ring, pulse: 0 });
        return { line, end, endW: new THREE.Vector3() };
      });

      const tmp = new THREE.Vector3();
      const tmp2 = new THREE.Vector3();
      const updateArcs = () => {
        scene.updateMatrixWorld();
        for (const a of arcs) {
          a.endW.copy(a.end);
          world.localToWorld(a.endW);
          const pos = a.line.geometry.attributes.position;
          for (let k = 0; k <= SEG; k++) {
            arcPoint(hubPos, a.endW, k / SEG, tmp);
            pos.setXYZ(k, tmp.x, tmp.y, tmp.z);
          }
          pos.needsUpdate = true;
          a.line.geometry.computeBoundingSphere();
        }
      };

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

      // arbitrage pops: HTML labels that bounce up from a region and fade
      const pops = Array.from({ length: POPS }, () => ({ live: false, age: 0, region: 0 }));
      let popNext = 0;
      const today = { cycles: 0, sol: 0, usdc: 0 };
      const past = [];
      let dayN = 1;
      let lastHour = -1;

      const spawnPop = (region) => {
        const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
        const amt = route.lo + Math.random() * (route.hi - route.lo);
        if (route.unit === "SOL") today.sol += amt;
        else today.usdc += amt;
        today.cycles += 1;
        const i = popNext;
        popNext = (popNext + 1) % POPS;
        pops[i].live = true;
        pops[i].age = 0;
        pops[i].region = region;
        const el = popRefs.current[i];
        if (el) {
          el.querySelector("b").textContent = `+${amt.toFixed(3)} ${route.unit}`;
          el.querySelector("span").textContent = route.path;
        }
      };

      let queue = 0;
      let rr = 0;
      let carry = 0;
      const landed = REGIONS.map(() => 0);
      let lastStats = 0;
      let raf = 0;
      let visible = false;
      let last = performance.now();
      let drag = null;
      const spin = (Math.PI * 2) / DAY_SECONDS;
      let w = 1;
      let h = 1;

      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        w = r.width;
        h = Math.max(320, Math.min(560, w * 0.72));
        renderer.setSize(w, h, false);
        canvasRef.current.style.height = `${h}px`;
        camera.aspect = w / h;
        // pull back on narrow screens so the relay and the far arcs stay in frame
        camera.position.set(0, 0.5, 7.4 * Math.max(1, 1.3 / camera.aspect));
        camera.lookAt(-0.2, 0.45, 0);
        camera.updateProjectionMatrix();
      };

      const project = (v) => {
        tmp2.copy(v).project(camera);
        return [(tmp2.x * 0.5 + 0.5) * w, (-tmp2.y * 0.5 + 0.5) * h];
      };
      const facing = (v) => tmp2.copy(v).normalize().dot(tmp.copy(camera.position).sub(v).normalize()) > 0.05;

      const placeOverlays = () => {
        arcs.forEach((a, i) => {
          const el = labelRefs.current[i];
          if (!el) return;
          const [x, y] = project(a.endW);
          el.style.opacity = facing(a.endW) ? "1" : "0";
          el.style.transform = `translate(${x + 8}px, ${y - 8}px)`;
        });
        pops.forEach((p, i) => {
          const el = popRefs.current[i];
          if (!el) return;
          if (!p.live) {
            el.style.opacity = "0";
            return;
          }
          const a = arcs[p.region];
          const [x, y] = project(a.endW);
          // a quick bounce, then a slow rise and fade
          const t = p.age;
          const bounce = t < 0.35 ? Math.sin((t / 0.35) * Math.PI) * 10 : 0;
          const scale = t < 0.2 ? 0.6 + (t / 0.2) * 0.5 : t < 0.35 ? 1.1 - ((t - 0.2) / 0.15) * 0.1 : 1;
          const rise = 14 + t * 22 + bounce;
          const fade = t > 1.6 ? Math.max(0, 1 - (t - 1.6) / 0.6) : 1;
          el.style.opacity = String(fade * (facing(a.endW) ? 1 : 0.35));
          el.style.transform = `translate(${x}px, ${y - rise}px) translate(-50%, -100%) scale(${scale})`;
        });
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
          p.t += dt * 0.8;
          if (p.t >= 1) {
            p.live = false;
            p.mesh.visible = false;
            landed[p.region] += 1;
            regionMeshes[p.region].pulse = 1;
            if (Math.random() < 0.025 && !pops.some((q) => q.live && q.region === p.region)) spawnPop(p.region);
            continue;
          }
          arcPoint(hubPos, arcs[p.region].endW, p.t, p.mesh.position);
        }
        pops.forEach((p) => {
          if (!p.live) return;
          p.age += dt;
          if (p.age > 2.2) p.live = false;
        });
        heldDots.forEach((m, i) => {
          m.visible = i < Math.min(queue, heldDots.length);
        });
        regionMeshes.forEach((r) => {
          r.pulse = Math.max(0, r.pulse - dt * 2.2);
          r.ring.material.opacity = r.pulse * 0.9;
          r.ring.scale.setScalar(1 + (1 - r.pulse) * 1.6);
        });
        arcs.forEach((a, i) => {
          a.line.material.opacity = s.mode === "rotate" || i === s.pinned ? 0.32 : 0.06;
        });
        return inflight;
      };

      // the simulated clock follows the globe's turn; a new day files the last one
      const clock = () => {
        const turns = (world.rotation.y + 1.9) / (Math.PI * 2);
        const hours = (((turns * 24 + 6) % 24) + 24) % 24;
        const hh = Math.floor(hours);
        if (lastHour > 20 && hh < 4) {
          past.unshift({ n: dayN, cycles: today.cycles, sol: today.sol, usdc: today.usdc });
          past.length = Math.min(past.length, 3);
          dayN += 1;
          today.cycles = 0;
          today.sol = 0;
          today.usdc = 0;
        }
        lastHour = hh;
        return `${String(hh).padStart(2, "0")}:${String(Math.floor((hours % 1) * 60)).padStart(2, "0")}`;
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
        placeOverlays();
        if (now - lastStats > 250) {
          lastStats = now;
          setStats({ inflight, held: queue, landed: landed.slice() });
          setDay({ n: dayN, clock: clock(), cycles: today.cycles, sol: today.sol, usdc: today.usdc, past: past.slice() });
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
        drag = { x: e.clientX, y: e.clientY, ry: world.rotation.y, rx: tilt.rotation.x };
        canvasRef.current.setPointerCapture(e.pointerId);
      };
      const onMove = (e) => {
        if (!drag) return;
        world.rotation.y = drag.ry + (e.clientX - drag.x) * 0.006;
        tilt.rotation.x = Math.max(-0.4, Math.min(0.9, drag.rx + (e.clientY - drag.y) * 0.004));
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
        updateArcs();
        renderer.render(scene, camera);
        placeOverlays();
      });
      ro.observe(wrap.current);
      resize();
      document.addEventListener("visibilitychange", kick);

      updateArcs();
      if (reduce) {
        packets.slice(0, 8).forEach((p, i) => {
          p.mesh.visible = true;
          arcPoint(hubPos, arcs[i].endW, 0.35 + (i % 3) * 0.2, p.mesh.position);
        });
        renderer.render(scene, camera);
        placeOverlays();
        visible = false;
        io.disconnect();
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
        land.dispose();
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
  }, [landUrl]);

  const total = stats.landed.reduce((a, b) => a + b, 0);

  return (
    <figure className="relay-globe glass">
      <div className="relay-globe__left">
        <div className="relay-globe__stage" ref={wrap}>
          {webgl ? (
            <>
              <canvas ref={canvasRef} className="relay-globe__canvas" aria-label="A turning globe with day and night, the relay above it and arcs to eight regional block engines" role="img" />
              {REGIONS.map((r, i) => (
                <span key={r.name} className="globe-label" ref={(el) => (labelRefs.current[i] = el)}>
                  {r.label ?? r.name}
                </span>
              ))}
              {Array.from({ length: POPS }, (_, i) => (
                <span key={i} className="globe-pop" ref={(el) => (popRefs.current[i] = el)} aria-hidden="true">
                  <b />
                  <span />
                </span>
              ))}
            </>
          ) : (
            <p className="relay-globe__fallback">This simulation needs WebGL. The routing is described in the list beside it.</p>
          )}
        </div>
        <div className="arb-day">
          <div className="arb-day__head">
            <strong>
              Day {day.n} <span className="num">{day.clock}</span>
            </strong>
            <span>Simulated circular arbitrage: random routes and amounts, not my trades.</span>
          </div>
          <dl className="arb-day__totals">
            <div>
              <dt>Cycles landed</dt>
              <dd className="num">{day.cycles}</dd>
            </div>
            <div>
              <dt>SOL today</dt>
              <dd className="num">+{day.sol.toFixed(3)}</dd>
            </div>
            <div>
              <dt>USDC today</dt>
              <dd className="num">+{day.usdc.toFixed(3)}</dd>
            </div>
          </dl>
          {day.past.length > 0 && (
            <ol className="arb-day__past">
              {day.past.map((d) => (
                <li key={d.n}>
                  <span>Day {d.n}</span>
                  <span className="num">{d.cycles} cycles</span>
                  <span className="num">+{d.sol.toFixed(3)} SOL</span>
                  <span className="num">+{d.usdc.toFixed(3)} USDC</span>
                </li>
              ))}
            </ol>
          )}
        </div>
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
