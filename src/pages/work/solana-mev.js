import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import CaseStudy, { Section, Highlights, StackGroups } from "../../components/dusk/CaseStudy";

const REGIONS = ["New York", "Amsterdam", "Frankfurt", "Tokyo", "Salt Lake City", "London", "Singapore", "Dublin"];

function Transport() {
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 400" role="img" aria-label="A bot sends JSON-RPC to the relay, which converts it to gRPC and routes it to one of eight regional block engines">
        <rect x="10" y="170" width="150" height="60" rx="10" className="d-box" />
        <text x="26" y="196">Searcher bot</text>
        <text x="26" y="213" className="d-muted">
          unchanged
        </text>
        <path d="M160 200 H230" className="d-flow" />
        <text x="166" y="190" className="d-muted">
          JSON-RPC
        </text>
        <rect x="230" y="100" width="300" height="200" rx="14" className="d-box d-box--needle" />
        <text x="250" y="128">Relay</text>
        {["decode base64 or base58 transactions", "build the bundle as gRPC", "pick the region: rotate or pinned port", "pick the egress address that is ready", "pooled connections per region", "cap requests in flight"].map((t, i) => (
          <text key={t} x="250" y={156 + i * 24} className="d-muted">
            {t}
          </text>
        ))}
        {REGIONS.map((r, i) => {
          const y = 30 + i * 44;
          return (
            <g key={r}>
              <path d={`M530 200 C 600 200, 640 ${y + 14}, 700 ${y + 14}`} className={i === 2 ? "d-line d-line--needle" : "d-line"} />
              <rect x="700" y={y} width="250" height="28" rx="7" className="d-box" />
              <text x="714" y={y + 19}>
                {r}
              </text>
              <text x="890" y={y + 19} className="d-muted num">
                {8001 + i}
              </text>
            </g>
          );
        })}
        <text x="250" y="330" className="d-muted">
          Port 6000 rotates across all regions
        </text>
      </svg>
    </div>
  );
}

