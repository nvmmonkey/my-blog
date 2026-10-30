---
slug: measure-before-you-build
title: Measure before you build
description: What public chain data said about Solana arbitrage before I wrote another bot, and how the same detection-first method shaped an arbitrage bot on an EVM layer-2.
authors: [kit]
tags: [solana, evm, mev, research]
---

The expensive mistake in on-chain arbitrage is building a fast bot for a market you haven't measured. This post is about measuring first, on Solana and then on Robinhood Chain, and what the numbers changed.

<!-- truncate -->

## The question on Solana

I had already spent a lot of 2025 on Solana transport: relays, regions, egress. Before writing yet another bot on top of that, I wanted three answers. Where does arbitrage revenue actually land? Who takes it? What does it cost them to land a trade?

All of that is public. Every successful arbitrage leaves a transaction whose balance changes you can decode, and every bot that wins leaves a trail of them. So instead of guessing, I measured.

## What the market looked like

These figures describe other wallets' activity, measured from public Solana data on 20 and 21 October 2026. They aren't my volume and they aren't my returns.

- The top 25 circular-arbitrage wallets together took about $87k a day, and the first of them alone took 39% of that.
- 86% of sampled gross was two-hop flow through meme-coin pools.
- The plain strategy everyone starts with, SOL against USDC between two AMMs, had a median gross of $0.003 per trade.
- Bots that sent only bundles spent 9% of revenue on costs. Bots that also sprayed transactions outside bundles spent 38%.

The third line changed the plan before any code was written. A strategy that clears a third of a cent per trade before costs isn't a latency problem. No relay makes it worth running. The money was concentrated in a few wallets and in a kind of flow I hadn't been targeting at all.

## Taking the winners apart

Aggregate numbers tell you where the money is, not how anyone gets it. So I took apart five of the bots that win, and kept the evidence attached to each claim. Every statement in those write-ups is tagged observed, inferred or unknown, with the file and line, RPC result or transaction behind it. One standard-library Python command recomputes every table offline, so anyone can check the numbers without my infrastructure.

The decoders had to be exact, not close. 124 recorded Jupiter v6 instructions decode with zero trailing bytes, and a port of one closed executor's public ABI round-trips through encode and decode. If a decoder leaves bytes over, it has misread something, and every number built on it is suspect.

## Carrying the method to an EVM layer-2

In 2026 I took the same approach to Robinhood Chain, an Arbitrum Nitro layer-2 with roughly 100 ms blocks, first-come-first-served ordering and no public mempool. No mempool means no sandwiching and no bidding for position. What's left is atomic arbitrage and backrunning, and the race is decided by who reaches the sequencer first.

I built the bot detection-first: it reads and measures before anything signs.

**Find cycles.** Pool prices go into a token graph with log-weighted edges, and Bellman-Ford finds the negative cycles, which are the loops that return more than they started with.

**Quote exactly.** A cycle that looks profitable on mid-prices often isn't once you walk real liquidity. I wrote Uniswap V3 and V4 tick math that crosses ticks the way the pools do, and used the chain's deployed QuoterV2 contract as the oracle. Seven cases, up to 23 ticks crossed, matched it byte for byte, and replays of real V3 and V4 swaps came out exact.

**Measure who wins.** A one-hour census of other bots' arbitrage on the chain counted 4,690 arbitrage transactions from 114 executor contracts. The top ten took 89% of what was kept, the top three 50%. Of 1,247 pools that someone arbitraged, my universe tracked 162. That gap, not my code speed, told me where the work was.

**Execute on-chain.** I wrote Solidity flash executors and deployed them to mainnet, so a route either completes atomically with a profit or reverts.

## When the code was fast and still lost

The send path started at 672 ms. Most of that was mine: decrypting the keystore on every fire took 322 ms on its own, plus several RPC reads and a cold TLS connection. Keeping the signer warm, caching what didn't change and tracking nonces locally cut sign-and-send to 12 ms.

It still didn't win. From a host far from the sequencer, the bot landed none of 22 attempts.

The latency budget explained why. Measured from Vancouver, the feed arrived about 60 ms late, compute took 0.1 ms and submission another 33 ms, roughly 93 ms end to end. The sequencer itself was a 66 ms round trip away; a host in its own data-center region would be around 0.5 to 1 ms. Then I checked how long opportunities live. Over 26 hours of verification I found 63 distinct real events. All of them appeared in some block N, and 61 were gone by block N+1. With blocks about 100 ms apart, the opportunity closes before a distant bot's transaction arrives.

That isolated the limit. The code was no longer the bottleneck; distance was. Making the Python faster or finishing the Rust port wouldn't have changed the result. Only moving next to the sequencer would.

## Refusing to guess

One more rule came out of this. Some venues charge a fee that changes. A fee that moves but can be read is a refresh problem; I watched one venue's fee move from 54 to 60 parts per million, and that's fine as long as you read it. When a venue's fee turned out to be dynamic and unbounded, though, there was no number I could quote with confidence. The router stopped routing that pool instead of guessing. A route priced on a guessed fee is a revert that costs gas, and a bot that guesses quietly turns into one that loses quietly.

Case-study details are on [the Solana MEV page](/work/solana-mev).

## What I'd do differently

I'd write the latency budget on day one, before the executor. Feed delay, compute, submit and round trip to the sequencer are four numbers I could have measured in an hour, and together with how long opportunities live they decide whether a strategy is possible from where you sit. I measured the market first on both chains, which saved me from the obvious bad strategies. I measured my own position in that market later than I should have.
