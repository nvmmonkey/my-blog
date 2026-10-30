import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useRise } from "../components/dusk/motion";
import "../components/dusk/dusk.css";

// From the owner's resumes (October 2026). Home address and phone stay off the site.
const EXPERIENCE = [
  {
    when: "Jan 2025 – now",
    what: "Independent quant and MEV developer",
    org: "Low-latency trading systems in Rust, Go and Python, Vancouver",
    points: [
      "Built a Go gRPC bundle relay, later ported to Rust (tokio, axum), fanning Jito bundles to 8 block-engine regions over 4,000+ egress IPs with token-bucket limits and Retry-After cooldowns.",
      "Fixed a relay throughput collapse with a shared atomic limiter and a min-heap ready queue: proxy wait fell from 13–28 ms to under 0.5 ms.",
      "Built a Rust Solana atomic-arbitrage bot peaking at about $80M daily volume, with Jito bundles, Kamino flash loans, compute budgets for 22 DEXs and an on-chain profit guard.",
      "Wrote about 80% of a live Rust Polymarket trading system (720 of 894 commits): Binance SBE feed, signals, execution, risk, reconciliation and gasless claims.",
      "Built Robinhood Chain (Arbitrum L2) arbitrage with Bellman-Ford cycle search, bit-exact Uniswap V3/V4 tick math and Solidity flash executors; sign-and-send went from 672 ms to 12 ms.",
    ],
  },
  {
    when: "Sep 2022 – Sep 2026",
    what: "Co-founder, product manager and advisor",
    org: "RootData, crypto data platform",
    points: [
      "Co-founded the platform and designed and collected its database from zero; as PM grew it to 428K users (about 14× organic in 12 months), 700K–1M daily page views, 22K+ projects and 200+ API partners including Binance Alpha and OKX Boost.",
      "Built data charting, SEO, anti-crawling, UI and CRM; open-sourced TypeScript and Python MCP servers exposing about 20 RootData tools to AI agents.",
      "Built a 61-model XGBoost analytics app over 6,000+ projects (launch AUC 0.81) from 116 automated experiments.",
    ],
  },
  {
    when: "Feb 2024 – Nov 2024",
    what: "Website project manager and full-stack developer",
    org: "Telecom reseller (client), shown here as WestTelecom",
    points: [
      "Shipped a bilingual plan catalogue on Next.js 13 App Router, TypeScript and Sanity v3 across mobile, internet, TV and security (229 commits).",
      "Built filtering, sorting, comparison and modal UIs; wired HubSpot lead capture, NextAuth and signed webhooks for on-demand revalidation; later audited it and moved leaked secrets server-side.",
    ],
  },
  {
    when: "Jun 2024 – Jun 2026",
    what: "Investment advisor",
    org: "J17 Crypto, family office (remote)",
    points: ["Advised portfolio management and due diligence for about $90M in digital assets; built Dune SQL dashboards for position and risk monitoring."],
  },
  {
    when: "Mar 2022 – Sep 2026",
    what: "Investment partner",
    org: "CatcherVC",
    points: ["Reviewed 200+ seed deals a year and managed $4M+ in digital assets; researched ZK proofs, account abstraction and FHE/MPC. Portfolio includes MegaETH, GRVT and Scroll."],
  },
  {
    when: "Mar 2022 – Sep 2026",
    what: "Overseas operations and business development",
    org: "ChainCatcher",
    points: ["Co-interviewed founders of ether.fi, LayerZero Labs and Wormhole Foundation; co-hosted a Hong Kong Web3 Festival 2023 side event; closed BD deals with LayerZero, Mina and Consensys."],
  },
];

const PROJECTS = [
  {
    when: "May 2026 – now",
    what: "LLM-Digest, self-hosted market intelligence",
    org: "Next.js 16, React 19, TypeScript, AI SDK v6, SQLite FTS5",
    points: [
      "Nine-stage narrative LLM pipeline with Zod-validated JSON hand-offs, jsonrepair and retry, byte-level stall watchdogs and per-task model fallback; 4,100+ reports from 127 sources.",
      "Tool-calling RAG agent (6 tools, phased 3-step loop) fusing SQLite FTS5/BM25 with 12 web search sources by reciprocal rank fusion, with query rewriting and citation checks.",
      "Semantic news dedup with NVIDIA embeddings, SimHash and cosine-centroid clustering over in-memory Float32 pools, chosen over a vector database after benchmarking Qdrant and Postgres.",
      "One client over 7 LLM providers: encrypted key vault, per-provider pacing, daily budgets, tool-call repair and per-run cost tracking.",
      "Self-hosted with systemd and Cloudflare Tunnel; staged-build deploys cut downtime from about 2.5 minutes to about 3 seconds.",
    ],
  },
  {
    when: "Jul 2026 – Aug 2026",
    what: "KV-cache coordinated LLM serving, graduate capstone",
    org: "Python, vLLM, Triton, Llama-3.1-8B on an RTX 3090; team of 4",
    points: [
      "Owned the KV-cache layer under a learning-to-rank vLLM scheduler: 4-bit KV gave 2.83× token capacity and cut mean time to first token 6.8× at 64 requests a second.",
      "Wrote block-sparse attention Triton decode kernels (1.33–1.75× standalone) and patched vLLM's decode path: −22% time per output token, −47% P99.",
    ],
  },
  {
    when: "2023 – now",
    what: "Local LLM inference lab",
    org: "Ollama, llama.cpp (CUDA), GGUF K-quants, ComfyUI, Hugging Face",
    points: ["Run and tune quantized 27B LLMs and vision models on one 24 GB RTX 3090; trained and published an OPT-125M ranker and dataset on Hugging Face."],
  },
];

