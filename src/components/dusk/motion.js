import { useEffect } from "react";
import { useFlow } from "./flow";

// Motion for a dusk page: marks the document as motion-ok for the CSS loops (packets,
// ripples, breathing dots), then runs the GSAP flow. Nothing is hidden before it runs.
export function useRise(deps = []) {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("motion-ok");
  }, []);
  useFlow(deps);
}

// The navbar sits clear on the hero photograph and turns to slate glass once it leaves it.
export function useOnPhoto(ref) {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const bottom = el.getBoundingClientRect().bottom;
      root.classList.toggle("on-photo", bottom > 72);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      root.classList.remove("on-photo");
    };
  }, [ref]);
}

// Runs fn(t) on animation frames only while the element is on screen and the tab is visible.
export function useFrames(ref, fn, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let raf = 0;
    let visible = false;
    const start = performance.now();
    const loop = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      fn((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(ref.current);
    document.addEventListener("visibilitychange", kick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled]);
}

// One rem in pixels, read from the root so canvas sizes follow the same scale as the CSS.
export function rem(n) {
  if (typeof window === "undefined") return n * 17;
  return n * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
