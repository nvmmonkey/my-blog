import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import WorkIndex from "../../components/dusk/WorkIndex";
import { useRise } from "../../components/dusk/motion";
import "../../components/dusk/dusk.css";

export default function Work() {
  useRise();
  return (
    <Layout title="Work" description="Case studies: LLM-Digest, Solana MEV research, a stablecoin payment indexer and the WestTelecom catalogue.">
      <main className="dusk">
        <header className="wrap case-hero">
          <h1>Work</h1>
          <p className="case-hero__claim">
            Each write-up covers the problem, one diagram of how it is built and what it measured. Older notes on blockchain, code and venture
            deals are under <Link to="/docs/intro">Notes</Link>.
          </p>
        </header>
        <section className="band band--flush">
          <div className="wrap">
            <WorkIndex />
          </div>
        </section>
      </main>
    </Layout>
  );
}