function Limiter() {
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 300" role="img" aria-label="Every egress address and region pair has a token bucket; a min-heap orders pairs by when each may send next; the sender takes the earliest ready pair and Retry-After answers push the pair back into the heap">
        <rect x="10" y="110" width="150" height="70" rx="10" className="d-box" />
        <text x="26" y="138">Bundles in</text>
        <text x="26" y="158" className="d-muted">
          30k–60k a second
        </text>
        <path d="M160 145 H210" className="d-flow" />

        <rect x="210" y="40" width="250" height="210" rx="12" className="d-box" />
        <text x="228" y="66">Token buckets</text>
        <text x="228" y="86" className="d-muted">
          one per egress address × region
        </text>
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x={228 + (i % 8) * 27} y={104 + Math.floor(i / 8) * 34} width="20" height="24" rx="4" className={i === 5 || i === 13 ? "d-box d-box--needle" : "d-box"} />
        ))}
        <text x="228" y="232" className="d-muted">
          one shared atomic limiter
        </text>
        <path d="M460 145 H510" className="d-flow" />

        <rect x="510" y="60" width="210" height="170" rx="12" className="d-box d-box--needle" />
        <text x="528" y="86">Ready queue</text>
        <text x="528" y="106" className="d-muted">
          min-heap on next-allowed time
        </text>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const lvl = i === 0 ? 0 : i < 3 ? 1 : 2;
          const idx = i === 0 ? 0 : i < 3 ? i - 1 : i - 3;
          const n = lvl === 0 ? 1 : lvl === 1 ? 2 : 4;
          const x = 528 + ((idx + 0.5) * 174) / n;
          const y = 134 + lvl * 34;
          return <circle key={i} cx={x} cy={y} r="9" className={i === 0 ? "d-box d-box--needle" : "d-box"} />;
        })}
        <path d="M720 145 H770" className="d-flow" />

        <rect x="770" y="110" width="180" height="70" rx="10" className="d-box" />
        <text x="786" y="138">gRPC pool</text>
        <text x="786" y="158" className="d-muted">
          to the region's engine
        </text>
        <path d="M860 180 C 860 280, 620 290, 620 232" className="d-line d-line--needle" strokeDasharray="3 6" />
        <text x="650" y="282" className="d-muted">
          Retry-After pushes the pair back with its cooldown
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
      role="Infrastructure and research, solo"
      stage={
        <BrowserOnly fallback={<div className="glass stage">Loading the routing simulation.</div>}>
          {() => {
            const RelayGlobe = require("../../components/dusk/RelayGlobe").default;
            return <RelayGlobe />;
          }}
        </BrowserOnly>
      }
    >
      <Section title="What it is">
        <p>
          In 2025 my main work was Solana MEV infrastructure. The centre of it is a bundle relay: searcher bots hand it bundles, and it
          spreads them across eight Jito block-engine regions and more than 4,000 egress addresses while keeping every region's rate
          limits. It was written in Go with gRPC and later ported to Rust on tokio and axum.
        </p>
        <p>
          Around it: a Rust atomic-arbitrage bot that sends Jupiter routes in Jito bundles with Kamino flash loans, compute budgets
          tuned for 22 DEXs and an on-chain profit guard; a Yellowstone gRPC monitor that decodes competitors' MEV transactions with
          lookup-table resolution; and pool discovery with RPC latency ranking feeding a self-hosted Jupiter router.
        </p>
        <p className="disclaimer">The globe above is a simulation of the relay's routing, not live traffic.</p>
      </Section>

      <Section title="The transport" figure={<Transport />}>
        <p>
          Bots keep speaking the block engine's HTTP JSON-RPC format; the relay converts each bundle to gRPC and sends it to a regional
          endpoint. One port rotates across every region and each pinned port names a single region, so choosing a region is a port
          number and the bot's code does not change. Connections are pooled per region.
        </p>
      </Section>

      <Section title="Throughput" figure={<Limiter />}>
        <p>
          The relay was built for 30,000 to 60,000 requests a second across regions, fire-and-forget with retries. At that rate every
          egress address and region pair has its own budget: a token bucket, plus a cooldown whenever the engine answers with
          Retry-After.
        </p>
        <p>
          Under load the first version's throughput collapsed. Three causes: limiter state drifted out of sync between workers, an egress
          address was locked before it was actually ready to send, and a check-then-act race let two workers take the same slot. The fix
          was one shared atomic limiter and a min-heap ready queue ordered by the time each pair may send next, so a sender takes the
          earliest ready pair instead of polling for one.
        </p>
        <ul className="wait-bars">
          <li>
            <span>Proxy wait, before</span>
            <i style={{ width: "100%" }} />
            <b>13–28 ms</b>
          </li>
          <li className="is-after">
            <span>After</span>
            <i style={{ width: "2.5%" }} />
            <b>&lt;0.5 ms</b>
          </li>
        </ul>
      </Section>

      <Section title="What it shows">
        <Highlights
          items={[
            {
              fig: "<0.5 ms",
              unit: "proxy wait, from 13–28",
              title: "Contention found and removed",
              body: "A shared atomic limiter and a ready queue replaced per-worker state and early locking, and the race went with them.",
            },
            {
              fig: "~300k",
              unit: "goroutines, uncapped",
              title: "Backpressure instead of a pile-up",
              body: "At 10,000 requests a second with every address cooling down for 30 seconds, an uncapped relay would hold about 300,000 goroutines and the memory that comes with them. A cap on requests in flight turns the burst into a queue.",
            },
            {
              fig: "Go → Rust",
              unit: "tokio, axum",
              title: "Same front, new runtime",
              body: "The Rust port on tokio and axum keeps the relay's contract: JSON-RPC in, one port per region, the rotating port across all of them.",
            },
            {
              fig: "0",
              unit: "trailing bytes",
              title: "Decoders that are exact, not close",
              body: "124 recorded Jupiter v6 instructions decode with nothing left over, and a port of a closed executor's public ABI round-trips encode and decode.",
            },
          ]}
        />
      </Section>

      <Section title="Measured before built">
        <p>
          Before building another strategy I measured where Solana arbitrage revenue actually lands, from public chain data, and took
          five of the winning bots apart. Each claim is tagged observed, inferred or unknown, and one standard-library Python command
          recomputes every table offline.
        </p>
        <ol className="ruled">
          {MARKET.map(([fig, text], i) => (
            <li key={fig} className="rise" style={{ "--i": i }}>
              <h3 className="needle-text num">{fig}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className="disclaimer">
          These figures describe other wallets' activity, measured on 20 and 21 October 2026. They are not my volume or my returns. More
          in <Link to="/blog/measure-before-you-build">Measure before you build</Link>.
        </p>
      </Section>

      <Section title="Stack">
        <StackGroups
          groups={[
            ["Relay", ["Go", "gRPC", "Rust", "tokio", "axum", "SOCKS5 and bound-address egress"]],
            ["Solana", ["Jito bundles", "Yellowstone gRPC", "Jupiter v6", "Kamino flash loans", "address lookup tables", "Solana Go SDK"]],
            ["Research", ["Python (standard library)", "Solana RPC", "Dune SQL"]],
          ]}
        />
      </Section>

      <Section title="What's next">
        <p>
          The method carried over to an EVM layer-2 arbitrage bot, built detection-first: it reads and measures before anything signs.
          The relay's design is written up in <Link to="/blog/jito-relay-throughput">a post on its throughput</Link>.
        </p>
      </Section>
    </CaseStudy>
  );
}
