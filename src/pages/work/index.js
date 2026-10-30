import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import WorkIndex from "../../components/dusk/WorkIndex";
import { useRise } from "../../components/dusk/motion";
import "../../components/dusk/dusk.css";

export default function Work() {
  useRise();
  return (
    <Layout title="Work" description="Case studies: LLM-Digest, KV-cache LLM serving, a Solana Jito relay, a stablecoin payment indexer and the WestTelecom catalogue.">
      <main className="dusk">
        <header className="wrap case-hero">
          <h1>Work</h1>
          <p className="case-hero__claim">
            Each write-up covers the problem, how it is built, its stack and what it measured. Two of them run live: LLM-Digest and the
            WestTelecom demo. Longer posts are under <Link to="/blog">Writing</Link>, and older notes under <Link to="/docs/intro">Notes</Link>.
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
