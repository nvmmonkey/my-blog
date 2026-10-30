---
slug: nine-stages-one-conclusion
title: Nine stages, one conclusion
description: How LLM-Digest turns 127 sources into one flagship market report every four hours, and what keeps a nine-stage LLM pipeline from stalling.
authors: [kit]
tags: [ai, llm, rag, systems, typescript]
---

LLM-Digest is the app I run for myself to read the market so I don't have to. This post walks through how its flagship report gets written: nine LLM stages, typed hand-offs, and the boring machinery that keeps it running.

<!-- truncate -->

## What it writes

[LLM-Digest](/work/llm-digest) writes five report types on a schedule: an hourly on the hour, a narrative every four hours, a morning and an evening report each day, and a weekly on Sunday. It has written over 4,100 of them so far.

The input is 127 sources: 98 RSS feeds, 23 Telegram channels, Hacker News and the daily papers. On top of that come 45 X lists plus the following feed, about 2,000 accounts and 39k posts a week, along with WSB chatter, prediction-market odds, and funding rates from 19 venues.

The flagship is the four-hour narrative. Its job is to end with a conclusion: a market regime, the scenarios for each theme, and a hedge basket.

## A real run

Here is run #4844 from 13 October 2026, as shown on the landing page:

| # | Stage | Output | Time |
|---|---|---|---|
| 01 | Global news | Themes and key events | 1m 5s |
| 02 | Global macro | Regime, hedge pairs, geo risk | 43s |
| 03 | Finance news | Finance themes, trade ideas | 45s |
| 04 | Tech news | AI, chips, software | 1m 1s |
| 05 | Prediction markets | Fair odds vs. the market | 2m 29s |
| 06 | Equities | Single names, WSB plays | 1m 1s |
| 07 | Tech and crypto | Crypto themes | 1m 14s |
| 08 | Final narrative | Regime, hedge basket | 1m 4s |
| 09 | Funding arb | Top three carries | 36s |

The whole run took 13m 38s. It read 489k tokens and wrote 53.5k on claude-opus-5-5. The verdict was MIXED with three hedge pairs, and all nine stages passed on the first try with no fallback.

Not every run goes that cleanly, and most of the design is about the runs that don't.

## Why nine stages and not one prompt

Each stage reads only its own material: the news stages read news, the prediction-market stage reads odds, the equities stage reads single names and WSB chatter. Stage eight reads the earlier stages' conclusions, not their raw inputs, and sets the regime and hedge basket. Stage nine picks the funding carries.

This keeps each context focused, and it gives me a place to check things. Every stage returns JSON validated against a Zod schema. If the output doesn't parse, it goes through `jsonrepair`. If it still fails the schema, the stage retries. The next stage only ever sees a typed object.

The main thing this buys is that a failure stays contained. If stage five stalls, only stage five reruns. Stages one to four are already done and persisted.

## Stalls are the real enemy

LLM calls usually don't fail. They stall: a stream opens, sends some tokens, and then goes quiet. A plain request timeout either fires too early on a long, healthy generation or waits far too long on a dead one.

So the watchdog works at the byte level. Each report has a primary model and a fallback. If the stream sends no bytes for three minutes, the fallback takes over that stage and keeps writing. Both models are chosen per task, not globally.

Above the stages there are deadline walls on the jobs themselves. Before I added them, a cron job could hang silently for hours and block everything queued behind it. The scheduler runs 44 cron jobs now, and every one of them has a ceiling.

All providers sit behind one client: OpenAI, Anthropic, DeepSeek, GLM, Qwen, NVIDIA NIM, OpenRouter, or anything OpenAI-compatible. That client handles per-provider RPM pacing, daily USD budgets, tool-call repair for models that emit malformed tool calls, and token and cost tracking for every run. API keys are encrypted with AES-256-GCM on the server and never sent to the browser.

## Deduplication before generation

A breaking story arrives many times from many sources. If the model sees every copy, it overweights the story. Before anything reaches a stage, items are deduplicated semantically. SimHash catches near-identical text, NVIDIA embeddings catch paraphrases, and cosine-centroid clustering groups items into stories.

The vectors live in in-memory Float32 pools rather than a vector database. I benchmarked Qdrant and Postgres first. At this scale, with one operator, a flat in-memory scan was simpler and fast enough, and it removed a service to run.

## The chat side: retrieval with RRF

The app also has a chat that answers questions over everything it has stored. It's a tool-calling RAG agent on Vercel AI SDK v6 with six tools and a phased loop capped at three steps. It rewrites the query first, searches, and validates citations before answering, so it can't cite something it never retrieved.

Search fuses two very different kinds of evidence: SQLite FTS5 with BM25 over the local archive, and 12 web search sources. Their scores can't be compared: a BM25 score and a web API's relevance value are on unrelated scales. So I throw the scores away and fuse by rank, using reciprocal rank fusion.

Here is a minimal sketch of the idea (not the production code):

```ts
type Hit = { url: string; title: string; snippet: string };
type Fused = Hit & { score: number; sources: number };

const normalize = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "");

// Each list is already ordered best-first by its own retriever.
export function reciprocalRankFusion(lists: Hit[][], k = 60, limit = 20): Fused[] {
  const fused = new Map<string, Fused>();

  for (const list of lists) {
    const seen = new Set<string>();
    list.forEach((hit, rank) => {
      const key = normalize(hit.url);
      if (seen.has(key)) return; // count each document once per list
      seen.add(key);

      const entry = fused.get(key) ?? { ...hit, score: 0, sources: 0 };
      entry.score += 1 / (k + rank + 1); // rank is 0-based
      entry.sources += 1;
      fused.set(key, entry);
    });
  }

  return [...fused.values()]
    .sort((a, b) => b.score - a.score || b.sources - a.sources)
    .slice(0, limit);
}
```

The constant `k` controls how flat the curve is. With k = 60, first place in one list scores 1/61 and tenth place scores 1/70. A document that shows up in several lists at moderate ranks beats one that a single retriever ranked first. For news, agreement across sources is usually the signal you want.

## The unglamorous half

The codebase is about 242k lines across 480 commits: 29 pages, 39 API routes, 82 Server Actions, and 75 SQLite tables across three WAL databases. Two operational fixes mattered more than any prompt.

**SQLite stalls.** At one point I measured about 374 stalls an hour, enough to freeze the site. The fix had four parts: a stall watchdog, time-boxed write slices so no single writer holds the lock for long, an off-thread read worker, and a dedicated WAL checkpoint thread. Stalls dropped to single digits an hour.

**Deploys.** A naive rebuild took the site down for about 2.5 minutes. Building into a staging directory and swapping it in cut that to about 3 seconds.

## Where the conclusion goes

The report isn't the end of the chain. Each ticker gets a reading on 5 timeframes by 13 indicator families, 65 cells, and the model reduces that to an entry, a stop and a target. Signals open positions in 8 paper books, which have taken over 5,200 paper trades. Every trade keeps a link back through the signal and the report to the original posts, so I can check whether a bad trade came from bad reasoning or bad input.

## What I'd do differently

I'd build the stall watchdog and deadline walls on day one. I added them after losing hours to hangs, and they changed more about reliability than any model swap. I'd also make the stage schemas the first thing I design. Once every hand-off was a typed object, retries, fallbacks and partial reruns became simple. Before that, every failure was a special case.
