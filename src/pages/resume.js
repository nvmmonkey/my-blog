import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useRise } from "../components/dusk/motion";
import "../components/dusk/dusk.css";

const EXPERIENCE = [
  {
    when: "2024 – now",
    what: "Independent engineer",
    org: "Own projects and client work, Vancouver",
    points: [
      "Built LLM-Digest: an hourly market report from about 127 sources through a nine-stage LLM pipeline, 4,100+ reports written. Next.js 16, SQLite, Vercel AI SDK.",
      "Built a stablecoin card-payment indexer that reconciles to within 0.6% of a public benchmark on five EVM mainnets. TypeScript, ClickHouse, Postgres.",
      "Ran Solana MEV research and infrastructure: reverse-engineered five arbitrage bots with offline-reproducible evidence, and wrote a Go relay from JSON-RPC to gRPC across nine block-engine regions.",
      "Delivered a bilingual telecom plan catalogue with an embedded CMS for a client, then audited and hardened it: secrets off the client, parameterised queries, a working revalidation webhook.",
    ],
  },
  {
    when: "2022 – 2026",
    what: "Founding team: research, product and API",
    org: "RootData, Web3 data platform",
    points: [
      "Worked on data preparation, charting, SEO, anti-crawling, UI and the back-office CRM from launch.",
      "Led the product for the RootData MCP server in 2025, then API business development.",
      "Grew the launch to 1,600 registered users and 18,000 daily page views within two months.",
      "Brought in ecosystem listings with partners including Conflux and Scroll.",
    ],
  },
  {
    when: "2022 – 2025",
    what: "Investment research",
    org: "CatcherVC and other crypto venture funds",
    points: [
      "Reviewed more than 200 seed-round deals in a year and wrote technical due diligence across ZK proofs, account abstraction, MPC and FHE.",
      "Researched liquid tokens and supported portfolio companies after investment.",
    ],
  },
  {
    when: "2022",
    what: "Product growth and business development",
    org: "ChainCatcher",
    points: ["Wrote research on modular chains, on-chain games and Web3 fundraising; ran bilingual growth campaigns and partner deals."],
  },
  {
    when: "2021",
    what: "Strategy developer",
    org: "TradingView, published scripts",
    points: ["Built and published back-tested trading strategies (moving-average crosses, stochastic and RSI with Supertrend)."],
  },
];

const EDUCATION = [
  {
    when: "2025 – 2026",
    what: "MSc, Applied Computer Science",
    org: "Fairleigh Dickinson University, Vancouver",
    points: [
      "Capstone: KV-cache-aware latency optimisation for LLM inference on a learning-to-rank scheduler.",
      "Distributed databases, algorithms, operating systems, big data and machine learning, UI design.",
    ],
  },
  {
    when: "2021",
    what: "BBA, Finance",
    org: "Beedie School of Business, Simon Fraser University",
    points: ["Invited to the UC Berkeley Haas summer exchange."],
  },
];

const SKILLS = [
  ["Languages", "TypeScript, JavaScript, Python, Go, SQL; working Rust and Solidity"],
  ["Web", "Next.js, React, Node.js, Tailwind, Docusaurus, Sanity"],
  ["Data", "SQLite, Postgres, ClickHouse, Dune, Drizzle"],
  ["Chains", "Solana and EVM: RPC, gRPC streams, instruction and event decoding"],
  ["LLM", "Vercel AI SDK, multi-provider routing, vLLM, local inference on an RTX 3090"],
  ["Ops", "Linux, systemd, Docker, Cloudflare Tunnel, HAProxy, Vercel"],
  ["Spoken", "English, Mandarin Chinese"],
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
          <h1>Kit Kong</h1>
          <p className="case-hero__claim">
            Full-stack engineer in Burnaby, BC. I build market data pipelines, on-chain indexers and LLM systems, and I came to engineering
            from finance and venture research.
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
