import React from "react";
import CodeBlock from "@theme/CodeBlock";
import CaseStudy, { Section, Highlights, StackGroups } from "../../components/dusk/CaseStudy";
import PolyScene from "../../components/dusk/PolyScene";

const SBE = `// Simplified from binance-sbe/src/sbe_decoder.rs. Every field sits at a fixed offset,
// so a quote is a few byte reads, not a JSON parse.
fn le_i64(b: &[u8], o: usize) -> i64 { i64::from_le_bytes(b[o..o + 8].try_into().unwrap()) }
fn dec(m: i64, e: i8) -> Decimal { Decimal::new(m, (-e) as u32) } // price = m * 10^e

pub fn decode_sbe_frame(buf: &[u8]) -> SbeDecodeResult {
    let template_id = u16::from_le_bytes([buf[2], buf[3]]); // 8-byte header
    match template_id {
        10001 => {
            // BestBidAsk: a fixed 50-byte root block
            let r = &buf[8..];
            let (pe, qe) = (r[16] as i8, r[17] as i8); // shared price and qty exponents
            let bid = dec(le_i64(r, 18), pe);
            let ask = dec(le_i64(r, 34), pe);
            SbeDecodeResult::BestBidAsk(BestBidAsk {
                event_time_us: le_i64(r, 0),
                bid_price: bid,
                ask_price: ask,
                bid_qty: dec(le_i64(r, 26), qe),
                ask_qty: dec(le_i64(r, 42), qe),
                mid_price: (bid + ask) / Decimal::TWO,
            })
        }
        10002 => decode_depth_snapshot(buf, u16::from_le_bytes([buf[0], buf[1]]) as usize),
        other => SbeDecodeResult::UnknownTemplate(other),
    }
}`;

const FEEDS = [
  ["Binance SBE, direct", "the bot's clock", "µs timestamps, depth every 50 ms"],
  ["Polymarket's Binance relay (RTDS)", "~795 ms behind", "median staleness measured from Dublin"],
  ["Chainlink BTC/USD, which settles the market", "~1.65 s behind", "per-market median over 397 markets, p95 ~2.47 s"],
];

const GATES = [
  ["entry_edge_c", "0.15", "the book is at least 15¢ from fair"],
  ["obi_align_min", "0.95", "Binance order-book imbalance agrees with the trade"],
  ["ttx", "5–258 s", "time left in the 5-minute window"],
  ["|trend| over 20 s", "≤ 20 bps", "not chasing a run"],
  ["|d2|", "≤ 3", "fair value still has information in it"],
  ["RTDS deviation", "≥ 1 bp", "the market's own feed already leans the same way; fails closed if older than 2 s"],
  ["WOFI", "≤ 0.2", "weighted order-flow imbalance on Polymarket's book"],
  ["k_max_naked", "1", "at most one unhedged leg at a time"],
];

