import React, { useEffect, useRef, useState } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { projects } from "./projects";

// The projects as a looping deck of cards. The card in focus sits on top; its neighbours
// fan out to each side, lower, tilted and dimmed. Move with the arrows, the dots, the
// arrow keys, a swipe, or by clicking a side card. Over the focused picture a round link
// follows the pointer and goes straight to the live site, or the case study.


function Card({ p, i, total, offset, onFocus }) {
  const visual = useRef(null);
  const go = useRef(null);
  const base = useBaseUrl(p.image);
  const href = p.live ? p.live.href : null;
  const caseUrl = useBaseUrl(`/work/${p.slug}`);
  const focused = offset === 0;

  useEffect(() => {
    const el = visual.current;
    if (!el || !focused || !window.matchMedia("(pointer: fine)").matches) return undefined;
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
      gsap.set(go.current, { scale: 0.6, opacity: 0, x: 0, y: 0 });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      cleanup = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
        gsap.set(go.current, { clearProps: "all" });
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [focused]);

  const side = Math.abs(offset);
  const target = href || caseUrl;
  const linkLabel = href ? (p.live.text.length > 16 ? "Live site" : p.live.text) : "Case study";
  return (
    <article
      className={`deck__card${focused ? " is-focus" : ""}`}
      style={{ "--card-needle": p.needle, "--o": offset, "--a": side }}
      aria-roledescription="slide"
      aria-label={`${i + 1} of ${total}: ${p.name}`}
      aria-hidden={focused ? undefined : true}
      inert={!focused}
      data-hidden={side > 2 ? "" : undefined}
      onClick={focused ? undefined : onFocus}
    >
      <div className="deck__visual" ref={visual}>
        <img src={`${base}-1440.webp`} srcSet={`${base}-960.webp 960w, ${base}-1440.webp 1440w`} sizes="(max-width: 62rem) 86vw, 40rem" alt="" loading="lazy" width="1440" height="900" />
        <a className="gallery__go" ref={go} href={target} target={href ? "_blank" : undefined} rel={href ? "noopener" : undefined} aria-label={href ? `Open ${p.live.text}` : `Read the ${p.name} case study`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{linkLabel}</span>
        </a>
      </div>
      <div className="deck__body">
        <p className="deck__year num">{p.year}</p>
        <h3>
          <Link to={`/work/${p.slug}`}>{p.name}</Link>
        </h3>
        <p className="deck__claim">{p.claim}</p>
        <ul className="metrics">
          {p.metrics.map(([fig, label]) => (
            <li key={label}>
              <strong>{fig}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <ul className="stack">
          {p.stack.slice(0, 6).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="deck__links">
          <Link className="gallery__more" to={`/work/${p.slug}`}>
            Read the case study
          </Link>
          {href && (
            <a className="gallery__more" href={href} target="_blank" rel="noopener">
              {p.live.text} ↗
            </a>
          )}
        </div>
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
  const [current, setCurrent] = useState(0);
  const total = projects.length;
  const drag = useRef(null);

  const go = (i) => setCurrent(((i % total) + total) % total);
  // shortest signed distance around the loop
  const offsetOf = (i) => {
    let d = i - current;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  const onKey = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(current - 1);
    }
  };
  const onDown = (e) => {
    if (e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(current + (dx < 0 ? 1 : -1));
  };

  return (
    <section className="gallery" aria-roledescription="carousel" aria-label="Projects">
      <div className="wrap gallery__head">
        <div className="gallery__titlebar">
          <h2>Projects</h2>
          <div className="gallery__nav">
            <button type="button" className="gallery__arrow" onClick={() => go(current - 1)} aria-label="Previous project">
              <Chevron dir="prev" />
            </button>
            <button type="button" className="gallery__arrow" onClick={() => go(current + 1)} aria-label="Next project">
              <Chevron dir="next" />
            </button>
          </div>
        </div>
        <p>{total} projects, each with its own write-up. The round link on the picture goes straight to the live site.</p>
      </div>
      <div className="deck" tabIndex={0} onKeyDown={onKey} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (drag.current = null)} aria-label="Projects, use the left and right arrow keys to move between them">
        <div className="deck__stage">
          {projects.map((p, i) => (
            <Card key={p.slug} p={p} i={i} total={total} offset={offsetOf(i)} onFocus={() => go(i)} />
          ))}
        </div>
      </div>
      <div className="wrap deck__controls">
        <ol className="deck__dots">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <button type="button" className={i === current ? "is-on" : ""} aria-label={`Show ${p.name}`} aria-current={i === current ? "true" : undefined} onClick={() => go(i)} style={{ "--dot": p.needle }} />
            </li>
          ))}
        </ol>
        <p className="sr-only" aria-live="polite">
          Showing project {current + 1} of {total}: {projects[current].name}
        </p>
      </div>
    </section>
  );
}
