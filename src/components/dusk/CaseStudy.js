import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { projects, bySlug } from "./projects";
import { useRise } from "./motion";
import "./dusk.css";

// One template for every case study: claim and instrument, the problem, one diagram,
// three to five highlights, what is next.

export function Section({ title, figure, children }) {
  return (
    <section className="band">
      <div className="wrap prose">
        <h2>{title}</h2>
        <div className="prose__body">{children}</div>
      </div>
      {figure && <div className="wrap figure-row">{figure}</div>}
    </section>
  );
}

export function Highlights({ items }) {
  return (
    <ol className="highlights">
      {items.map((h, i) => (
        <li key={h.title} className="rise" style={{ "--i": i }}>
          <div className="highlights__fig">
            {h.fig}
            <small>{h.unit}</small>
          </div>
          <div>
            <h3>{h.title}</h3>
            <p>{h.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function CaseStudy({ slug, role, links = [], stage, children }) {
  const p = bySlug[slug];
  const i = projects.findIndex((x) => x.slug === slug);
  const next = projects[(i + 1) % projects.length];
  useRise([slug]);
  return (
    <Layout title={p.name} description={p.claim}>
      <main className="dusk case" style={{ "--case-needle": p.needle }}>
        <div className="spine" aria-hidden="true" />
        <header className="wrap case-hero">
          <p className="case-hero__crumb">
            <Link to="/work">Work</Link> / {p.name}
          </p>
          <h1>{p.name}</h1>
          <p className="case-hero__claim">{p.claim}</p>
          <dl className="case-hero__meta">
            {p.metrics.map(([fig, label]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="num needle-text">{fig}</dd>
              </div>
            ))}
            <div>
              <dt>Role</dt>
              <dd>{role}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>{p.year}</dd>
            </div>
            {links.map((l) => (
              <div key={l.href}>
                <dt>{l.label}</dt>
                <dd>
                  <a href={l.href}>{l.text}</a>
                </dd>
              </div>
            ))}
          </dl>
        </header>
        {stage && <div className="wrap">{stage}</div>}
        {children}
        <nav className="wrap next-case" aria-label="Next case study" style={{ "--next-needle": next.needle }}>
          <span className="muted">Next</span>
          <Link to={`/work/${next.slug}`}>{next.name}</Link>
        </nav>
      </main>
    </Layout>
  );
}
