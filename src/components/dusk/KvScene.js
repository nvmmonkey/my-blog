import React, { useEffect, useRef, useState } from "react";
import { rem } from "./motion";

// A toy model of GPU KV-cache memory, not the capstone's measurements. Each block is one
// page of KV cache; requests claim pages as they prefill and decode, and when memory runs
// out the newest request is preempted and must recompute. Switching to 4-bit KV fits about
// 2.83 times the tokens in the same pages, which is the ratio the capstone measured.

const COLS = 24;
const ROWS = 10;
const BLOCKS = COLS * ROWS;
const HUES = [0xa8b0f2, 0x88cada, 0xc8ec5c, 0xf4f1ed, 0xb9a3e8, 0x9fd6b4];
const C = { free: 0x262a33, preempt: 0xf4ba87 };
const MODES = {
  fp16: { label: "FP16 KV", perBlock: 1 },
  q4: { label: "4-bit KV", perBlock: 2.83 },
};

export default function KvScene() {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const modeRef = useRef("fp16");
  const resetRef = useRef(false);
  const [mode, setMode] = useState("fp16");
  const [stats, setStats] = useState({ running: 0, waiting: 0, preempted: 0, used: 0 });
  const [webgl, setWebgl] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
    resetRef.current = true;
  }, [mode]);

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
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      const rig = new THREE.Group();
      scene.add(rig);

      const S = 0.24;
      const geo = new THREE.BoxGeometry(S * 0.86, 1, S * 0.86);
      geo.translate(0, 0.5, 0);
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), BLOCKS);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(COLS * S + 0.2, ROWS * S + 0.2));
      const edge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x3a404c }));
      edge.rotation.x = -Math.PI / 2;
      rig.add(mesh, edge);
      const pos = (i) => [(i % COLS) * S - ((COLS - 1) * S) / 2, Math.floor(i / COLS) * S - ((ROWS - 1) * S) / 2];

      // the waiting queue, a short row of cubes beside the memory
      const QMAX = 40;
      const qMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: 0xf4f1ed }), QMAX);
      rig.add(qMesh);

      const m4 = new THREE.Matrix4();
      const col = new THREE.Color();
      const blocks = Array.from({ length: BLOCKS }, () => ({ owner: null, h: 0.02, th: 0.02, flash: 0 }));
      // the allocator hands out pages in no particular order, like a real free list
      const order = Array.from({ length: BLOCKS }, (_, i) => i);
      for (let i = BLOCKS - 1; i > 0; i--) {
        const j = (i * 7919 + 13) % (i + 1);
        [order[i], order[j]] = [order[j], order[i]];
      }
      let reqs = [];
      let queue = [];
      let nextId = 0;
      let preempted = 0;
      let carry = 0;
      let seed = 7;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };

      const reset = () => {
        blocks.forEach((b) => {
          b.owner = null;
          b.th = 0.02;
          b.flash = 0;
        });
        reqs = [];
        queue = [];
        preempted = 0;
        carry = 0;
        seed = 7;
      };

      const freeBlocks = () => blocks.reduce((n, b) => n + (b.owner === null ? 1 : 0), 0);
      const tokensFit = (r) => Math.ceil(r.tokens / MODES[modeRef.current].perBlock);
      const claim = (r, n) => {
        for (let k = 0; k < BLOCKS && n > 0; k++) {
          const i = order[k];
          if (blocks[i].owner === null) {
            blocks[i].owner = r;
            r.blocks.push(i);
            n -= 1;
          }
        }
      };
      const release = (r, flash) => {
        r.blocks.forEach((i) => {
          blocks[i].owner = null;
          blocks[i].th = 0.02;
          if (flash) blocks[i].flash = 1;
        });
        r.blocks = [];
      };
      const heights = (r) => {
        const per = MODES[modeRef.current].perBlock;
        r.blocks.forEach((i, k) => {
          const inBlock = Math.min(per, r.tokens - k * per);
          blocks[i].th = 0.08 + 0.9 * (inBlock / 2.83);
        });
      };

      const step = (dt) => {
        if (resetRef.current) {
          resetRef.current = false;
          reset();
        }
        // arrivals, steady
        carry += dt * 2.5;
        while (carry >= 1) {
          carry -= 1;
          queue.push({ id: nextId++, tokens: 0, prompt: 6 + Math.floor(rand() * 9), out: 10 + Math.floor(rand() * 15), hue: HUES[nextId % HUES.length], blocks: [], made: 0 });
        }
        // admit from the head of the queue while the prompt fits
        while (queue.length) {
          const r = queue[0];
          r.tokens = r.prompt;
          const need = tokensFit(r);
          if (need > freeBlocks()) {
            r.tokens = 0;
            break;
          }
          queue.shift();
          claim(r, need);
          reqs.push(r);
        }
        // decode: every running request grows; growing past memory preempts the newest
        const grow = dt * 3.2;
        for (const r of reqs.slice()) {
          if (!reqs.includes(r)) continue;
          r.made += grow;
          const tokens = r.prompt + Math.floor(r.made);
          if (tokens > r.tokens) {
            r.tokens = tokens;
            const need = tokensFit(r) - r.blocks.length;
            while (need > 0 && freeBlocks() < need && reqs.length > 1) {
              const victim = reqs[reqs.length - 1] === r ? reqs[reqs.length - 2] : reqs[reqs.length - 1];
              reqs = reqs.filter((x) => x !== victim);
              release(victim, true);
              victim.tokens = 0;
              victim.made = 0;
              queue.unshift(victim);
              preempted += 1;
            }
            if (need > 0) claim(r, Math.min(need, freeBlocks()));
          }
          if (r.made >= r.out) {
            reqs = reqs.filter((x) => x !== r);
            release(r, false);
          } else heights(r);
        }
        if (queue.length > QMAX * 2) queue.length = QMAX * 2;

        blocks.forEach((b, i) => {
          b.h += (b.th - b.h) * Math.min(1, dt * 8);
          b.flash = Math.max(0, b.flash - dt * 2.5);
          const [x, z] = pos(i);
          m4.makeScale(1, Math.max(0.02, b.h), 1).setPosition(x, 0, z);
          mesh.setMatrixAt(i, m4);
          if (b.flash > 0) col.setHex(C.preempt);
          else if (b.owner) col.setHex(b.owner.hue);
          else col.setHex(C.free);
          mesh.setColorAt(i, col);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.needsUpdate = true;

        for (let i = 0; i < QMAX; i++) {
          const on = i < queue.length;
          m4.makeScale(on ? 1 : 0, on ? 1 : 0, on ? 1 : 0).setPosition(((COLS - 1) * S) / 2 + 0.5 + (i % 4) * 0.2, 0.07 + Math.floor(i / 4) * 0.2, -((ROWS - 1) * S) / 2);
          qMesh.setMatrixAt(i, m4);
        }
        qMesh.instanceMatrix.needsUpdate = true;
      };

      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        const w = r.width;
        const h = Math.max(rem(18), Math.min(rem(30), w * 0.55));
        renderer.setSize(w, h, false);
        canvasRef.current.style.height = `${h}px`;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const span = COLS * S + 1.6;
        const z = Math.max(span / (2 * Math.tan((16 * Math.PI) / 180) * camera.aspect), 6);
        camera.position.set(0, z * 0.62, z * 0.78);
        camera.lookAt(0, 0.2, 0);
      };

      const pointer = { x: 0, tx: 0 };
      const onPointer = (e) => {
        const r = wrap.current.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      };

      let raf = 0;
      let visible = false;
      let last = performance.now();
      let lastUi = 0;
      const render = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
        last = now;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        rig.rotation.y = -0.18 + pointer.x * 0.25 + Math.sin(now / 5000) * 0.04;
        step(dt);
        renderer.render(scene, camera);
        if (now - lastUi > 250) {
          lastUi = now;
          setStats({ running: reqs.length, waiting: queue.length, preempted, used: Math.round(((BLOCKS - freeBlocks()) / BLOCKS) * 100) });
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
      });
      ro.observe(wrap.current);
      resize();
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", kick);

      if (reduce) {
        for (let i = 0; i < 240; i++) step(0.05);
        renderer.render(scene, camera);
      } else io.observe(wrap.current);

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

  return (
    <figure className="kv-scene glass">
      <div className="kv-scene__stage" ref={wrap}>
        {webgl ? (
          <canvas ref={canvasRef} className="kv-scene__canvas" role="img" aria-label="A grid of KV-cache pages filling with requests; a queue of waiting requests stands beside it" />
        ) : (
          <p className="relay-globe__fallback">This model needs WebGL. The measured results are listed beside it.</p>
        )}
      </div>
      <div className="kv-scene__panel">
        <p className="relay-globe__note">A toy model of KV memory, not the measured system. Orange pages are a preemption.</p>
        <div className="tabs" role="radiogroup" aria-label="KV cache precision">
          {Object.entries(MODES).map(([k, m]) => (
            <button key={k} type="button" role="radio" aria-checked={mode === k} className="tabs__item" onClick={() => setMode(k)}>
              {m.label}
            </button>
          ))}
        </div>
        <dl className="tally">
          <div>
            <dt>Running</dt>
            <dd className="num">{stats.running}</dd>
          </div>
          <div>
            <dt>Waiting</dt>
            <dd className="num tally__open">{stats.waiting}</dd>
          </div>
          <div>
            <dt>Preempted</dt>
            <dd className="num">{stats.preempted}</dd>
          </div>
        </dl>
        <p className="kv-scene__measured">
          Measured on Llama-3.1-8B, one RTX 3090, 64 requests a second: mean time to first token <strong className="num">10.7 s → 1.6 s</strong>, preemptions{" "}
          <strong className="num">171 → 40</strong>.
        </p>
        {still && <p className="relay-globe__note">Motion is reduced, so the model holds one frame.</p>}
      </div>
    </figure>
  );
}
