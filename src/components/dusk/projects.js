// Every figure here comes from the project's own repo, logs or docs. Keep them rounded
// down ("4,100+"), and never add one that cannot be traced back.

export const projects = [
  {
    slug: "llm-digest",
    name: "LLM-Digest",
    needle: "var(--needle-digest)",
    year: "2026",
    claim: "Writes one page of market conclusions every hour from 127 sources, and every number on it traces back to a post.",
    metrics: [
      ["127", "sources"],
      ["4,100+", "reports"],
      ["9", "pipeline stages"],
    ],
    stack: "Next.js 16, React 19, SQLite, Vercel AI SDK, WebGL",
  },
  {
    slug: "solana-mev",
    name: "Solana MEV research",
    needle: "var(--needle-relay)",
    year: "2025–2026",
    claim: "Measured where Solana arbitrage revenue actually lands before building for it, and wrote the transport that carries bundles to regional block engines.",
    metrics: [
      ["5", "bots reverse-engineered"],
      ["86%", "of sampled gross is 2-hop"],
      ["9", "regional endpoints"],
    ],
    stack: "Python (stdlib), Go, gRPC, Solana RPC",
  },
  {
    slug: "paymentindexer",
    name: "Payment indexer",
    needle: "var(--needle-ledger)",
    year: "2026",
    claim: "Rebuilds stablecoin card-payment volume from self-indexed chain data, issuer by issuer, with an evidence trail behind each figure.",
    metrics: [
      ["22 of 24", "card programs traced"],
      ["413", "registered addresses"],
      ["±0.6%", "on EVM mainnets"],
    ],
    stack: "TypeScript, ClickHouse, Postgres, EVM and Solana adapters",
  },
  {
    slug: "westtelecom",
    name: "WestTelecom",
    needle: "var(--needle-west)",
    year: "2024, hardened 2026",
    claim: "A bilingual plan catalogue for a telecom reseller: staff edit plans in an embedded studio and the site updates without a redeploy.",
    metrics: [
      ["5", "product lines"],
      ["2", "languages"],
      ["9", "content schemas"],
    ],
    stack: "Next.js App Router, Sanity v3, next-intl, Tailwind",
  },
];

export const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
