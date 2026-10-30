---
slug: kv-cache-capstone
title: Smaller KV cache, faster first token
description: What our graduate capstone learned about putting a KV-cache layer under a learning-to-rank vLLM scheduler on one RTX 3090.
authors: [kit]
tags: [ai, llm, ml-systems, python]
---

For our graduate capstone this summer, a team of four built a latency stack on vLLM serving Llama-3.1-8B on a single RTX 3090. My part was the KV-cache layer underneath the scheduler. This post covers what that layer did and why it moved first-token latency more than anything else we tried.

<!-- truncate -->

## The setup

The starting point was a learning-to-rank (LTR) scheduler from Fu et al. (NeurIPS 2024). A small OPT-125M model predicts how long each request's answer will be, and the scheduler serves short jobs first. That approximates shortest-job-first and avoids the head-of-line blocking you get with first-come-first-served.

The paper ran on vLLM 0.4.1 and a 40 GB A100. We reproduced it on a 24 GB RTX 3090 and got a 1.66× mean and 3.6× P99 improvement over FCFS. The gain depended on swap-based preemption, which matters for the rest of this post.

The question for my layer was this: once LTR has ordered the queue, can KV-cache techniques cut latency further without losing accuracy, and under which loads? I worked on two levers, KV quantization and attention sparsity. Everything around that layer was a team effort across the four of us. We tested on three engines (vLLM 0.4.1 with the LTR fork, 0.8.5 V0 and 0.25 V1), using LMSYS-Chat-1M prompts with Poisson arrivals.

Full details are in the [case study](/work/kv-cache).

## Why KV capacity drives TTFT under load

This is the core mechanism.

When a model generates text, every layer keeps the keys and values (K and V) for every token so far, so it doesn't recompute them for each new token. That is the KV cache. Its size is roughly layers × KV heads × head dimension × tokens × bytes per value. It grows with every token of every active request. On a 24 GB card, after the 8B model's weights, the KV cache takes most of what's left, and it fills up fast.

vLLM manages the cache in fixed-size blocks, like pages in virtual memory (PagedAttention). A request can only run while it holds blocks for its tokens. When the pool runs out, the scheduler has two options for making room:

- **Swap**: copy a running request's blocks to CPU memory and copy them back later. That's what vLLM 0.4.1 does.
- **Recompute**: drop the blocks and rebuild them later by running that request's prefill again. That's what the V1 engine does.

Either way, preemption is pure overhead. The GPU spends time moving or rebuilding state it already had.

Now look at it from a new request's side. Time to first token (TTFT) is not mostly compute. Under load, it's mostly waiting: the request sits in the queue until there are free blocks for its prompt. The pool is full, running requests get preempted to make room, preempted requests come back and need blocks again, and the queue drains slowly.

So under load, TTFT is mainly set by how many tokens fit in the cache. If you double the number of tokens that fit, more requests run at once, fewer get preempted, and new arrivals get blocks sooner. The model doesn't need to get any faster.

## Lever one: 4-bit KV with TurboQuant

TurboQuant rotates the K and V vectors before quantizing them. That spreads outliers across dimensions, so 4 bits per value loses very little. On our checks, GSM8K accuracy was 0.83 with 4-bit KV against 0.80 with bf16, so we saw no accuracy cost on that benchmark.

At equal memory, 4-bit KV held 2.83× as many tokens. At 64 requests per second:

- mean TTFT went from 10.7 s to 1.6 s, a 6.8× cut;
- preemptions went from 171 to 40.

That is the mechanism above, measured: more capacity, far fewer preemptions, much shorter queues.

It isn't free. The extra dequantization work in each decode step raises time per output token (TPOT). In the configuration we wrote up, end-to-end latency was 37.5% worse. So 4-bit KV is the right call when first-token latency is what users feel, as in chat, and the wrong call for long batch generations.

## Lever two: block-sparse attention with BLASST

The second lever goes after that decode cost. BLASST uses the running maximum from online softmax to skip KV blocks whose attention weights will be negligible. A skipped block is never read from memory, which is what matters in a memory-bound decode step.

I wrote Triton decode kernels for this. Standalone, they ran 1.33–1.75× faster, and output stayed lossless at 42% sparsity.

Integration was harder than the kernel. On vLLM's shared GQA decode kernel, BLASST was a net loss: TPOT got 4.9% worse. Of the 42.1% of blocks that could be skipped, only 18.5% actually were. In a GQA kernel, one KV block is loaded once for a whole group of query heads. As I read it, a block can only be skipped when every head in the group agrees it doesn't matter, and that rarely happens.

The per-head TurboQuant decode path doesn't have that constraint. I runtime-patched vLLM's TurboQuant decode path to use the sparse kernel. There it cut TPOT by 22% and P99 by 47%. That recovers much of the decode cost that 4-bit KV adds.

## What we concluded

Our honest summary was that the results are real but depend on load. Quantized KV is a TTFT tool: it pays off once the cache is under pressure and preemption starts. Sparse attention is a decode tool, and whether it helps depends on how the kernel maps heads to KV blocks. A kernel can be fast on its own and still lose inside a real engine.

## What I'd do differently

**Prove the baseline runs before building on it.** An audit showed that the V1, Triton and FlashAttention paths we planned to target had never actually run. Every service had fallen back to xformers. Running the real baseline end to end should have been the first milestone.

**Record metadata from the server, not the client.** Our version tag was read from the client's environment, which reported 0.24 while the server ran 0.25. Twelve result summaries were mislabeled before we caught it.

**Test the reproduce steps in a clean environment.** Hard-coded absolute paths in some scripts broke the README's reproduce command. A clean run before publishing would have caught them.

**Scope early.** The proposal planned three levers under a Rust control plane. We shipped two. Head-wise KV offloading, the Rust coordinator and speculative decoding are still future work, along with a rerun on an A100 in its own memory-pressure regime.
