// Every figure here comes from the project's own repo, logs, docs or the resume. Keep them
// rounded down ("4,100+"), and never add one that cannot be traced back.

export const projects = [
  {
    slug: "llm-digest",
    image: "/img/live/llm-digest-flagship",
    name: "LLM-Digest",
    needle: "var(--needle-digest)",
    year: "2026",
    claim: "An AI analyst I run myself: every hour it reads 127 sources, runs a nine-stage LLM pipeline with a fallback model behind every stage, and writes one page of market conclusions that trace back to their posts.",
    metrics: [
      ["9", "LLM stages a run"],
      ["127", "sources an hour"],
      ["4,100+", "reports written"],
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Vercel AI SDK v6", "SQLite FTS5", "Drizzle", "NVIDIA embeddings", "Cloudflare Tunnel"],
    live: { href: "https://llm.kitkong.xyz", text: "llm.kitkong.xyz" },
  },
  {
    slug: "kv-cache",
    image: "/img/cards/kv-cache",
    name: "KV-cache LLM serving",
    needle: "var(--needle-kv)",
    year: "2026",
    claim: "Graduate capstone on serving latency: I owned the KV-cache layer under a learned vLLM scheduler, where 4-bit KV fit 2.83 times the tokens and cut time to first token 6.8 times under load.",
    metrics: [
      ["2.83×", "token capacity"],
      ["6.8×", "faster first token"],
      ["−47%", "P99 time per token"],
    ],
    stack: ["Python", "vLLM", "Triton", "PyTorch", "Llama-3.1-8B", "RTX 3090"],
  },
  {
    slug: "solana-mev",
    image: "/img/cards/solana-mev",
    name: "Solana MEV and Jito relay",
    needle: "var(--needle-relay)",
    year: "2025–2026",
    claim: "A bundle relay built for 30,000 to 60,000 requests a second across eight block-engine regions, and the market research that decided what to build on top of it.",
    metrics: [
      ["4,000+", "egress IPs"],
      ["8", "block-engine regions"],
      ["<0.5 ms", "proxy wait, from 13–28"],
    ],
    stack: ["Go", "gRPC", "Rust (tokio, axum)", "Solana Go SDK", "Jito", "Yellowstone gRPC", "Python"],
  },
  {
    slug: "polymarket",
    image: "/img/cards/polymarket",
    name: "Polymarket BTC bot",
    needle: "var(--needle-poly)",
    year: "2025–2026",
    claim: "A Rust trading system for Polymarket's 5- and 15-minute BTC Up/Down markets: it reads Binance over SBE ahead of the market's own feeds, prices each market as a binary option, and trades only when the book sits far enough from fair to pay for the fee and the hedge.",
    metrics: [
      ["720 / 894", "commits mine"],
      ["~1.65 s", "ahead of the settlement feed"],
      ["17,549", "markets in the backtest corpus"],
    ],
    stack: ["Rust (tokio)", "Binance SBE", "Polymarket CLOB", "Gnosis Safe, CTF", "Python", "LightGBM", "Parquet"],
  },
  {
    slug: "rootdata",
    image: "/img/live/rootdata-home",
    name: "RootData",
    needle: "var(--needle-root)",
    year: "2022–2026",
    claim: "I co-founded a crypto asset database and designed and collected its data from zero; it grew to 428K users and 200+ API partners, and I later opened the data to AI agents through MCP.",
    metrics: [
      ["428K", "users"],
      ["200+", "API partners"],
      ["~14×", "organic growth in a year"],
    ],
    stack: ["Product management", "MCP (TypeScript, Python)", "Cloudflare Workers", "XGBoost", "Streamlit", "SEO"],
    live: { href: "https://www.rootdata.com", text: "rootdata.com" },
  },
  {
    slug: "paymentindexer",
    image: "/img/cards/paymentindexer",
    name: "Payment indexer",
    needle: "var(--needle-ledger)",
    year: "2026",
    claim: "Rebuilds stablecoin card-payment volume from self-indexed chain data, issuer by issuer, with an evidence trail behind each figure.",
    metrics: [
      ["22 of 24", "card programs traced"],
      ["413", "registered addresses"],
      ["±0.6%", "on EVM mainnets"],
    ],
    stack: ["TypeScript", "ClickHouse", "Postgres", "EVM adapters", "Solana adapters"],
  },
  {
    slug: "westtelecom",
    image: "/img/live/westtelecom-home",
    name: "WestTelecom",
    needle: "var(--needle-west)",
    year: "2024, hardened 2026",
    claim: "A bilingual plan catalogue for a telecom reseller: staff edit plans in an embedded studio and the site updates without a redeploy. The live demo runs on fictional data.",
    metrics: [
      ["5", "product lines"],
      ["2", "languages"],
      ["9", "content schemas"],
    ],
    stack: ["Next.js App Router", "TypeScript", "Sanity v3", "GROQ", "next-intl", "Tailwind", "Vercel"],
    live: { href: "https://westtelecom-demo.vercel.app", text: "westtelecom-demo.vercel.app" },
  },
];

export const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
