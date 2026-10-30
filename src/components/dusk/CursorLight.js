import React, { useEffect, useRef } from "react";

// A soft dusk light that trails the pointer, and a thin ring that opens over anything
// clickable. Fine pointers only; nothing renders for touch or reduced motion, and the
// system cursor stays visible.
export default function CursorLight() {
  const glow = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return undefined;
    let disposed = false;
    let cleanup = () => {};
    import("gsap").then(({ gsap }) => {
      if (disposed || !glow.current || !ring.current) return;
      const gx = gsap.quickTo(glow.current, "x", { duration: 0.9, ease: "power3.out" });
      const gy = gsap.quickTo(glow.current, "y", { duration: 0.9, ease: "power3.out" });
      const rx = gsap.quickTo(ring.current, "x", { duration: 0.18, ease: "power3.out" });
      const ry = gsap.quickTo(ring.current, "y", { duration: 0.18, ease: "power3.out" });
      let shown = false;
      const move = (e) => {
        if (!shown) {
          shown = true;
          gsap.set([glow.current, ring.current], { x: e.clientX, y: e.clientY });
          gsap.to([glow.current, ring.current], { opacity: 1, duration: 0.4 });
        }
        gx(e.clientX);
        gy(e.clientY);
        rx(e.clientX);
        ry(e.clientY);
        const hot = e.target.closest?.("a, button, [role='button'], input, label, canvas");
        ring.current.classList.toggle("is-hot", Boolean(hot));
      };
      const leave = () => {
        shown = false;
        gsap.to([glow.current, ring.current], { opacity: 0, duration: 0.3 });
      };
      const down = () => ring.current.classList.add("is-down");
      const up = () => ring.current.classList.remove("is-down");
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      window.addEventListener("pointerdown", down);
      window.addEventListener("pointerup", up);
      cleanup = () => {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", leave);
        window.removeEventListener("pointerdown", down);
        window.removeEventListener("pointerup", up);
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <>
      <div className="cursor-glow" ref={glow} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
    </>
  );
}
