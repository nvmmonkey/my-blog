import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import CaseStudy, { Section, Highlights } from "../../components/dusk/CaseStudy";

function Transport() {
  const regions = ["New York", "Amsterdam", "Frankfurt", "Tokyo", "Salt Lake City", "London", "Singapore", "Dublin", "Mainnet"];
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 400" role="img" aria-label="A bot sends JSON-RPC to the relay, which converts it to gRPC and routes it to one of nine block-engine endpoints">
        <rect x="10" y="170" width="150" height="60" rx="10" className="d-box" />
        <text x="26" y="196">Searcher bot</text>
        <text x="26" y="213" className="d-muted">
          unchanged
        </text>
        <path d="M160 200 H230" className="d-flow" />
        <text x="166" y="190" className="d-muted">
          JSON-RPC
        </text>
        <rect x="230" y="110" width="300" height="180" rx="14" className="d-box d-box--needle" />
        <text x="250" y="138">Relay</text>
        {["decode base64 or base58 transactions", "build the bundle as gRPC", "pick the region: rotate or pinned port", "pooled connections per region", "cap requests in flight"].map((t, i) => (
          <text key={t} x="250" y={166 + i * 24} className="d-muted">
            {t}
          </text>
        ))}
        {regions.map((r, i) => {
          const y = 22 + i * 42;
          return (
            <g key={r}>
              <path d={`M530 200 C 600 200, 640 ${y + 14}, 700 ${y + 14}`} className={i === 2 ? "d-line d-line--needle" : "d-line"} />
              <rect x="700" y={y} width="250" height="28" rx="7" className="d-box" />
              <text x="714" y={y + 19}>
                {r}
              </text>
              <text x="890" y={y + 19} className="d-muted num">
                {i === 8 ? "8009" : 8001 + i}
              </text>
            </g>
          );
        })}
        <text x="250" y="320" className="d-muted">
          Port 6000 rotates across all regions
        </text>
      </svg>
    </div>
  );
}

const MARKET = [
  ["$87k", "a day earned by the top 25 circular-arbitrage wallets combined; the first takes 39%"],
  ["86%", "of sampled gross is two-hop flow through meme-coin pools"],
  ["$0.003", "median gross per trade for plain SOL/USDC two-hop between AMMs"],
  ["9% vs 38%", "of revenue spent on costs by bundle-only bots versus bots that spray outside bundles"],
];

export default function SolanaMev() {
  return (
    <CaseStudy
      slug="solana-mev"
      role="Research and infrastructure, solo"
      stage={<BrowserOnly fallback={<div className="glass stage">Loading the routing simulation.</div>}>{() => {
        const RelayGlobe = require("../../components/dusk/RelayGlobe").default;
        return <RelayGlobe />;
      }}</BrowserOnly>}
    >
      <Section title="The question">
        <p>
          Before building another Solana arbitrage bot I wanted to know where the revenue actually lands, who takes it, and what it costs
          them to land a trade. So I measured the market from public chain data, took apart the bots that win it, and wrote the transport
          that carries bundles to the regional block engines.
        </p>
        <p className="disclaimer">
          The market figures below describe other wallets' activity, measured from public Solana data on 20 and 21 October 2026. They are
          not my volume or my returns. The globe above is a simulation of the relay's routing, not live traffic.
        </p>
      </Section>
      <Section title="What the market looked like">
        <ol className="ruled">
          {MARKET.map(([fig, text], i) => (
            <li key={fig} className="rise" style={{ "--i": i }}>
              <h3 className="needle-text num">{fig}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p>
          The plain strategy everyone starts with, SOL against USDC between two pools, clears a fraction of a cent. That number changed the
          plan before any code was written for it.
        </p>
      </Section>
      <Section title="The transport" figure={<Transport />}>
        <p>
          The relay lets an existing bot keep speaking the block engine's HTTP JSON-RPC format while the relay converts each bundle to gRPC
          and sends it to a regional endpoint. One port rotates across every region; each pinned port names a single region. Connections
          are pooled per region, and a cap on requests in flight keeps a burst from turning into unbounded goroutines and memory.
        </p>
        <p>Written in Go with gRPC and the Solana Go SDK.</p>
      </Section>
      <Section title="What it shows">
        <Highlights
          items={[
            {
              fig: "5",
              unit: "bot analyses",
              title: "Reverse engineering with the evidence attached",
              body: "Each claim is tagged observed, inferred or unknown, with the file and line, RPC result or transaction behind it. One standard-library Python command recomputes every table offline.",
            },
            {
              fig: "0",
              unit: "trailing bytes",
              title: "Decoders that are exact, not close",
              body: "124 recorded Jupiter v6 instructions decode with nothing left over, and a port of a closed executor's public ABI round-trips encode and decode.",
            },
            {
              fig: "86%",
              unit: "two-hop meme flow",
              title: "Measured before built",
              body: "Quantifying where arbitrage gross actually comes from showed the obvious route was not where the money was.",
            },
            {
              fig: "0",
              unit: "bot code changes",
              title: "A transparent relay",
              body: "The bot points at the relay instead of the block engine and nothing else changes. Region choice is a port number.",
            },
          ]}
        />
      </Section>
      <Section title="What's next">
        <p>The method carried over to an EVM layer-2 arbitrage bot, built detection-first: it reads and measures before anything signs.</p>
      </Section>
    </CaseStudy>
  );
}
