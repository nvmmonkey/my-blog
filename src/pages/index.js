import React, { useRef } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import HeroScene from "../components/dusk/HeroScene";
import ProjectGallery from "../components/dusk/ProjectGallery";
import TechOrbs from "../components/dusk/TechOrbs";
import { useOnPhoto, useRise } from "../components/dusk/motion";
import { useFlow } from "../components/dusk/flow";
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
  { initial: "L", name: "LLM-Digest", line: "Nine-stage LLM report from 127 sources", fig: "4,100+", unit: "reports", status: "Running", tone: "on", breathe: true },
  { initial: "K", name: "KV-cache LLM serving", line: "4-bit KV under a learned vLLM scheduler", fig: "6.8×", unit: "faster first token", status: "Done", tone: "on" },
  { initial: "S", name: "Solana Jito relay", line: "Eight regions, one shared limiter", fig: "4,000+", unit: "egress IPs", status: "Built", tone: "on" },
  { initial: "R", name: "RootData", line: "Co-founder; designed the database from zero", fig: "428K", unit: "users", status: "2022–2026", tone: "on" },
  { initial: "P", name: "Payment indexer", line: "Card programs traced on chain", fig: "22 of 24", unit: "programs", status: "Reconciling", tone: "open", breathe: true },
  { initial: "W", name: "WestTelecom", line: "Bilingual catalogue, live demo", fig: "5", unit: "product lines", status: "Live", tone: "on" },
];

const AI = [
  { fig: "9", title: "LLM-Digest", body: "A nine-stage pipeline, a RAG agent with cited answers and one model layer with fallbacks, running every hour.", to: "/work/llm-digest", link: "Case study" },
  { fig: "2.83×", title: "KV-cache serving", body: "4-bit KV and block-sparse Triton kernels under a learned vLLM scheduler on one RTX 3090.", to: "/work/kv-cache", link: "Case study" },
  { fig: "~20 tools", title: "MCP servers", body: "Open-sourced TypeScript and Python MCP servers that give AI agents RootData's crypto data as tools, over stdio, SSE and Cloudflare Workers.", to: "https://github.com/nvmmonkey/Rootdata-MCP", link: "GitHub" },
  { fig: "27B", title: "Local inference", body: "Quantized 27B models and vision models on a single 24 GB card with llama.cpp, Ollama and vLLM.", to: "/blog/27b-on-one-3090", link: "Notes" },
];

const WRITING = [
  { slug: "autumn-2026", title: "Where I am, autumn 2026" },
  { slug: "jito-relay-throughput", title: "Designing a bundle relay for 30,000 requests a second" },
  { slug: "nine-stages-one-conclusion", title: "Nine stages, one conclusion" },
  { slug: "kv-cache-capstone", title: "Smaller KV cache, faster first token" },
];

export default function Home() {
  const hero = useRef(null);
  useOnPhoto(hero);
  useRise();
  useFlow();
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
              <h1 className="flow-words">I build AI systems that read markets for you.</h1>
              <p>
                I'm Kit, an engineer in Vancouver. I build LLM pipelines and agents, the serving layer under them, and the low-latency
                infrastructure and data systems that trading runs on.
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
                <span>Open to AI, full-stack and data engineering roles</span>
                <Link to="/resume">Resume</Link>
              </div>
            </aside>
          </div>
        </section>

        <ProjectGallery />

        <section className="band band--tight" id="stack">
          <div className="wrap">
            <div className="band__head flow-up">
              <h2>Stack</h2>
              <p>What the projects below are written in. Grab a ball and spin it.</p>
            </div>
            <TechOrbs />
          </div>
        </section>

        <section className="band ai-band" id="ai">
          <div className="wrap">
            <div className="band__head flow-up">
              <h2>AI systems</h2>
              <p>
                LLM pipelines and agents I run, the serving layer under them, and the tools that let other agents use my data. The{" "}
                <Link to="/work/llm-digest">LLM-Digest case study</Link> replays one real run.
              </p>
            </div>
            <ul className="ai-grid">
              {AI.map((a, i) => (
                <li key={a.title} className="rise" style={{ "--i": i }}>
                  <strong>{a.fig}</strong>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                  {a.to.startsWith("http") ? <a href={a.to}>{a.link}</a> : <Link to={a.to}>{a.link}</Link>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="band__head flow-up">
              <h2>Writing</h2>
              <p>
                Longer notes on how these were built. All posts are on the <Link to="/blog">blog</Link>, and there is more about me on <Link to="/about">About me</Link>.
              </p>
            </div>
            <ol className="ruled ruled--links">
              {WRITING.map((w, i) => (
                <li key={w.slug} className="rise" style={{ "--i": i }}>
                  <h3>
                    <Link to={`/blog/${w.slug}`}>{w.title}</Link>
                  </h3>
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
