import React from "react";
import CaseStudy, { Section, Highlights, StackGroups, LiveDemo } from "../../components/dusk/CaseStudy";
import DigestScene from "../../components/dusk/DigestScene";

const INGEST = [
  ["98", "RSS feeds"],
  ["23", "Telegram channels"],
  ["45", "X lists, ~2,000 accounts"],
  ["HN, papers", "and WSB"],
  ["Polymarket, Kalshi", "odds"],
  ["19", "funding venues"],
];

const PROVIDERS = ["OpenAI", "Anthropic", "DeepSeek", "Zhipu GLM", "Qwen", "NVIDIA NIM", "OpenRouter", "Self-hosted"];

function Architecture() {
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 1000 470" role="img" aria-label="Feeds pass through semantic dedup into SQLite; a nine-stage pipeline, a RAG chat agent and a signal reader sit on one model layer with fallbacks; reports become signals and paper trades that keep a thread back to their sources">
        <text x="10" y="22" className="d-muted">
          Ingest, 44 cron jobs
        </text>
        {INGEST.map(([fig, label], i) => {
          const y = 36 + i * 54;
          return (
            <g key={label}>
              <rect x="10" y={y} width="180" height="42" rx="8" className="d-box" />
              <text x="24" y={y + 18} className="num">
                {fig}
              </text>
              <text x="24" y={y + 34} className="d-muted">
                {label}
              </text>
              <path d={`M190 ${y + 21} C 220 ${y + 21}, 220 190, 240 190`} className="d-line" />
            </g>
          );
        })}

        <rect x="240" y="140" width="170" height="100" rx="10" className="d-box" />
        <text x="256" y="164">Semantic dedup</text>
        <text x="256" y="184" className="d-muted">
          NVIDIA embeddings
        </text>
        <text x="256" y="200" className="d-muted">
          SimHash, cosine centroids
        </text>
        <text x="256" y="216" className="d-muted">
          in-memory Float32 pools
        </text>
        <path d="M325 240 V280" className="d-flow" />
        <rect x="240" y="280" width="170" height="80" rx="10" className="d-box" />
        <text x="256" y="304">SQLite</text>
        <text x="256" y="322" className="d-muted">
          FTS5 / BM25, WAL
        </text>
        <text x="256" y="338" className="d-muted">
          75 tables, 3 databases
        </text>

        <path d="M410 320 C 440 320, 440 90, 470 90" className="d-line" />
        <path d="M410 320 H470" className="d-line" />
        <path d="M410 320 C 440 320, 440 410, 470 410" className="d-line" />

        <rect x="470" y="40" width="270" height="110" rx="12" className="d-box d-box--needle" />
        <text x="488" y="66">Nine-stage narrative</text>
        {Array.from({ length: 9 }, (_, s) => (
          <rect key={s} x={488 + s * 26} y="80" width="20" height="26" rx="5" className={s === 7 ? "d-box d-box--needle" : "d-box"} />
        ))}
        <text x="488" y="132" className="d-muted">
          Zod-typed hand-offs, jsonrepair, retry
        </text>

        <rect x="470" y="270" width="270" height="100" rx="12" className="d-box d-box--needle" />
        <text x="488" y="296">RAG chat agent</text>
        <text x="488" y="316" className="d-muted">
          6 tools, phased 3-step loop
        </text>
        <text x="488" y="334" className="d-muted">
          BM25 + 12 web sources, RRF
        </text>
        <text x="488" y="352" className="d-muted">
          query rewrite, citation check
        </text>

        <rect x="470" y="390" width="270" height="64" rx="12" className="d-box" />
        <text x="488" y="414">Signal reader</text>
        <text x="488" y="434" className="d-muted">
          5 timeframes × 13 indicators = 65 cells
        </text>

        <rect x="770" y="150" width="220" height="200" rx="12" className="d-box" />
        <text x="786" y="174">One model layer</text>
        {PROVIDERS.map((p, i) => (
          <text key={p} x={786 + (i % 2) * 104} y={198 + Math.floor(i / 2) * 18} className="d-muted">
            {p}
          </text>
        ))}
        <text x="786" y="290" className="d-muted">
          primary + fallback per task
        </text>
        <text x="786" y="308" className="d-muted">
          3-minute stream wall
        </text>
        <text x="786" y="326" className="d-muted">
          RPM pacing, daily USD budget
        </text>
        <path d="M740 95 C 760 95, 760 200, 770 200" className="d-line d-line--needle" />
        <path d="M740 320 C 755 320, 755 290, 770 290" className="d-line d-line--needle" />
        <path d="M740 422 C 760 422, 760 330, 770 330" className="d-line" />

        <rect x="770" y="380" width="220" height="74" rx="12" className="d-box d-box--needle" />
        <text x="786" y="404">Reports → signals</text>
        <text x="786" y="424" className="d-muted">
          8 paper books, 5,200+ trades
        </text>
        <text x="786" y="442" className="d-muted">
          each one traces back to a post
        </text>
      </svg>
    </div>
  );
}

const SCALE = [
  ["242k", "lines of code"],
  ["480", "commits"],
  ["29", "pages"],
  ["39", "API routes"],
  ["82", "Server Actions"],
  ["1,000+", "i18n keys"],
];

