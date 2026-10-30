import React, { useEffect, useRef, useState } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { projects } from "./projects";

// The projects as a large horizontal gallery. On wide screens with motion allowed, the
// section pins and vertical scroll drives the track sideways (GSAP ScrollTrigger);
// everywhere else it is a native swipe row with snap points. Over each picture a round
// link follows the pointer and goes straight to the live site, or the case study.

const IMAGES = {
  "llm-digest": "/img/live/llm-digest-flagship",
  "kv-cache": "/img/cards/kv-cache",
  "solana-mev": "/img/cards/solana-mev",
  rootdata: "/img/live/rootdata-home",
  paymentindexer: "/img/cards/paymentindexer",
  westtelecom: "/img/live/westtelecom-home",
};

function Card({ p, i, total }) {
  const visual = useRef(null);
  const go = useRef(null);
  const base = useBaseUrl(IMAGES[p.slug]);
  const href = p.live ? p.live.href : null;
  const caseUrl = useBaseUrl(`/work/${p.slug}`);

  useEffect(() => {
    const el = visual.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return undefined;
    let cleanup = () => {};
    let disposed = false;
    import("gsap").then(({ gsap }) => {
      if (disposed || !go.current) return;
      const x = gsap.quickTo(go.current, "x", { duration: 0.45, ease: "power3.out" });
      const y = gsap.quickTo(go.current, "y", { duration: 0.45, ease: "power3.out" });
      const move = (e) => {
        const r = el.getBoundingClientRect();
        x(e.clientX - r.left - r.width / 2);
        y(e.clientY - r.top - r.height / 2);
      };
      const enter = () => gsap.to(go.current, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)" });
      const leave = () => {
        gsap.to(go.current, { scale: 0.6, opacity: 0, duration: 0.25 });
        x(0);
        y(0);
      };
      gsap.set(go.current, { scale: 0.6, opacity: 0 });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      cleanup = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const target = href || caseUrl;
  return (
    <article className="gallery__card" style={{ "--card-needle": p.needle }} aria-roledescription="slide" aria-label={`${i + 1} of ${total}: ${p.name}`}>
      <div className="gallery__visual" ref={visual}>
        <img src={`${base}-1440.webp`} srcSet={`${base}-960.webp 960w, ${base}-1440.webp 1440w`} sizes="(max-width: 62rem) 90vw, 62vw" alt="" loading="lazy" width="1440" height="900" />
        <a className="gallery__go" ref={go} href={target} target={href ? "_blank" : undefined} rel={href ? "noopener" : undefined} aria-label={href ? `Open ${p.live.text}` : `Read the ${p.name} case study`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{href ? p.live.text : "Case study"}</span>
        </a>
      </div>
      <div className="gallery__text">
        <p className="gallery__count num">
          {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {p.year}
        </p>
        <h3>
          <Link to={`/work/${p.slug}`}>{p.name}</Link>
        </h3>
        <p className="gallery__claim">{p.claim}</p>
        <ul className="metrics">
          {p.metrics.map(([fig, label]) => (
            <li key={label}>
              <strong>{fig}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <ul className="stack">
          {p.stack.slice(0, 5).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <Link className="gallery__more" to={`/work/${p.slug}`}>
          Read the case study
        </Link>
      </div>
    </article>
  );
}

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ProjectGallery() {
  const section = useRef(null);
  const viewport = useRef(null);
  const track = useRef(null);
  const bar = useRef(null);
  const pinned = useRef(null); // the ScrollTrigger while the section is pinned
  const [current, setCurrent] = useState(0);
  const total = projects.length;

  const cards = () => [...track.current.querySelectorAll(".gallery__card")];
  const edge = () => cards()[0]?.offsetLeft ?? 0;

  // which card sits at the left edge, from the track's travel (pinned) or the row's scroll (swipe)
  const measure = (travelled) => {
    const left = cards().map((c) => c.offsetLeft - edge());
    let idx = 0;
    left.forEach((x, i) => {
      if (travelled + 40 >= x) idx = i;
    });
    setCurrent(idx);
  };

  const goTo = (i) => {
    const idx = Math.max(0, Math.min(total - 1, i));
    const target = cards()[idx].offsetLeft - edge();
    const st = pinned.current;
    if (st) {
      const distance = track.current.scrollWidth - window.innerWidth + 64;
      const y = st.start + (Math.min(target, distance) / distance) * (st.end - st.start);
      window.scrollTo({ top: y + 1, behavior: "smooth" });
    } else {
      viewport.current.scrollTo({ left: target, behavior: "smooth" });
    }
    setCurrent(idx);
  };

  const onKey = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(current - 1);
    }
  };

  useEffect(() => {
    const vp = viewport.current;
    const onScroll = () => {
      if (pinned.current) return;
      measure(vp.scrollLeft);
      const max = vp.scrollWidth - vp.clientWidth;
      if (bar.current && max > 0) bar.current.style.transform = `scaleX(${vp.scrollLeft / max})`;
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 62rem)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wide || reduce) return undefined;
    let ctx;
    let disposed = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !track.current) return;
      gsap.registerPlugin(ScrollTrigger);
      section.current.classList.add("is-pinned");
      ctx = gsap.context(() => {
        const distance = () => track.current.scrollWidth - window.innerWidth + 64;
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top+=64",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
              gsap.set(bar.current, { scaleX: st.progress });
              measure(st.progress * distance());
            },
          },
        });
        pinned.current = tween.scrollTrigger;
        // each card's picture drifts a little against the track, and its text rises in
        gsap.utils.toArray(".gallery__card").forEach((card) => {
          gsap.fromTo(card.querySelector("img"), { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          gsap.from(card.querySelectorAll(".gallery__text > *"), { y: 28, opacity: 0, stagger: 0.06, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 80%" } });
        });
      }, section);
    });
    return () => {
      disposed = true;
      pinned.current = null;
      ctx?.revert();
      section.current?.classList.remove("is-pinned");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="gallery" ref={section} aria-roledescription="carousel" aria-label="Projects">
      <div className="wrap gallery__head">
        <h2>Projects</h2>
        <p>Six projects, each with its own write-up. The round link on each picture goes straight to the live site.</p>
        <div className="gallery__controls">
          <div className="gallery__progress" aria-hidden="true">
            <i ref={bar} />
          </div>
          <p className="gallery__status num" aria-live="polite">
            <span className="sr-only">Showing project </span>
            {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            <span className="sr-only">: {projects[current].name}</span>
          </p>
          <button type="button" className="gallery__arrow" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Previous project">
            <Chevron dir="prev" />
          </button>
          <button type="button" className="gallery__arrow" onClick={() => goTo(current + 1)} disabled={current === total - 1} aria-label="Next project">
            <Chevron dir="next" />
          </button>
        </div>
      </div>
      <div className="gallery__viewport" ref={viewport} tabIndex={0} onKeyDown={onKey} aria-label="Projects, use the left and right arrow keys to move between them">
        <div className="gallery__track" ref={track}>
          {projects.map((p, i) => (
            <Card key={p.slug} p={p} i={i} total={total} />
          ))}
          <div className="gallery__end">
            <Link className="btn" to="/work">
              All projects
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
