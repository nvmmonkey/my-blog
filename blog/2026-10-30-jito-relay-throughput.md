---
slug: jito-relay-throughput
title: Designing a bundle relay for 30,000 requests a second
description: How a Go relay that turns JSON-RPC bundles into gRPC across eight Jito regions lost its throughput to shared state, and how one limiter, a ready-queue and an in-flight cap got it back.
authors: [kit]
tags: [solana, go, rust, systems, mev]
---

In 2025 I wrote a relay that sits between Solana searcher bots and Jito's block engines. This post is about the part that broke under load: deciding, thousands of times a second, which egress address may send to which region right now.

<!-- truncate -->

## What the relay does

Bots already speak the block engine's HTTP JSON-RPC, and I didn't want to touch them. So the relay accepts the same `sendBundle` calls, decodes the transactions, builds the bundle as gRPC and sends it to one of eight Jito block-engine regions. The bot points at the relay instead of the block engine and nothing else changes.

Region choice is a port number. One port rotates across every region; each pinned port names a single region. Behind that, each region has its own pool of gRPC connections, and each connection leaves through its own egress address, either a SOCKS5 dialer or a socket bound to a local IP. There are 4,000+ egress addresses in the pool, so load spreads across them instead of piling onto a few.

The workload I designed for was 30,000 to 60,000 requests a second across all regions, fire-and-forget with retries. The relay answers the bot straight away and does the sending in the background. That choice comes back later.

## Rate limits are per address and per region

Every block engine region enforces its own limit per source address, and when you exceed it the error tells you how long to back off, something like "Retry after 30000ms". So the unit of state is the pair (egress address, region). Each pair gets a token bucket, and a Retry-After from the block engine puts that pair into cooldown for exactly as long as it asked.

In the Go code this lived in a `ProxyRegionState` with `SetCooldown`, `IsAvailable`, and an active lock per pair so two sends couldn't share a slot. A `ProxySelector` walked the address list and asked `IsAvailable` until it found one free, and `ConnectionPool` handed out a healthy client for that region.

That design was correct for one request at a time. It fell over at the rates it was built for.

## Why throughput collapsed

Three things went wrong at once.

**Limiter state drifted apart.** The token buckets, the cooldown map and the active locks were separate structures, updated at different points in the request path. Under load they disagreed: a pair could be out of cooldown in one place and still marked busy in another.

**Proxies were locked too early.** A request claimed an address before it was ready to use it, so the address sat reserved while the request did other work. With enough concurrent requests, most of the pool was "taken" by work that wasn't sending.

**Check-then-act.** `IsAvailable` and the lock that followed were two steps. Two goroutines could both see the same pair as free, both proceed, and one would trip the rate limit and get a cooldown it didn't need to earn.

The visible symptom was time spent waiting for a proxy: 13 to 28 ms per request, which is a long time when the whole point is landing a bundle in the current slot.

## One limiter, one ready-queue

The fix was to stop asking "is this one free?" across thousands of addresses and instead keep them sorted by when each one is next allowed to send. Per region, a min-heap is keyed by that time. Taking the head, checking it, and booking its next slot all happen in one step on one shared limiter, so there's no gap for a second goroutine to slip through. A Retry-After pushes that pair's time forward and the heap reorders it.

Here's a simplified sketch of the idea. It isn't the production code; a mutex keeps it short.

```go
// Sketch only. One ready-queue per region, ordered by the earliest
// time each egress address may send to that region again.
type slot struct {
	egress string
	next   time.Time
	index  int
}

type readyQueue []*slot

func (q readyQueue) Len() int           { return len(q) }
func (q readyQueue) Less(i, j int) bool { return q[i].next.Before(q[j].next) }
func (q readyQueue) Swap(i, j int) {
	q[i], q[j] = q[j], q[i]
	q[i].index, q[j].index = i, j
}
func (q *readyQueue) Push(x any) { s := x.(*slot); s.index = len(*q); *q = append(*q, s) }
func (q *readyQueue) Pop() any {
	old := *q
	s := old[len(old)-1]
	*q = old[:len(old)-1]
	return s
}

type regionLimiter struct {
	mu       sync.Mutex
	q        readyQueue
	byEgress map[string]*slot
	interval time.Duration // one token per interval per (egress, region)
}

// Acquire picks and books in one step: no check-then-act gap.
func (l *regionLimiter) Acquire(now time.Time) (egress string, wait time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	head := l.q[0]
	if d := head.next.Sub(now); d > 0 {
		return "", d // nothing is ready; the caller knows exactly how long to wait
	}
	head.next = now.Add(l.interval)
	heap.Fix(&l.q, 0)
	return head.egress, 0
}

// Cooldown honours a Retry-After from the block engine.
func (l *regionLimiter) Cooldown(egress string, retryAfter time.Duration, now time.Time) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if s := l.byEgress[egress]; s != nil && now.Add(retryAfter).After(s.next) {
		s.next = now.Add(retryAfter)
		heap.Fix(&l.q, s.index)
	}
}
```

Acquire is O(log n) rather than a scan, and when nothing is ready it returns the exact wait instead of spinning. With the limiter, cooldowns and locks folded into one structure there was nothing left to drift apart. Proxy wait fell from 13 to 28 ms to under 0.5 ms.

## The other failure: memory

Fire-and-forget means the HTTP handler returns immediately and spawns a goroutine to do the send. With no ceiling on those goroutines, the relay's behaviour when every address is cooling down is ugly. At 10,000 requests a second, with every proxy in a 30-second cooldown, each request's goroutine waits out the cooldown, so you have about 300,000 goroutines alive, each holding a request body and its retry state.

This wasn't hypothetical. The production version climbed toward 75 GB of memory under high load when no client was available. When I reviewed it against a proposed rewrite, the rewrite was slower on the hot path but had the one thing production lacked: a cap on requests in flight. I kept production's fast path and added the cap. Separately, an earlier version had leaked goroutines from a gRPC connection observer that opened new connections without cleaning up the old observer goroutines; that one reached 497,000+ goroutines before I found it.

The cap changes what a burst means. Without it, a burst becomes memory. With it, a burst becomes backpressure: once the cap is reached the relay rejects new work quickly, and the bot can decide what to do, instead of the process quietly filling RAM until the kernel decides for you.

## The Rust port

Later I ported the relay to Rust on tokio and axum. The interesting part wasn't the language. The three ideas that fixed the Go version carried over as they were: one source of truth for rate-limit state, a queue ordered by when each (address, region) is next allowed to send, and a hard cap on work in flight. Getting those right mattered far more than the runtime they ran on.

More on the surrounding research is in the [Solana MEV case study](/work/solana-mev).

## What I'd do differently

I'd build the load test before the relay. Every bug here was invisible at low rates and obvious at the target rate, and I found them in production logs instead of on a bench. A synthetic block engine that returns Retry-After on a schedule, plus a client that can push 30,000 requests a second, would have shown the drifting state, the early locks and the goroutine pile-up in an afternoon. I'd also put the in-flight cap in the first version rather than adding it after a memory graph went vertical.
