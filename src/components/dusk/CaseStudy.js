import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { projects, bySlug } from "./projects";
import { useRise } from "./motion";
import { JsonLd, SocialImage, PERSON, SITE } from "./seo";
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

export function Stack({ items }) {
  return (
    <ul className="stack">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

export function StackGroups({ groups }) {
  return (
    <dl className="stack-groups">
      {groups.map(([label, items]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            <Stack items={items} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// A screenshot of the running site in a browser frame, linking to it.
export function LiveDemo({ href, host, img, alt, children }) {
  const src = useBaseUrl(`${img}-1440.webp`);
  const small = useBaseUrl(`${img}-960.webp`);
  return (
    <figure className="live-demo rise">
      <a className="live-demo__frame" href={href} target="_blank" rel="noopener">
        <span className="live-demo__bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{host}</span>
        </span>
        <img src={src} srcSet={`${small} 960w, ${src} 1440w`} sizes="(max-width: 62rem) 100vw, 60vw" width="1440" height="900" alt={alt} loading="lazy" />
      </a>
      <figcaption>
        {children}
        <a className="btn" href={href} target="_blank" rel="noopener">
          Open the live site
        </a>
      </figcaption>
    </figure>
  );
}

export default function CaseStudy({ slug, role, links = [], stage, children }) {
  const p = bySlug[slug];
  const i = projects.findIndex((x) => x.slug === slug);
  const next = projects[(i + 1) % projects.length];
  useRise([slug]);
  return (
    <Layout title={p.name} description={p.claim}>
      <SocialImage src={`${p.image}-1440.webp`} />
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "CreativeWork",
              "@id": `${SITE}/work/${p.slug}#work`,
              name: p.name,
              headline: p.name,
              description: p.claim,
              url: `${SITE}/work/${p.slug}`,
              image: `${SITE}${p.image}-1440.webp`,
              dateCreated: p.year,
              keywords: p.stack.join(", "),
              author: { "@id": PERSON["@id"] },
              creator: PERSON,
              ...(p.live ? { sameAs: p.live.href } : {}),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE },
                { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/work` },
                { "@type": "ListItem", position: 3, name: p.name, item: `${SITE}/work/${p.slug}` },
              ],
            },
          ],
        }}
      />
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
          <div className="case-hero__stack">
            <Stack items={p.stack} />
          </div>
          {p.live && (
            <div className="case-hero__links">
              <a className="btn" href={p.live.href} target="_blank" rel="noopener">
                Live: {p.live.text}
              </a>
            </div>
          )}
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
