---
slug: polymarket-backtest-lessons
title: What a live trading system taught me about backtests
description: Lessons on fills, fees, data sources, infrastructure and overfitting from building and running a Rust trading system on Polymarket's 15-minute BTC markets.
authors: [kit]
tags: [trading, polymarket, rust, research]
---

In 2026 I spent most of my time on a Rust trading system for Polymarket's 15-minute BTC up/down markets. I spent more of that time on the backtester than on the live bot, and this post is about what the backtester got wrong.

<!-- truncate -->

## What the system was

Each market asks one question: will BTC be higher or lower at the end of a 15-minute window? The system had the usual parts:

- a Binance market-data feed using SBE (Simple Binary Encoding), Binance's binary format
- Black-Scholes signals that turn spot price and volatility into a fair value for each side
- execution, a risk engine and reconciliation against what actually filled
- gasless claims for settled positions

I wrote about 80% of it, 720 of 894 commits. A four-week on-chain census covered 895 of the live markets it traded.

Some of the work was plain infrastructure. I ported ERC-7739 signing for deposit wallets to Rust, the first Rust implementation of it. I benchmarked latency from three regions and picked Dublin, at 26 ms p50. After feeds went quiet in production (a relay silent for 68 minutes, a market WebSocket dead for 9.6 hours) I added watchdogs, so a feed that goes quiet stops the bot instead of letting it trade on old prices.

I mention the outages because a backtest never has them. The replayed feed never stalls. If your live system can trade on stale data and your backtest cannot, they are not running the same strategy.

## Lesson 1: the fill model matters more than the strategy

My first backtests assumed every order filled. That turns almost any strategy into a money printer. Once I modelled queue position and used realistic maker/taker ratios, the results looked much closer to the real thing.

With the same strategy logic, the fill model alone could flip a backtest from losing to winning. No strategy parameter moved results that much, so the fill model is now the first thing I make conservative.

A quieter version of the same problem is sampling. My backtest data was sampled about every 12 ms, while the live bot reacted to every 1 ms tick. Parameters tuned on the sampled data did not always carry over.

## Lesson 2: fees and labels come from the chain, not from your assumptions

On-chain audits found that my fee model was off by 1.6 to 4.7 times. The chain records what was actually charged; my model was only my reading of how fees should work. Until I checked, every result that depended on fees was wrong by an unknown amount.

Labels have the same problem. The backtest must settle each market with the same data source the market itself uses for settlement. At one point I labelled outcomes with a different source, and weeks of results became useless at once. A related problem: computing fair value from one price source when the market settles on another gives a small, steady bias. That bias can make the strategy enter trades it should skip.

## Lesson 3: one data pipeline, one config

I eventually built a live-parity backtester and ran it over about 17.5k markets. Live parity means that the backtester and the production bot read the same data pipeline and the same configuration. Before I trust a change, the replay has to match the live bot's legs one by one.

Before that, the gaps between simulation and production were each small: how volatility was sampled, a cached fee value, a slippage rejection, which price feed was used. But there were many of them. An outside review once found at least three strategy configs that disagreed with each other. At that point the simulator I was tuning was probably not the bot that was trading.

Two habits came out of this: read the production code before changing a formula in the simulator, and check the commit hash of the deployed binary before comparing logs.

## Lesson 4: find losses in the wallet, not in the backtest

When live and backtest results disagree, I go to the wallet's on-chain history. Wallet forensics showed that 16.9% of markets (151 of 895) ended with an unhedged leg, meaning only one side of a pair filled, and that these legs were the biggest source of losses. The backtest assumed pairs completed, so it could not show this.

## Lesson 5: big sweeps need a fixed bar

At one point I ran parameter sweeps over 100,800 configurations. With that many tries, some configuration always looks great by chance. A few rules kept me honest:

- Write down what counts as good enough before tuning: drawdown, longest losing streak, out-of-sample win rate, worst single day. When a version meets the bar, stop tuning it.
- Split data into training and test periods, and use the test period once. If you tune on the test results, the test period has become training data.
- Use walk-forward validation, so each test period comes after the data it was fitted on.
- When a result looks too good, look for future data leaking in before you celebrate. In one model, 97% of entries happened when the model's output was pinned at its upper or lower limit. That points to luck or a bug, not an edge.
- Add one realistic change at a time. When I merged a batch of reviewer suggestions in one go, most metrics got worse and I could not tell which change caused it.

There is also a point where the parameters are exhausted. When seven families and more than 30 variants all failed to beat the current config, I stopped looking for a better parameter and started working on monitoring and risk limits.

## Lesson 6: let agents run the loop, and pre-register it

Later I let coding agents run research loops: propose a filter, run it, write down the result. One loop trained walk-forward gradient-boosted gate models; the 15-minute tail model reached 0.967 AUC out of sample and then spent a week in shadow before promotion. Another taught me about leakage: a gate that was right 99.8% of the time still lost money until the label was made revenue-aware.

What made the agent loop useful was not the model. It was writing the plan and the pass/fail criteria in a file before looking at any results, with rules for stopping early. With that in place, an agent can say "this idea failed" and stop. Without it, the agent keeps adjusting things until something passes.

## What I would tell myself in January

Make the fill model conservative and check fees against the chain. Settle with the market's own data source. Run one pipeline and one config. Before tuning anything, write down the bar and when you will stop. And when live and backtest disagree, trust the wallet.
