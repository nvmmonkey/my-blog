import { useEffect } from "react";

// GSAP motion for the dusk pages, applied by selector so every page gets the same flow:
// - titles rise in word by word behind a mask;
// - blocks below the fold slide up in staggered batches as they arrive;
// - plain figures count up from zero the first time they are seen;
// - photographs and screenshots drift a little slower than the page.
// The page is complete before this runs; under reduced motion nothing here runs.

const TITLES = [".flow-words", ".hero h1", ".case-hero h1", ".band__head h2", ".prose > h2", ".gallery__head h2", ".closing__card h2"];

const BLOCKS = [
  ".rise",
  ".band__head > p",
  ".prose__body > *",
  ".case-hero__crumb",
  ".case-hero__claim",
  ".case-hero__meta > div",
  ".case-hero__stack",
  ".case-hero__links",
  ".case > .wrap > *",
  ".figure-row > *",
  ".stack-groups > div",
  ".metrics--wide li",
  ".tech-orbs",
  ".closing__card",
  ".next-case",
  ".hero__copy > p",
  ".hero__copy .actions",
  ".runlist",
];

const COUNTERS = [".highlights__fig", ".metrics strong", ".case-hero__meta dd.num", ".ai-grid strong", ".runlist__fig"];

const PARALLAX = [".live-demo__frame img", ".closing__photo", ".figure-row .diagram"];

function splitWords(el) {
  if (el.dataset.split || el.children.length) return;
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split(/(\s+)/)
    .map((w) => (/^\s+$/.test(w) ? w : `<span class="flow-word" aria-hidden="true"><span>${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`))
    .join("");
  el.dataset.split = "1";
}

// "4,100+", "428K", "2.83×", "−47%": one number with a prefix and suffix and nothing else numeric
function counterParts(node) {
  const m = /^([^\d]*?)(\d[\d,]*(?:\.\d+)?)([^\d]*)$/.exec(node.textContent.trim());
  if (!m) return null;
  const raw = m[2];
  return { pre: m[1], suf: m[3], value: parseFloat(raw.replace(/,/g, "")), decimals: (raw.split(".")[1] || "").length, commas: raw.includes(",") };
}

export function useFlow(deps = []) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let ctx;
    let disposed = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const outsideGallery = (el) => !el.closest(".gallery");
      const fold = window.innerHeight * 0.92;

      ctx = gsap.context(() => {
        // titles
        gsap.utils.toArray(TITLES.join(",")).filter(outsideGallery).forEach((el) => {
          splitWords(el);
          const words = el.querySelectorAll(".flow-word > span");
          if (!words.length) return;
          gsap.from(words, {
            yPercent: 110,
            rotate: 4,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.05,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        // blocks: only those still below the fold are hidden, so nothing on screen flashes
        const seen = new Set();
        const blocks = gsap.utils
          .toArray(BLOCKS.join(","))
          .filter((el) => outsideGallery(el) && !el.closest(".flow-word") && !el.matches(TITLES.join(",")))
          .filter((el) => {
            // skip an element whose ancestor is already animated as a block
            for (const s of seen) if (s.contains(el)) return false;
            seen.add(el);
            return true;
          })
          .filter((el) => el.getBoundingClientRect().top > fold);
        if (blocks.length) {
          gsap.set(blocks, { opacity: 0, y: 44 });
          ScrollTrigger.batch(blocks, {
            start: "top 92%",
            once: true,
            onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.08, overwrite: true }),
          });
        }

        // figures count up once
        gsap.utils.toArray(COUNTERS.join(",")).filter(outsideGallery).forEach((el) => {
          const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
          const parts = node && counterParts(node);
          if (!parts || parts.value === 0) return;
          const original = node.textContent;
          const state = { v: 0 };
          const write = () => {
            const n = parts.decimals ? state.v.toFixed(parts.decimals) : Math.round(state.v).toString();
            const shown = parts.commas ? Number(n).toLocaleString("en-US", { minimumFractionDigits: parts.decimals, maximumFractionDigits: parts.decimals }) : n;
            node.textContent = `${parts.pre}${shown}${parts.suf}`;
          };
          gsap.to(state, {
            v: parts.value,
            duration: 1.4,
            ease: "power2.out",
            onStart: write,
            onUpdate: write,
            onComplete: () => {
              node.textContent = original;
            },
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        // depth
        gsap.utils.toArray(PARALLAX.join(",")).forEach((el) => {
          gsap.fromTo(el, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });
        const photo = document.querySelector(".hero .hero-scene");
        if (photo) {
          gsap.to(photo, { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        }
      });
      // layout settles after fonts and WebGL canvases size themselves
      setTimeout(() => ScrollTrigger.refresh(), 600);
    });
    return () => {
      disposed = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
