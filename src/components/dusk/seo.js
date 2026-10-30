import React from "react";
import Head from "@docusaurus/Head";

// Structured data for search engines and AI answer engines (schema.org JSON-LD), the same
// shapes a Next.js app would put in generateMetadata and a <script type="application/ld+json">.

export const SITE = "https://blog.kitkong.xyz";

export const PERSON = {
  "@type": "Person",
  "@id": `${SITE}/#person`,
  name: "Wenhui (Kit) Kang",
  alternateName: ["Kit Kong", "Kit Kang", "Wenhui Kang"],
  url: `${SITE}/about`,
  image: `${SITE}/img/og-card.jpg`,
  email: "mailto:kitstation@163.com",
  jobTitle: "AI systems and full-stack engineer",
  description:
    "Engineer in the Vancouver area building AI systems, low-latency trading infrastructure and data products; co-founder of RootData; open to AI, full-stack and data engineering roles.",
  address: { "@type": "PostalAddress", addressLocality: "Burnaby", addressRegion: "BC", addressCountry: "CA" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Fairleigh Dickinson University, Vancouver" },
    { "@type": "CollegeOrUniversity", name: "Simon Fraser University, Beedie School of Business" },
  ],
  knowsLanguage: ["en", "zh", "yue"],
  knowsAbout: [
    "LLM pipelines",
    "Retrieval-augmented generation",
    "LLM serving and KV cache",
    "vLLM",
    "Triton",
    "Rust",
    "Go",
    "TypeScript",
    "Next.js",
    "Python",
    "Solana MEV",
    "Jito",
    "Polymarket",
    "Market microstructure",
    "Data engineering",
    "Kubernetes",
    "Homelab infrastructure",
  ],
  sameAs: ["https://github.com/nvmmonkey", "https://www.linkedin.com/in/wenhui-kang-800859a4/", "https://llm.kitkong.xyz"],
};

export function JsonLd({ data }) {
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", ...data })}</script>
    </Head>
  );
}

// og:image and twitter:image for one page, as absolute URLs
export function SocialImage({ src }) {
  const url = src.startsWith("http") ? src : `${SITE}${src}`;
  return (
    <Head>
      <meta property="og:image" content={url} />
      <meta name="twitter:image" content={url} />
    </Head>
  );
}
