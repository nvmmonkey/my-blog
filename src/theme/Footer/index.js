import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { projects } from "../../components/dusk/projects";

// The site footer: who this is and how to reach them, then the map of the site.

const SITE = [
  ["About Me", "/about"],
  ["Experience", "/resume"],
  ["Blog", "/blog"],
  ["Notebook, 2023–2024", "/docs/intro"],
];

const WRITING = [
  ["Where I am, autumn 2026", "/blog/autumn-2026"],
  ["Designing a bundle relay for 30,000 requests a second", "/blog/jito-relay-throughput"],
  ["Nine stages, one conclusion", "/blog/nine-stages-one-conclusion"],
];

const ELSEWHERE = [
  ["Email", "mailto:kitstation@163.com"],
  ["GitHub", "https://github.com/nvmmonkey"],
  ["LinkedIn", "https://www.linkedin.com/in/wenhui-kang-800859a4/"],
  ["Telegram", "https://t.me/fifibam"],
  ["X", "https://twitter.com/bamboobee5"],
  ["RSS", "https://blog.kitkong.xyz/blog/rss.xml"],
];

function Col({ title, items }) {
  return (
    <nav className="site-foot__col" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {items.map(([label, to]) => (
          <li key={to}>{/^(https?:|mailto:)/.test(to) ? <a href={to}>{label}</a> : <Link to={to}>{label}</Link>}</li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const mark = useBaseUrl("/img/mark.svg");
  const year = new Date().getFullYear();
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="site-foot__lead">
          <div className="site-foot__who">
            <img src={mark} alt="" width="40" height="40" />
            <div>
              <p className="site-foot__name">Kit Kong</p>
              <p className="site-foot__line">AI systems, trading infrastructure and data, built in Vancouver.</p>
            </div>
          </div>
          <div className="site-foot__cta">
            <span className="site-foot__open">
              <i aria-hidden="true" />
              Open to AI, full-stack and data engineering roles
            </span>
            <a className="btn" href="mailto:kitstation@163.com">
              kitstation@163.com
            </a>
          </div>
        </div>

        <div className="site-foot__cols">
          <Col title="Projects" items={projects.map((p) => [p.name, `/work/${p.slug}`])} />
          <Col title="Site" items={SITE} />
          <Col title="Latest writing" items={WRITING} />
          <Col title="Elsewhere" items={ELSEWHERE} />
        </div>

        <div className="site-foot__base">
          <p>
            © {year} Kit Kong. Built with Docusaurus, React, Three.js and GSAP, in the Hallmark Dusk theme. Hero photographs from Wikimedia
            Commons (CC BY 3.0, CC BY-SA 4.0); land outlines from Natural Earth; logos from Simple Icons.
          </p>
          <a className="site-foot__top" href="#__docusaurus">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
