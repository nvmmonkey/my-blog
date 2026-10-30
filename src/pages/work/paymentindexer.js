import React from "react";
import CaseStudy, { Section, Highlights } from "../../components/dusk/CaseStudy";
import { LedgerThumb } from "../../components/dusk/Visuals";

function Flow() {
  const chains = ["Ethereum", "Base", "Optimism", "Arbitrum", "Polygon", "Solana", "more chains"];
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 360" role="img" aria-label="Chain adapters feed raw data into a decode step and an address registry; only attributed flows reach the unified table, which is reconciled against a public benchmark">
        {chains.map((c, i) => {
          const y = 20 + i * 46;
          return (
            <g key={c}>
              <rect x="10" y={y} width="150" height="34" rx="8" className="d-box" />
              <text x="26" y={y + 22}>
                {c}
              </text>
              <path d={`M160 ${y + 17} C 200 ${y + 17}, 200 180, 230 180`} className="d-line" />
            </g>
          );
        })}
        <rect x="230" y="140" width="170" height="80" rx="10" className="d-box" />
        <text x="246" y="166">Raw, chain-native</text>
        <text x="246" y="184" className="d-muted">
          never forced into
        </text>
        <text x="246" y="199" className="d-muted">
          one shape
        </text>
        <path d="M400 180 H450" className="d-flow" />
        <rect x="450" y="120" width="190" height="120" rx="10" className="d-box d-box--needle" />
        <text x="466" y="146">Decode and attribute</text>
        <text x="466" y="168" className="d-muted">
          selector and topic first
        </text>
        <text x="466" y="186" className="d-muted">
          heuristics only as a
        </text>
        <text x="466" y="201" className="d-muted">
          labelled fallback
        </text>
        <text x="466" y="224" className="d-muted">
          key: network + address
        </text>
        <rect x="450" y="270" width="190" height="56" rx="10" className="d-box" />
        <text x="466" y="294">Address registry</text>
        <text x="466" y="312" className="d-muted">
          every entry has evidence
        </text>
        <path d="M545 270 V240" className="d-line d-line--needle" />
        <path d="M640 180 H690" className="d-flow" />
        <rect x="690" y="140" width="120" height="80" rx="10" className="d-box" />
        <text x="706" y="166">Flows</text>
        <text x="706" y="184" className="d-muted">
          attributed only
        </text>
        <path d="M810 180 H840" className="d-line" />
        <rect x="840" y="130" width="110" height="100" rx="10" className="d-box" />
        <text x="854" y="156">Reconcile</text>
        <text x="854" y="174" className="d-muted">
          against a public
        </text>
        <text x="854" y="189" className="d-muted">
          benchmark, never
        </text>
        <text x="854" y="204" className="d-muted">
          used as input
        </text>
      </svg>
    </div>
  );
}

export default function PaymentIndexer() {
  return (
    <CaseStudy
      slug="paymentindexer"
      role="Sole engineer"
      stage={
        <figure className="glass stage rise">
          <LedgerThumb />
          <figcaption className="credit">Private repository. Shown as an outline only; no issuer data is reproduced here.</figcaption>
        </figure>
      }
    >
      <Section title="The problem">
        <p>
          Crypto debit cards settle in stablecoins across many chains, and the public dashboards that report their volume do not publish
          how they count it. I wanted the same numbers rebuilt from my own index of chain data, broken down by issuer, card program, chain
          and asset, with a trail behind every figure that anyone could check.
        </p>
      </Section>
      <Section title="How it is built" figure={<Flow />}>
        <p>
          TypeScript, with chain adapters for EVM networks and Solana. Raw data lands in ClickHouse in its native shape; a Postgres control
          plane holds the registry. Only flows that have been attributed by decoding a call or an event enter the unified table, and the
          public benchmark is a reconciliation target, never an input.
        </p>
      </Section>
      <Section title="Where it stands">
        <Highlights
          items={[
            {
              fig: "22 of 24",
              unit: "card programs",
              title: "Issuance paths traced",
              body: "Twenty-two card programs have their on-chain path registered. The other two were checked and confirmed to settle off chain.",
            },
            {
              fig: "±0.6%",
              unit: "on five EVM mainnets",
              title: "Reconciled, not estimated",
              body: "Volumes on Ethereum, Base, Optimism, Arbitrum and Polygon land within 0.6% of the public benchmark.",
            },
            {
              fig: "413",
              unit: "addresses, 164 evidence rows",
              title: "A registry that shows its work",
              body: "Every attributed address keeps the evidence that put it there, across 778 deployments.",
            },
            {
              fig: "262",
              unit: "tests passing",
              title: "Commits that argue with themselves",
              body: "Investigations are written up one document each, and more than one commit message records a measurement that refuted my own earlier claim.",
            },
          ]}
        />
      </Section>
      <Section title="What's next">
        <p>A second ledger on a top-up basis, reconciled issuer by issuer.</p>
      </Section>
    </CaseStudy>
  );
}