export default function LlmDigest() {
  return (
    <CaseStudy slug="llm-digest" role="Sole engineer and designer" stage={<DigestScene />}>
      <Section title="The problem">
        <p>
          Market-moving news arrives as roughly 39,000 posts a week from about 2,000 accounts on X alone, before RSS, Telegram, forums,
          prediction markets and funding rates. Reading all of it is a job. I wanted the conclusion waiting for me when I wake up, with a
          way to check any line of it.
        </p>
        <p>
          LLM-Digest is the AI system I built for that, and I run it every day. Five kinds of report are written on a schedule: hourly, a
          narrative every four hours, morning, evening and weekly. More than 4,100 so far. Trading books in it are paper only.
        </p>
        <p>
          The replay above is one real flagship run, #4844 on 13 October 2026: nine stages in 13 minutes 38 seconds, 489k tokens read and
          53.5k written, every stage done on the first try. Press <em>Stall this stage</em> to see what happens when a model goes quiet.
        </p>
      </Section>

      <Section title="How the AI is put together" figure={<Architecture />}>
        <p>
          Feeds are deduplicated by meaning before anything is stored, so the models read one copy of each story. Three readers sit on
          the store: the nine-stage narrative pipeline, a chat agent that answers questions with retrieval and citations, and a signal
          reader that turns 65 indicator cells per ticker into one call with an entry, a stop and a target.
        </p>
        <p>
          All three go through one model layer. Any OpenAI-compatible provider plugs in, each task has a primary and a fallback model,
          and API keys are encrypted with AES-256-GCM on the server and never reach the browser.
        </p>
      </Section>

      <Section title="What the AI work involved">
        <Highlights
          items={[
            {
              fig: "9",
              unit: "stages, typed",
              title: "A pipeline that hands conclusions forward",
              body: "Each stage reads its own material and passes a Zod-validated JSON conclusion to the next. Malformed output is repaired with jsonrepair and retried; stage eight sets the regime and builds the hedge basket.",
            },
            {
              fig: "3 min",
              unit: "stream wall",
              title: "Fallbacks that rerun one stage, not the run",
              body: "A byte-level watchdog notices when a stream goes quiet. After three minutes the fallback model takes that stage over and the finished stages stay as they are.",
            },
            {
              fig: "6",
              unit: "agent tools",
              title: "Retrieval that cites what it read",
              body: "The chat agent runs a phased three-step tool loop. It rewrites the question, fuses SQLite FTS5/BM25 hits with 12 web search sources by reciprocal rank fusion, and checks that every citation it gives points at something it actually retrieved.",
            },
            {
              fig: "0",
              unit: "vector databases",
              title: "Semantic dedup without a vector DB",
              body: "NVIDIA embeddings, SimHash and cosine-centroid clustering over in-memory Float32 pools. I benchmarked Qdrant and Postgres first; at this scale the in-process version was simpler and fast enough.",
            },
            {
              fig: "Any",
              unit: "OpenAI-compatible model",
              title: "A model layer that outlives the models",
              body: "Per-provider request pacing, a daily budget in dollars, per-run token and cost tracking, and a repair step that turns text into tool calls for models without native tool use. Chat switches models mid-session without a reload.",
            },
            {
              fig: "65",
              unit: "cells per ticker",
              title: "From indicators to one call",
              body: "Five timeframes by 13 indicator families. Nobody scans that by hand; the model reads all of it and states where to enter, where it is wrong and where to take profit. Every paper trade keeps a thread back to the report and the posts behind it.",
            },
          ]}
        />
      </Section>

      <Section title="Keeping it running">
        <Highlights
          items={[
            {
              fig: "374 → <10",
              unit: "SQLite stalls an hour",
              title: "A database that stopped freezing the site",
              body: "A stall watchdog, time-boxed write slices, an off-thread read worker and a WAL checkpoint thread.",
            },
            {
              fig: "44",
              unit: "cron jobs",
              title: "Deadlines on every job",
              body: "Deadline walls ended silent cron hangs that used to last hours.",
            },
            {
              fig: "2.5 min → 3 s",
              unit: "deploy downtime",
              title: "Staged builds on a self-hosted box",
              body: "systemd and a Cloudflare Tunnel, with the next build staged before the switch. An audit also found and closed two critical Server Action auth bypasses.",
            },
          ]}
        />
        <ul className="metrics metrics--wide">
          {SCALE.map(([fig, label]) => (
            <li key={label}>
              <strong>{fig}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Stack">
        <StackGroups
          groups={[
            ["AI", ["Vercel AI SDK v6", "tool calling", "RAG with RRF", "Zod schemas", "jsonrepair", "NVIDIA embeddings", "SimHash"]],
            ["App", ["Next.js 16", "React 19", "TypeScript", "Server Actions", "next-intl", "WebGL"]],
            ["Data", ["SQLite (WAL, FTS5)", "Drizzle", "croner", "WebSockets"]],
            ["Ops", ["systemd", "Cloudflare Tunnel", "AES-256-GCM key vault"]],
          ]}
        />
      </Section>

      <Section title="See it running" figure={<LiveDemo href="https://llm.kitkong.xyz" host="llm.kitkong.xyz" img="/img/live/llm-digest-flagship" alt="The LLM-Digest landing page: nine stages of the flagship narrative beside a real run's timings" />}>
        <p>The public landing page walks through the rhythm, the flagship run, the sources, funding and the model layer. The app behind it is single-operator.</p>
      </Section>

      <Section title="What's next">
        <p>Brokerage market data for US equities, and folding the WebGL landing branch back into main.</p>
      </Section>
    </CaseStudy>
  );
}
