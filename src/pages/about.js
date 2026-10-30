import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useRise } from "../components/dusk/motion";
import "../components/dusk/dusk.css";

const STRENGTHS = [
  {
    head: "AI systems",
    body: "LLM pipelines with typed stages and fallback models, retrieval with citations, model layers that outlive any one provider, and the serving side underneath: KV cache, kernels, local inference.",
    to: "/work/llm-digest",
  },
  {
    head: "Low-latency and on-chain",
    body: "Rust, Go and Python trading infrastructure: a Jito bundle relay across eight regions, a live Polymarket system, arbitrage on an EVM layer-2, measured before it is built.",
    to: "/work/solana-mev",
  },
  {
    head: "Product and data",
    body: "Co-founder of a crypto data platform that reached 428K users, with a database I designed and collected from zero, and four years reading 200+ seed deals a year. I know what the data is for before I write the pipeline.",
    to: "/work/rootdata",
  },
  {
    head: "Infrastructure",
    body: "A Proxmox homelab with a Synology NAS, Linux and Arch on bare metal and in VMs, Docker and Kubernetes, machines configured with Ansible, and servers and address ranges across regions for the Solana relay. Production apps run on Vercel and Cloudflare.",
    to: "/work/solana-mev",
  },
  {
    head: "Building with AI",
    body: "Claude Code, Codex, OpenCode and Perplexity every day, with notes and checks that keep agents honest on large codebases. LoRA training and ComfyUI pipelines on a local RTX 3090.",
    to: "/blog/working-with-coding-agents",
  },
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
  { when: "2025 – now", what: "Independent quant and MEV developer", org: "Rust, Go and Python trading systems" },
  { when: "2025 – 2026", what: "MSc, Applied Computer Science", org: "Fairleigh Dickinson University, Vancouver" },
  { when: "2024 – 2026", what: "Investment advisor", org: "J17 Crypto, family office" },
  { when: "2022 – 2026", what: "Co-founder, product manager and advisor", org: "RootData, crypto data platform" },
  { when: "2022 – 2026", what: "Investment partner", org: "CatcherVC" },
  { when: "2022 – 2026", what: "Overseas operations and business development", org: "ChainCatcher" },
  { when: "2021", what: "BBA, Finance", org: "Beedie School of Business, Simon Fraser University" },
];

export default function About() {
  useRise();
  return (
    <Layout title="About me" description="Kit, an engineer in Vancouver who came to code from finance and crypto research, and builds AI systems and trading infrastructure.">
      <main className="dusk">
        <header className="wrap case-hero">
          <h1 className="flow-words">About me</h1>
          <p className="case-hero__claim">
            I'm Kit, an engineer in Burnaby, BC. I came to code from finance: a business degree, then years of reading crypto deals and
            building a data product, and the systems I build now still start from what the numbers are for.
          </p>
        </header>

        <section className="band">
          <div className="wrap prose">
            <h2>The short version</h2>
            <div className="prose__body">
              <p>
                I studied finance at Simon Fraser University and spent the years after it in crypto: researching deals as an investment
                partner at CatcherVC, advising a family office, running overseas business development for ChainCatcher, and building
                co-founding RootData, whose database I designed and collected from zero, into a platform with 428K users.
              </p>
              <p>
                In 2025 I went back to school for an MSc in Applied Computer Science and spent the same year building Solana MEV
                infrastructure. In 2026 I built LLM-Digest, an AI analyst I run every day, and finished a capstone on KV-cache LLM serving.
                The long version is in <Link to="/blog/autumn-2026">Where I am, autumn 2026</Link>.
              </p>
              <p>I'm looking for AI, full-stack and data engineering roles in Vancouver. I work in English, Mandarin and Cantonese.</p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="band__head flow-up">
              <h2>What I'm good at</h2>
            </div>
            <ul className="ai-grid ai-grid--auto">
              {STRENGTHS.map((s, i) => (
                <li key={s.head} className="rise" style={{ "--i": i }}>
                  <h3>{s.head}</h3>
                  <p>{s.body}</p>
                  <Link to={s.to}>See the work</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="band__head flow-up">
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
            <div className="band__head flow-up">
              <h2>Background</h2>
              <p>
                Finance first, then engineering. The full history is under <Link to="/resume">Experience</Link>.
              </p>
            </div>
            <ol className="roles">
              {ROLES.map((r, i) => (
                <li key={`${r.what}-${r.org}`} className="rise" style={{ "--i": i }}>
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

        <section className="band">
          <div className="wrap prose">
            <h2>Write to me</h2>
            <div className="prose__body">
              <p>
                Email <a href="mailto:kitstation@163.com">kitstation@163.com</a>, or find me on{" "}
                <a href="https://github.com/nvmmonkey">GitHub</a> and <a href="https://www.linkedin.com/in/wenhui-kang-800859a4/">LinkedIn</a>.
                I'm on Pacific time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