export default function Polymarket() {
  return (
    <CaseStudy slug="polymarket" role="Main author, 720 of 894 commits" stage={<PolyScene />}>
      <Section title="The market">
        <p>
          Polymarket lists a new BTC Up or Down market every 5 and every 15 minutes. The strike is the price when the window opens; YES
          pays $1 if BTC ends at or above it, NO pays $1 if it ends below. A YES and a NO together always pay exactly $1. Settlement uses a
          Chainlink BTC/USD price.
        </p>
        <p>
          That makes each market a short-dated binary option, and the book that prices it reacts to BTC through Polymarket's own relay of
          Binance. The bot's job is to see BTC first, know what the option is worth, and act only when the book is clearly wrong.
        </p>
        <p className="disclaimer">
          The replay above is a simulation in the bot's rules and log format; its prices and fills are invented. Figures marked backtest
          or out-of-sample come from the research harness, and no figure on this page is a live return.
        </p>
      </Section>

      <Section title="Seeing BTC first: Binance SBE" figure={<CodeBlock language="rust">{SBE}</CodeBlock>}>
        <p>
          Simple Binary Encoding is Binance's binary market-data format: a fixed 8-byte header (block length, template id, schema id,
          version), then a root block whose every field sits at a known offset. I wrote the decoder for the two streams the bot needs,
          best bid/ask (template 10001) and the top-20 depth snapshot (10002). Prices come back as a mantissa and an exponent and stay
          exact decimals, with no floats; the depth decoder reads the block length from the header so new schema fields don't break it.
        </p>
        <p>
          A schema audit on 18 July 2026 confirmed the decoder byte for byte. Depth arrives every 50 ms instead of the JSON stream's 100
          ms, and it feeds the order-book imbalance gate; without it the gates starve.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Feed</th>
              <th>Lag behind SBE</th>
              <th>Measured as</th>
            </tr>
          </thead>
          <tbody>
            {FEEDS.map((r) => (
              <tr key={r[0]}>
                {r.map((c) => (
                  <td key={c}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          The bot runs in Dublin: a three-region probe put Polymarket's REST round trip at 26 ms p50 there, against 51 ms from Switzerland
          and 57 ms from Iceland. A full order submit is slower, about 310 ms median, which is why the edge has to be large.
        </p>
      </Section>

      <Section title="Why it wins: the mechanism">
        <p>
          On every SBE tick the strategy prices YES as a binary option: <code>d2 = (ln(S/K) − σ²T/2) / (σ√T)</code> and{" "}
          <code>fair YES = N(d2)</code>, clamped to 0.03–0.97, with σ the realised volatility of SBE log-returns over the last 300 seconds
          and T the time left. It compares that with the mid of Polymarket's book: <code>gap = yes_mid − fair</code>. If YES is 15¢ or more
          too cheap it buys YES; if too dear, it buys NO. Every gate below must pass at once.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Gate</th>
              <th>5-minute value</th>
              <th>What it guards</th>
            </tr>
          </thead>
          <tbody>
            {GATES.map((r) => (
              <tr key={r[0]}>
                <td>
                  <code>{r[0]}</code>
                </td>
                <td className="num">{r[1]}</td>
                <td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          The bot never sells. It exits by buying the other side, so the position becomes a YES + NO pair that settles for exactly $1; the
          trade made money if the pair, with fees, cost less. Exits fire in order: a hard stop near the end of the window, an early exit
          when Binance's imbalance flips and holds for 3 seconds, a stop-loss when the gap reverses past 2¢, and a take-profit when the
          gap closes. Entries are taker orders; maker entries and exits were tested and reverted. The taker fee is{" "}
          <code>0.070 · p · (1 − p)</code> per share, a coefficient I corrected from the documented 0.072 by auditing fills on chain.
        </p>
        <Highlights
          items={[
            {
              fig: "3–4 bps",
              unit: "lead at a strike cross",
              title: "Flip",
              body: "When BTC crosses the strike on the direct feed, the flip strategy sends fill-and-kill taker orders on the new winner while its ask is under 40¢, only in the last 5 minutes, before the relay catches up.",
            },
            {
              fig: "$0.999",
              unit: "settlement queue",
              title: "Tail",
              body: "Mint YES and NO with an on-chain CTF split, sell the losing side into the bid once the gap, bid and time gates agree, redeem the winner at settlement, and after expiry queue $0.999 bids to be first in line. If the loser can't be sold, merge the pair back to USDC.",
            },
            {
              fig: "3 layers",
              unit: "circuit breakers",
              title: "Risk and recovery",
              body: "Strategy, portfolio and infrastructure breakers; per-market and daily caps; state checkpointed every second; claims through the gasless relayer with a fallback to Polygon through the Safe.",
            },
          ]}
        />
      </Section>

      <Section title="Data, backtests and machine learning">
        <p>
          The research corpus is 17,549 five-minute markets from 23 February to 26 May 2026, ticks sampled about every 12 ms and stored as
          Parquet at roughly 34× compression. The backtester was built in three tiers: a line-by-line port of the Python simulator
          (matched on 36,188 identical legs), a harness that drives the production Rust strategy over the ticks, and a frozen "honest"
          harness with a 500 ms fill lag, ask repricing and 2¢ of slip per leg, which reproduced 43 live markets with zero mismatches.
        </p>
        <p>
          Sweeps ran up to 100,800 configurations on the 15-minute markets and 88,200 on the 5-minute ones, each with a held-out period and
          a robustness filter. Research ran as an agent loop with pre-registered rules for changing a setting, and a second agent
          recomputed every verdict; the last phase closed with zero verdicts flipped. Four LightGBM gate models were trained walk-forward
          and shadowed for a week before promotion; the 15-minute tail model reached 0.967 AUC out of sample.
        </p>
        <Highlights
          items={[
            {
              fig: "+114% vs −20%",
              unit: "same rule, three fill models [backtest]",
              title: "The fill model matters more than the strategy",
              body: "An early Sharpe of 36 turned out to be zero slippage, and a 'GTD win' was fills booked before the order could have arrived. Production should expect 50 to 70% of simulated returns.",
            },
            {
              fig: "16.9%",
              unit: "of markets, 151 of 895 [live count]",
              title: "Find losses in the wallet",
              body: "An on-chain census of four weeks of markets showed unhedged legs were the largest loss bucket. The simulator reproduces 17.4%.",
            },
            {
              fig: "1.6–4.7×",
              unit: "fee overstatement",
              title: "Audit the fee model on chain",
              body: "A three-way audit found the executor booking buy fees up to 4.7 times too high, plus 2 to 7% phantom fee-shares.",
            },
            {
              fig: "95.7%",
              unit: "out-of-sample recovery",
              title: "The USDT basis",
              body: "The live bot bought YES about 98% of the time because Binance prices BTC in USDT while settlement uses USD. Anchoring to the strike recovered 95.7% against 85.1% for Chainlink-tick anchors, and an adversarial audit flipped none of the verdicts.",
            },
            {
              fig: "99.8%",
              unit: "precision that lost money",
              title: "Label leakage",
              body: "A gate model that was almost always right still lost money until the label was made revenue-aware. A slip-predicting gate (0.711 AUC out of sample) beat the hand-written gate in simulation, then blocked 99% of live entries under covariate shift and went back to shadow.",
            },
            {
              fig: "17–38×",
              unit: "volatility underestimate",
              title: "Duplicate ticks",
              body: "99.67% of consecutive 12 ms samples were stale duplicates, which biased realised volatility low until they were removed.",
            },
          ]}
        />
      </Section>

      <Section title="Running it">
        <p>
          A single tokio loop owns all state; strategy actions go to a dedicated execution task over a channel, with a pool of 12
          authenticated connections and reconciliation every 30 seconds. Watchdogs came from real failures: a relay connection that went
          silent for 68 minutes, a market WebSocket that sat dead for 9.6 hours, file descriptors exhausted at 1,024, and an imbalance feed
          pinned at +0.96. The SBE connection reconnects every day before Binance's 24-hour limit. I also ported Polymarket's ERC-7739
          deposit-wallet signing to Rust, the first Rust implementation, verified live on 4 June 2026.
        </p>
      </Section>

      <Section title="Stack">
        <StackGroups
          groups={[
            ["Trading", ["Rust", "tokio", "rust_decimal", "Binance SBE", "WebSockets", "Polymarket CLOB"]],
            ["On chain", ["Polygon", "Gnosis Safe", "CTF split and merge", "gasless relayer", "ERC-7739"]],
            ["Research", ["Python", "Parquet", "LightGBM", "scikit-learn", "agent research loops"]],
          ]}
        />
      </Section>
    </CaseStudy>
  );
}
