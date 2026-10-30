import React from "react";
import CaseStudy, { Section, Highlights } from "../../components/dusk/CaseStudy";
import { RhythmStrip } from "../../components/dusk/Visuals";

const SOURCES = [
  ["98", "RSS feeds"],
  ["23", "Telegram channels"],
  ["45", "X lists"],
  ["HN, WSB", "forums"],
  ["Polymarket, Kalshi", "prediction markets"],
  ["~20", "exchanges' funding"],
];

function Pipeline() {
  const stages = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 360" role="img" aria-label="Sources flow into SQLite, through a nine-stage pipeline with a fallback model, into a report whose numbers link back to their sources">
        {SOURCES.map(([fig, label], i) => {
          const y = 30 + i * 52;
          return (
            <g key={label}>
              <rect x="10" y={y} width="190" height="40" rx="8" className="d-box" />
              <text x="24" y={y + 18} className="num">
                {fig}
              </text>
              <text x="24" y={y + 33} className="d-muted">
                {label}
              </text>
              <path d={`M200 ${y + 20} C 240 ${y + 20}, 240 180, 270 180`} className="d-line" />
            </g>
          );
        })}
        <rect x="270" y="150" width="120" height="60" rx="10" className="d-box" />
        <text x="290" y="176">SQLite</text>
        <text x="290" y="194" className="d-muted">
          WAL, FTS5
        </text>
        <path d="M390 180 H420" className="d-flow" />
        {stages.map((s) => (
          <rect key={s} x={420 + s * 36} y="160" width="28" height="40" rx="6" className={s === 5 ? "d-box d-box--needle" : "d-box"} />
        ))}
        <text x="420" y="146" className="d-muted">
          Nine stages, typed hand-offs
        </text>
        <path d="M600 200 C 600 250, 560 260, 560 290" className="d-line d-line--needle" />
        <rect x="470" y="290" width="200" height="44" rx="8" className="d-box" />
        <text x="486" y="310">Fallback model</text>
        <text x="486" y="325" className="d-muted">
          reruns only the stalled stage
        </text>
        <path d="M744 180 H780" className="d-flow" />
        <rect x="780" y="140" width="170" height="80" rx="10" className="d-box d-box--needle" />
        <text x="796" y="166">Report</text>
        <text x="796" y="184" className="d-muted">
          regime, scenarios,
        </text>
        <text x="796" y="199" className="d-muted">
          hedge basket
        </text>
        <path d="M865 140 C 865 60, 400 40, 110 30" className="d-line d-line--needle" strokeDasharray="2 6" />
        <text x="430" y="48" className="d-muted">
          every figure links back to its post
        </text>
      </svg>
    </div>
  );
}

export default function LlmDigest() {
  return (
    <CaseStudy
      slug="llm-digest"
      role="Sole engineer and designer"
      stage={
        <figure className="glass stage rise">
          <RhythmStrip />
          <figcaption className="credit">The five report lanes across one day. Cadence is real; the exact hours are illustrative.</figcaption>
        </figure>
      }
    >
      <Section title="The problem">
        <p>
          Market-moving news arrives as roughly 39,000 posts a week from about 2,000 accounts on X alone, before RSS, Telegram, forums,
          prediction markets and funding rates. Reading all of it is a job. I wanted the conclusion waiting for me when I wake up, with a
          way to check any line of it.
        </p>
        <p>
          LLM-Digest is a single-operator app. Every hour it reads about 127 sources and writes one page: the market regime, the scenarios
          in play, a hedge basket and trade ideas. It has written more than 4,100 reports so far. Trading books in it are paper only.
        </p>
      </Section>
      <Section title="How it is built" figure={<Pipeline />}>
        <p>
          Next.js 16 and React 19 on a self-hosted machine behind a Cloudflare Tunnel, SQLite through Drizzle, scheduling with croner, and
          the Vercel AI SDK across any OpenAI-compatible provider. The interface is bilingual, English and Chinese.
        </p>
      </Section>
      <Section title="What it does well">
        <Highlights
          items={[
            {
              fig: "9",
              unit: "stages",
              title: "Every number traces back",
              body: "The flagship narrative is a nine-stage pipeline that passes typed conclusions forward. When a stage stalls, only that stage reruns, on a fallback model.",
            },
            {
              fig: "Any",
              unit: "OpenAI-compatible provider",
              title: "A model layer that outlives the models",
              body: "Providers and models switch per request. Model cards record each family and endpoint quirk, and an adapter turns text into tool calls for models without native tools.",
            },
            {
              fig: "~20",
              unit: "venues of funding",
              title: "Market plumbing in the browser",
              body: "Order-book WebSockets from about 13 exchanges run client-side, feeding a funding board of executable spreads across about 20 venues.",
            },
            {
              fig: "374 → <10",
              unit: "stalls an hour",
              title: "SQLite that stopped freezing the site",
              body: "A stall watchdog, time-boxed write slices, an off-thread read worker and a WAL checkpoint thread took database stalls from about 374 an hour to single digits.",
            },
            {
              fig: "320–1360",
              unit: "px, checked phone first",
              title: "A design system with a point of view",
              body: "One lime needle per view on a near-black ground, every figure in tabular mono, and every screen checked from 320 px up.",
            },
          ]}
        />
      </Section>
      <Section title="What's next">
        <p>Brokerage market data for US equities, and folding the WebGL landing branch back into main.</p>
      </Section>
    </CaseStudy>
  );
}
