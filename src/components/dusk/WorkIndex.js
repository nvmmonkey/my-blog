import React from "react";
import Link from "@docusaurus/Link";
import { projects } from "./projects";
import { Thumb } from "./Visuals";

export default function WorkIndex() {
  return (
    <ol className="index">
      {projects.map((p, i) => (
        <li key={p.slug} className="index__row rise" style={{ "--row-needle": p.needle, "--i": i }}>
          <Link className="index__link" to={`/work/${p.slug}`}>
            <div className="index__name">
              <h3>{p.name}</h3>
              <span className="index__year num">{p.year}</span>
            </div>
            <div className="index__claim-col">
              <p className="index__claim">{p.claim}</p>
              <ul className="metrics">
                {p.metrics.map(([fig, label]) => (
                  <li key={label}>
                    <strong>{fig}</strong>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="index__thumb">
              <Thumb slug={p.slug} />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
