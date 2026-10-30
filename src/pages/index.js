import React, { useRef } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import HeroScene from "../components/dusk/HeroScene";
import WorkIndex from "../components/dusk/WorkIndex";
import { useOnPhoto, useRise } from "../components/dusk/motion";
import "../components/dusk/dusk.css";

const Check = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Dot = ({ breathe }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="4" fill="currentColor" className={breathe ? "breathe" : undefined} />
  </svg>
);

const RUNNING = [
  { initial: "L", name: "LLM-Digest", line: "Hourly report from 127 sources", fig: "4,100+", unit: "reports", status: "Running", tone: "on", breathe: true },
  { initial: "P", name: "Payment indexer", line: "Card programs traced on chain", fig: "22 of 24", unit: "programs", status: "Reconciling", tone: "open", breathe: true },
  { initial: "S", name: "Solana MEV research", line: "Bots reverse-engineered, offline-reproducible", fig: "5", unit: "analyses", status: "Done", tone: "on" },
  { initial: "W", name: "WestTelecom", line: "Bilingual catalogue with a live CMS", fig: "5", unit: "product lines", status: "Shipped", tone: "on" },
];

const PRINCIPLES = [
  {
    head: "Every number traces back",
    body: "LLM-Digest hands typed conclusions from stage to stage and links each figure to the post it came from. The payment indexer keeps an evidence row behind every address it attributes.",
  },
  {
    head: "Say what was observed and what was guessed",
    body: "The Solana analyses tag each claim as observed, inferred or unknown, with the file, RPC result or transaction that backs it. One command recomputes every table offline.",
  },
  {
    head: "Measure the result you were hoping not to get",
    body: "A send path cut from 672 ms to about 12 ms still landed none of 22 attempts from a remote host. That isolated distance, not code, as the limit, before more time went into code.",
  },
  {
    head: "Fail closed",
    body: "When a venue's fee turned out to be dynamic and unbounded, the router stopped routing that pool rather than price it with a guessed constant.",
  },
];

const ROLES = [
  { when: "2025 – 2026", what: "MSc, Applied Computer Science", org: "Fairleigh Dickinson University, Vancouver" },
  { when: "2022 – 2026", what: "Founding team: research, product, API", org: "RootData, Web3 data platform" },
  { when: "2024 – 2025", what: "Due diligence and liquid research, contract", org: "Crypto venture funds" },
  { when: "2021", what: "BBA, Finance", org: "Beedie School of Business, Simon Fraser University" },
];

export default function Home() {
  const hero = useRef(null);
  useOnPhoto(hero);
  useRise();
  const beach = useBaseUrl("/img/photo/mystic-beach-2400.webp");
  const beachSmall = useBaseUrl("/img/photo/mystic-beach-1280.webp");

  return (
    <Layout title="Kit Kong" description="Full-stack engineer in Vancouver building market data pipelines, on-chain indexers and LLM report systems.">
      <main className="dusk">
        <section className="hero" ref={hero}>
          <HeroScene src="/img/photo/fog-valley-2400.webp" width={2400} height={1568} focus={0.32} />
          <div className="hero__scrim" />
          <div className="wrap hero__inner">
            <div className="hero__copy">
              <h1>I build the systems that read markets for you.</h1>
              <p>
                I'm Kit, a full-stack engineer in Vancouver. I write the data pipelines, on-chain indexers and LLM layers that turn a
                noisy feed into a page a person can act on.
              </p>
              <div className="actions">
                <Link className="btn" to="/work">
                  See the work
                </Link>
                <Link className="btn btn--ghost" to="/resume">
                  Resume
                </Link>
              </div>
            </div>
            <aside className="glass runlist" aria-label="What is running now">
              <div className="runlist__head">
                <strong>On the desk</strong>
                <span>October 2026</span>
              </div>
              <ul>
                {RUNNING.map((r, i) => (
                  <li key={r.name} className="rise" style={{ "--i": i }}>
                    <span className="initial">{r.initial}</span>
                    <span>
                      <span className="runlist__name">{r.name}</span>
                      <span className="runlist__line">{r.line}</span>
                    </span>
                    <span className="runlist__fig num">
                      {r.fig}
                      <small>{r.unit}</small>
                      <span className={`status status--${r.tone}`}>
                        {r.tone === "on" && !r.breathe ? <Check /> : <Dot breathe={r.breathe} />}
                        {r.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="runlist__open">
                <span>Open to full-stack and data engineering roles</span>
                <Link to="/resume">Resume</Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="band band--flush" id="work">
          <div className="wrap">
            <div className="band__head">
              <h2>Selected work</h2>
              <p>Four projects, each with its own write-up: what the problem was, how it is built and what it measured.</p>
            </div>
            <WorkIndex />
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="band__head">
              <h2>How I work</h2>
              <p>Habits that show up across the projects, each with the place it came from.</p>
            </div>
            <ol className="ruled">
              {PRINCIPLES.map((p, i) => (
                <li key={p.head} className="rise" style={{ "--i": i }}>
                  <h3>{p.head}</h3>
                  <p>{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="band__head">
              <h2>Background</h2>
              <p>
                Finance first, then engineering. The full history is on the <Link to="/resume">resume</Link>.
              </p>
            </div>
            <ol className="roles">
              {ROLES.map((r, i) => (
                <li key={r.what} className="rise" style={{ "--i": i }}>
                  <span className="roles__when">{r.when}</span>
                  <div>
                    <h3>{r.what}</h3>
                    <p className="roles__org">{r.org}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="closing" id="contact">
          <img className="closing__photo" src={beach} srcSet={`${beachSmall} 1280w, ${beach} 2400w`} sizes="100vw" alt="" loading="lazy" width="2400" height="1214" />
          <div className="wrap">
            <div className="glass closing__card">
              <h2>Write to me</h2>
              <p>I'm in Burnaby, BC, on Pacific time.</p>
              <ul className="contact">
                <li>
                  <span>Email</span>
                  <a href="mailto:kitstation@163.com">kitstation@163.com</a>
                </li>
                <li>
                  <span>GitHub</span>
                  <a href="https://github.com/nvmmonkey">nvmmonkey</a>
                </li>
                <li>
                  <span>LinkedIn</span>
                  <a href="https://www.linkedin.com/in/wenhui-kang-800859a4/">Kit Kong</a>
                </li>
              </ul>
              <a className="btn" href="mailto:kitstation@163.com">
                Send an email
              </a>
            </div>

          </div>
        </section>
        <div className="wrap credits">
          <p className="credit">
              Photographs from Wikimedia Commons: fog in the Savoureuse valley by Thomas Bresson (
              <a href="https://commons.wikimedia.org/wiki/File:Vallee-brouillard.jpg">CC BY 3.0</a>); Mystic Beach, Vancouver Island by
              Michal Klajban (<a href="https://commons.wikimedia.org/wiki/File:Mystic_Beach,_Vancouver_Island,_Canada_10.jpg">CC BY-SA 4.0</a>).
            </p>
        </div>
      </main>
    </Layout>
  );
}
