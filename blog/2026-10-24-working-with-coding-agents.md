---
slug: working-with-coding-agents
title: How I work with coding agents
description: Concrete practices for using coding agents on large codebases, covering context, recall, verification, cross-model review and keeping evidence.
authors: [kit]
tags: [ai, tooling, llm]
---

Most of my code in 2026 was written with coding agents, mainly Claude Code. These are the practices that held up on large codebases, and the problems that made me adopt them.

<!-- truncate -->

## Keep the context in files, not in the chat

Long sessions lose context, and a model's built-in memory can store wrong facts. Early on I pasted whole chat histories into new sessions. That does not scale.

Now every repo has an instructions file at its root, and every conclusion goes into a Markdown file in the repo or in my notes. A new session starts by reading those files, not by relying on anything the model remembers. This also makes the model replaceable: any agent that can read Markdown can continue the work.

Secrets never go into the context. I redact logs before pasting them, and I keep keys and connection strings out of prompts.

## Look back at what you keep correcting

In October I reviewed my own history: 124 notes from Claude Code sessions, plus a keyword count over 3,609 of my prompts. The counts are keyword hits, so they show scale, not exact frequency. The same few problems kept coming back:

1. **Commands run the wrong way.** My backtests have to run pinned to certain CPU cores and log to a file. The agent forgot this often enough that I mentioned it in 32 prompts across 10 sessions. Running too much in parallel and running out of memory came up in 27 prompts across 11 sessions.
2. **Changes nobody asked for.** Extra columns, deleted rows, hard-coded rules, changed CLI flags that broke old commands.
3. **One fix breaks something else.** A new column that broke a downstream script.
4. **"Done" when it is not done.** A feature reported as "fully integrated" that still used hard-coded defaults. A commit with failing tests. A fix pushed to the wrong branch.
5. **Numbers that are too good.** Backtests that assumed every order filled, or used future data. Coverage figures that added up to more than 100%.
6. **Conclusion first, evidence second.** An audit that looked at the parts that did not matter.
7. **Process overhead.** I had pasted the same coordinator prompt more than ten times, and around 40 prompts were about compaction and handing off between sessions.

I already knew the rules. They were in notes, instruction files and prompts. The agent still forgot them, and I kept repeating myself.

## Turn repeated corrections into checks

A rule that only exists in a prompt will eventually be forgotten. A check the agent cannot get around will not. This is what I am adding, starting with the trading repo:

- **A verify script per repo.** Release build that prints the commit hash, then tests, then a replay on a frozen day of data compared with saved results, then invariant assertions. A hook stops the agent from reporting "done" until the script has run and passed.
- **A wrapper for long jobs.** One script adds the CPU pinning, runs jobs one at a time and appends output to a dated log. A hook blocks backtest commands that do not go through it.
- **Schema tests.** Column names and order are fixed, and new columns can only be appended.
- **Invariants as assertions.** Coverage cannot exceed 100%. Measured ROI cannot exceed the gross margin. An entry cannot happen before its signal.

## Verify against reality, not against another opinion

The checks I trust most compare the code with reality:

- **Replay parity.** The Rust replay and the Python simulator have to agree before I believe any number either one produces.
- **Old and new side by side.** I log both versions in parallel and compare them, instead of replacing the old one and hoping.
- **Simulate before sending.** For on-chain work, every transaction is simulated with `eth_call` first, and new strategies run in shadow mode before they place real orders.
- **Pre-registration.** For research, the agent writes the plan and the pass/fail criteria to a file before seeing any results, including when to stop early. That lets it report "this did not work" instead of adjusting things until something passes.
- **Screenshots from the agent.** For UI work, the agent renders and checks its own screenshots.

## Let models critique each other, but do not stop there

I keep the coder and the auditor separate, and I use different models for each. For big questions I ask at least three models and spend most of my time on where they disagree.

Review has limits, though. Several rounds of multi-agent audits once missed a gating bug that a replay would have caught. Audits do not replace replay and reconciliation.

## Small diffs, committed first

When an agent rewrites a whole file, it can quietly change logic I did not ask it to touch: a parser, a swap direction, a source IP in a proxy config. So I commit before every change, ask for a diff or the specific lines to change, and read `git diff` before running anything.

For repetitive config, such as long IP lists, I have the agent write a generator script instead of the config itself. Before I adopted that rule, I had asked for those files by hand about 70 times.

## Keep the evidence

Every claim an agent makes should point to something: a `file:line`, a commit or a transaction hash. When an agent expands a text, I ask it to list separately any number that is not in my material. In one essay draft, an assistant added six statistics that appeared in none of the cited sources. I caught them only by asking where each sentence came from.

## What stays manual

Anything that touches live orders, funds or keys gets my own review and is never merged automatically. For everything else, the agent has to prove its work. An agent I cannot verify needs constant supervision, and running more of them only burns more tokens.
