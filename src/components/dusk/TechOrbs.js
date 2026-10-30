import React, { useEffect, useRef, useState } from "react";
import { STACK } from "./stackIcons";

// The stack as a row of low-poly glass balls, each carrying its logo. Grab one and throw
// it: it keeps the spin you gave it and slows back to an idle turn.

const IDLE = 0.35; // rad/s
const DECAY = 1.1; // how fast a throw settles back to idle

function logoTexture(THREE, item) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.translate(size * 0.18, size * 0.18);
  g.scale((size * 0.64) / 24, (size * 0.64) / 24);
  g.fillStyle = item.color;
  g.fill(new Path2D(item.path));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function TechOrbs() {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const labels = useRef([]);
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
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      scene.add(new THREE.HemisphereLight(0xb9c0ff, 0x1b1f2a, 1.1));
      const key = new THREE.DirectionalLight(0xffd2b0, 1.6);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x88cada, 0.9);
      rim.position.set(-4, -1, -3);
      scene.add(rim);

      const geo = new THREE.IcosahedronGeometry(0.46, 1);
      const edges = new THREE.EdgesGeometry(geo, 1);
      const orbs = STACK.map((item, i) => {
        const group = new THREE.Group();
        const shellMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(item.color).lerp(new THREE.Color(0x2a3048), 0.55),
          flatShading: true,
          metalness: 0.15,
          roughness: 0.45,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        });
        const shell = new THREE.Mesh(geo, shellMat);
        const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xf4f1ed, transparent: true, opacity: 0.22 }));
        const spinner = new THREE.Group();
        spinner.add(shell, lines);
        spinner.rotation.set(Math.random() * 3, Math.random() * 3, 0);
        const tex = logoTexture(THREE, item);
        const logo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        logo.scale.setScalar(0.5);
        logo.renderOrder = 2;
        group.add(spinner, logo);
        scene.add(group);
        const axis = new THREE.Vector3(Math.sin(i * 1.7), 1, Math.cos(i * 2.3) * 0.4).normalize();
        return { item, group, spinner, shell, tex, axis, vel: new THREE.Vector2(0, 0), base: new THREE.Vector3(), hover: 0, phase: i * 0.8 };
      });

      let narrow = false;
      let w = 1;
      let h = 1;
      const layout = () => {
        const cols = narrow ? 3 : orbs.length;
        orbs.forEach((o, i) => {
          if (narrow) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            o.base.set((col - 1) * 1.3, (1 - row) * 1.5, 0);
          } else {
            const x = (i - (orbs.length - 1) / 2) * 1.12;
            o.base.set(x, Math.sin(i * 1.3) * 0.28, Math.cos(i * 0.9) * 0.18);
          }
        });
      };
      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        w = r.width;
        narrow = w < 700;
        h = narrow ? Math.min(600, w * 1.4) : Math.max(260, Math.min(360, w * 0.3));
        renderer.setSize(w, h, false);
        canvasRef.current.style.height = `${h}px`;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        layout();
        const halfW = narrow ? 2.1 : ((orbs.length - 1) / 2) * 1.12 + 0.95;
        const tan = Math.tan((16 * Math.PI) / 180);
        const z = Math.max(halfW / (tan * camera.aspect), (narrow ? 2.3 : 1.0) / tan);
        camera.position.set(0, 0.2, z);
        camera.lookAt(0, 0, 0);
      };

      // pointer: grab an orb and throw it
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let drag = null;
      let hovered = null;
      const pick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(orbs.map((o) => o.shell))[0];
        return hit ? orbs.find((o) => o.shell === hit.object) : null;
      };
      const onDown = (e) => {
        const o = pick(e);
        if (!o) return;
        drag = { o, x: e.clientX, y: e.clientY, t: performance.now() };
        o.vel.set(0, 0);
        canvasRef.current.setPointerCapture(e.pointerId);
        canvasRef.current.style.cursor = "grabbing";
      };
      const onMove = (e) => {
        if (drag) {
          const now = performance.now();
          const dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          const dt = Math.max(8, now - drag.t) / 1000;
          drag.o.spinner.rotation.y += dx * 0.012;
          drag.o.spinner.rotation.x += dy * 0.012;
          drag.o.vel.set((dy * 0.012) / dt, (dx * 0.012) / dt);
          drag.x = e.clientX;
          drag.y = e.clientY;
          drag.t = now;
          return;
        }
        hovered = pick(e);
        canvasRef.current.style.cursor = hovered ? "grab" : "default";
      };
      const onUp = () => {
        if (drag) drag.o.vel.clampLength(0, 18);
        drag = null;
        canvasRef.current.style.cursor = hovered ? "grab" : "default";
      };
      const onLeave = () => {
        hovered = null;
      };
      const c = canvasRef.current;
      c.addEventListener("pointerdown", onDown);
      c.addEventListener("pointermove", onMove);
      c.addEventListener("pointerup", onUp);
      c.addEventListener("pointercancel", onUp);
      c.addEventListener("pointerleave", onLeave);

      const tmp = new THREE.Vector3();
      const placeLabels = () => {
        orbs.forEach((o, i) => {
          const el = labels.current[i];
          if (!el) return;
          tmp.copy(o.group.position);
          tmp.y -= 0.62;
          tmp.project(camera);
          el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%, 0)`;
          el.classList.toggle("is-hot", o === hovered || (drag && drag.o === o));
        });
      };

      let raf = 0;
      let visible = false;
      let last = performance.now();
      const frame = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = now / 1000;
        orbs.forEach((o) => {
          const hot = o === hovered || (drag && drag.o === o);
          o.hover += ((hot ? 1 : 0) - o.hover) * Math.min(1, dt * 8);
          o.group.position.set(o.base.x, o.base.y + Math.sin(t * 0.9 + o.phase) * 0.06, o.base.z);
          o.group.scale.setScalar(1 + o.hover * 0.1);
          if (!(drag && drag.o === o)) {
            // the throw decays toward a slow idle turn about the orb's own axis
            const k = Math.exp(-dt * DECAY);
            o.vel.multiplyScalar(k);
            o.spinner.rotation.x += o.vel.x * dt;
            o.spinner.rotation.y += o.vel.y * dt;
            if (!reduce) o.spinner.rotateOnAxis(o.axis, IDLE * dt);
          }
        });
        renderer.render(scene, camera);
        placeLabels();
        raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf && visible && !document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        kick();
      });
      io.observe(wrap.current);
      const ro = new ResizeObserver(() => {
        resize();
        orbs.forEach((o) => o.group.position.copy(o.base));
        renderer.render(scene, camera);
        placeLabels();
      });
      ro.observe(wrap.current);
      resize();
      document.addEventListener("visibilitychange", kick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", kick);
        c.removeEventListener("pointerdown", onDown);
        c.removeEventListener("pointermove", onMove);
        c.removeEventListener("pointerup", onUp);
        c.removeEventListener("pointercancel", onUp);
        c.removeEventListener("pointerleave", onLeave);
        orbs.forEach((o) => o.tex.dispose());
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
    <div className="tech-orbs" ref={wrap}>
      {webgl ? (
        <>
          <canvas ref={canvasRef} className="tech-orbs__canvas" role="img" aria-label={`Spinning balls with the logos of ${STACK.map((s) => s.name).join(", ")}`} />
          {STACK.map((s, i) => (
            <span key={s.name} className="tech-orbs__label" ref={(el) => (labels.current[i] = el)}>
              {s.name}
            </span>
          ))}
        </>
      ) : (
        <ul className="stack">
          {STACK.map((s) => (
            <li key={s.name}>{s.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
