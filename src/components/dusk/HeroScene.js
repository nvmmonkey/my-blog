import React, { useEffect, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

// The hero photograph rendered through one WebGL plane: the real fog moves, the pointer
// carries a little apricot light, and the hour deepens as the page scrolls. The <img>
// underneath is the complete picture; the canvas only fades in once it has drawn a frame.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPhoto;
  uniform vec2 uView;      // canvas size in px
  uniform vec2 uImage;     // photo size in px
  uniform float uTime;
  uniform float uScroll;   // 0 at top, 1 once the hero has left
  uniform vec2 uPointer;   // 0..1, eased
  uniform float uFocus;    // object-position x for the crop

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
  }

  vec2 coverUv(vec2 uv) {
    float rView = uView.x / uView.y, rImg = uImage.x / uImage.y;
    vec2 scale = rView > rImg ? vec2(1.0, rImg / rView) : vec2(rView / rImg, 1.0);
    vec2 offset = (1.0 - scale) * vec2(uFocus, 0.5);
    return uv * scale + offset;
  }

  void main() {
    // the drift: 6% over 48 seconds, there and back
    float t = uTime / 48.0;
    float drift = 0.5 - 0.5 * cos(6.28318 * t);
    vec2 uv = vUv;
    uv = (uv - 0.5) / (1.0 + 0.06 * drift) + 0.5;
    uv.x += 0.012 * drift;
    uv += (uPointer - 0.5) * vec2(-0.012, 0.008);
    vec2 puv = coverUv(uv);

    vec3 base = texture2D(uPhoto, puv).rgb;
    float luma = dot(base, vec3(0.299, 0.587, 0.114));
    float chroma = max(base.r, max(base.g, base.b)) - min(base.r, min(base.g, base.b));
    // fog is bright, unsaturated and below the horizon
    float fogMask = smoothstep(0.55, 0.8, luma) * (1.0 - smoothstep(0.08, 0.22, chroma)) * smoothstep(0.78, 0.6, vUv.y);

    vec2 flow = vec2(uTime * 0.018, uTime * 0.004);
    float n = fbm(puv * vec2(5.0, 9.0) + flow);
    float n2 = fbm(puv * vec2(11.0, 18.0) - flow * 1.7);
    vec2 bend = (vec2(n, n2) - 0.5) * 0.012 * fogMask;
    vec3 col = texture2D(uPhoto, puv + bend).rgb;
    col += fogMask * (n - 0.45) * 0.09;

    // pointer light, apricot and very soft
    float aspect = uView.x / uView.y;
    vec2 d = (vUv - uPointer) * vec2(aspect, 1.0);
    float glow = exp(-dot(d, d) * 5.0);
    col += vec3(1.0, 0.78, 0.6) * glow * 0.07;

    // the hour deepens with scroll
    col = mix(col, col * vec3(0.55, 0.58, 0.72), uScroll * 0.65);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function HeroScene({ src, width, height, focus = 0.3, alt }) {
  const wrap = useRef(null);
  const canvasRef = useRef(null);
  const [live, setLive] = useState(false);
  const photo = useBaseUrl(src);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return undefined;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed || !canvasRef.current) return;
      const canvas = canvasRef.current;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const uniforms = {
        uPhoto: { value: null },
        uView: { value: new THREE.Vector2(1, 1) },
        uImage: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.3, 0.55) },
        uFocus: { value: focus },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      const target = new THREE.Vector2(0.3, 0.55);
      let visible = true;
      let raf = 0;
      let start = performance.now();
      let ready = false;

      const resize = () => {
        const r = wrap.current.getBoundingClientRect();
        renderer.setSize(r.width, r.height, false);
        uniforms.uView.value.set(r.width, r.height);
      };
      const onPointer = (e) => {
        const r = wrap.current.getBoundingClientRect();
        target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      };
      const onScroll = () => {
        const h = wrap.current.offsetHeight || 1;
        uniforms.uScroll.value = Math.min(1, Math.max(0, window.scrollY / h));
      };
      const frame = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        uniforms.uTime.value = (now - start) / 1000;
        uniforms.uPointer.value.lerp(target, 0.04);
        renderer.render(scene, camera);
        if (!ready) {
          ready = true;
          setLive(true);
        }
        raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf && visible && !document.hidden && uniforms.uPhoto.value) raf = requestAnimationFrame(frame);
      };

      new THREE.TextureLoader().load(photo, (tex) => {
        if (disposed) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        uniforms.uPhoto.value = tex;
        start = performance.now();
        kick();
      });

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        kick();
      });
      io.observe(wrap.current);
      const ro = new ResizeObserver(resize);
      ro.observe(wrap.current);
      resize();
      onScroll();
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", kick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", kick);
        uniforms.uPhoto.value?.dispose();
        material.dispose();
        mesh.geometry.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [photo, width, height, focus]);

  return (
    <div className="hero-scene" ref={wrap} aria-hidden={alt ? undefined : true}>
      <img
        className="hero-scene__photo"
        src={photo}
        srcSet={`${photo.replace("-2400.webp", "-1280.webp")} 1280w, ${photo} 2400w`}
        sizes="100vw"
        width={width}
        height={height}
        alt={alt || ""}
        fetchpriority="high"
        style={{ objectPosition: `${focus * 100}% 50%` }}
      />
      <canvas ref={canvasRef} className={live ? "hero-scene__canvas is-live" : "hero-scene__canvas"} />
    </div>
  );
}
