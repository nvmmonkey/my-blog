import { useEffect } from "react";

// GSAP motion for a page: headings marked .flow-words rise in word by word, blocks marked
// .flow-up slide in as they reach the viewport, and the hero photograph drifts slower than
// the page. The page reads complete before this runs and when motion is reduced.
export function useFlow(deps = []) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let ctx;
    let disposed = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.utils.toArray(".flow-words").forEach((el) => {
          if (!el.dataset.split) {
            const text = el.textContent;
            el.setAttribute("aria-label", text);
            el.innerHTML = text
              .split(/(\s+)/)
              .map((w) => (/^\s+$/.test(w) ? w : `<span class="flow-word" aria-hidden="true"><span>${w.replace(/</g, "&lt;")}</span></span>`))
              .join("");
            el.dataset.split = "1";
          }
          gsap.from(el.querySelectorAll(".flow-word > span"), {
            yPercent: 110,
            rotate: 4,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.06,
            delay: 0.1,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
        gsap.utils.toArray(".flow-up").forEach((el) => {
          gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });
        const photo = document.querySelector(".hero .hero-scene");
        if (photo) {
          gsap.to(photo, { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        }
      });
    });
    return () => {
      disposed = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
