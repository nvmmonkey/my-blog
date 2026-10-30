import { useEffect } from "react";

// Rise-once: elements marked .rise start lowered only after this runs, so the page is
// complete with scripting off and under reduced motion.
export function useRise(deps = []) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const root = document.documentElement;
    root.classList.add("motion-ok");
    const els = [...document.querySelectorAll(".rise:not(.is-in)")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("is-in");
      else io.observe(el);
    }
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
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