const EDUCATION = [
  {
    when: "Jan 2025 – Aug 2026",
    what: "MSc, Applied Computer Science",
    org: "Fairleigh Dickinson University, Vancouver",
    points: ["CGPA 3.56/4. Capstone, Distributed Database Systems and Advanced Operating Systems: A."],
  },
  {
    when: "Jan 2020 – Sep 2021",
    what: "BBA, Finance",
    org: "Beedie School of Business, Simon Fraser University",
    points: ["CGPA 3.4/4, Statistics 3.8/4. Invited to the UC Berkeley Haas summer program."],
  },
];

const SKILLS = [
  ["Systems", "Rust (tokio, axum), Go, Python, TypeScript, C/C++, SQL, gRPC, Linux"],
  ["Web", "Next.js (App Router, RSC), React 19, Tailwind, shadcn/Radix, next-intl, Node.js, Sanity, NextAuth"],
  ["ML systems", "vLLM, Triton, PyTorch, KV-cache quantization, llama.cpp, Ollama, MCP, Vercel AI SDK"],
  ["Chains", "Solana (Jito, Yellowstone, Jupiter), Polymarket CLOB, Uniswap V3/V4, Solidity and Foundry"],
  ["AI tools", "Claude Code, Codex, OpenCode, Perplexity; LoRA training, ComfyUI, Hugging Face, Ollama"],
  ["Infrastructure", "Proxmox homelab, Synology NAS, KVM/QEMU, Linux and Arch Linux, Docker, Kubernetes, Ansible, Cloudflare, Vercel, AWS, GCP"],
  ["Finance", "Bloomberg, S&P Capital IQ, Dune SQL, DCF and LBO modelling"],
  ["Spoken", "English, Mandarin and Cantonese"],
];

function Roles({ items }) {
  return (
    <ol className="roles">
      {items.map((r, i) => (
        <li key={r.what + r.when} className="rise" style={{ "--i": i }}>
          <span className="roles__when">{r.when}</span>
          <div>
            <h3>{r.what}</h3>
            <p className="roles__org">{r.org}</p>
            <ul>
              {r.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Resume() {
  useRise();
  return (
    <Layout title="Resume" description="Kit Kong, full-stack engineer in Vancouver: experience, education and skills.">
      <main className="dusk">
        <header className="wrap case-hero">
          <h1>Wenhui (Kit) Kang</h1>
          <p className="case-hero__claim">
            Engineer in Burnaby, BC, working on low-latency trading systems, LLM infrastructure and full-stack products. I came to
            engineering from finance and venture research.
          </p>
          <div className="actions no-print">
            <button type="button" className="btn" onClick={() => window.print()}>
              Print or save as PDF
            </button>
            <Link className="btn btn--ghost" to="/work">
              See the work
            </Link>
          </div>
          <dl className="case-hero__meta">
            <div>
              <dt>Email</dt>
              <dd>
                <a href="mailto:kitstation@163.com">kitstation@163.com</a>
              </dd>
            </div>
            <div>
              <dt>GitHub</dt>
              <dd>
                <a href="https://github.com/nvmmonkey">github.com/nvmmonkey</a>
              </dd>
            </div>
            <div>
              <dt>LinkedIn</dt>
              <dd>
                <a href="https://www.linkedin.com/in/wenhui-kang-800859a4/">linkedin.com/in/wenhui-kang-800859a4</a>
              </dd>
            </div>
          </dl>
        </header>
        <section className="band">
          <div className="wrap">
            <div className="band__head">
              <h2>Experience</h2>
            </div>
            <Roles items={EXPERIENCE} />
          </div>
        </section>
        <section className="band">
          <div className="wrap">
            <div className="band__head">
              <h2>Selected projects</h2>
            </div>
            <Roles items={PROJECTS} />
          </div>
        </section>
        <section className="band">
          <div className="wrap">
            <div className="band__head">
              <h2>Education</h2>
            </div>
            <Roles items={EDUCATION} />
          </div>
        </section>
        <section className="band">
          <div className="wrap">
            <div className="band__head">
              <h2>Skills</h2>
            </div>
            <ol className="ruled">
              {SKILLS.map(([k, v], i) => (
                <li key={k} className="rise" style={{ "--i": i }}>
                  <h3>{k}</h3>
                  <p>{v}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </Layout>
  );
}
