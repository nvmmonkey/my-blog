import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import WorkIndex from "../../components/dusk/WorkIndex";
import { useRise } from "../../components/dusk/motion";
import "../../components/dusk/dusk.css";

export default function Work() {
  useRise();
  return (
    <Layout title="Work" description="Case studies: LLM-Digest, KV-cache LLM serving, a Solana Jito relay, RootData, a stablecoin payment indexer and the WestTelecom catalogue.">
      <main className="dusk">
        <header className="wrap case-hero">
          <h1>Work</h1>
          <p className="case-hero__claim">
            Each write-up covers the problem, how it is built, its stack and what it measured. Three run live: LLM-Digest, RootData and the
            WestTelecom demo. Longer posts are on the <Link to="/blog">Blog</Link>, and my 2023–2024 research, VC and coding notes are in the <Link to="/docs/intro">Notebook</Link>.
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
