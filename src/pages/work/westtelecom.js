import React from "react";
import CaseStudy, { Section, Highlights, StackGroups, LiveDemo } from "../../components/dusk/CaseStudy";
import { CoverageMock } from "../../components/dusk/Visuals";

function ContentFlow() {
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 300" role="img" aria-label="Editors publish in the embedded studio; a signed webhook revalidates only the affected pages, which visitors read as server components">
        <rect x="10" y="40" width="170" height="56" rx="10" className="d-box" />
        <text x="26" y="64">Staff editors</text>
        <text x="26" y="82" className="d-muted">
          no deploy needed
        </text>
        <path d="M180 68 H240" className="d-flow" />
        <rect x="240" y="30" width="220" height="76" rx="10" className="d-box" />
        <text x="256" y="56">Embedded studio</text>
        <text x="256" y="74" className="d-muted">
          nine schemas as code
        </text>
        <text x="256" y="90" className="d-muted">
          per-document translation
        </text>
        <path d="M350 106 V150" className="d-flow" />
        <rect x="240" y="150" width="220" height="56" rx="10" className="d-box" />
        <text x="256" y="174">Content lake</text>
        <text x="256" y="192" className="d-muted">
          the only datastore
        </text>
        <path d="M460 178 H540" className="d-line d-line--needle" />
        <text x="470" y="168" className="d-muted">
          signed webhook
        </text>
        <rect x="540" y="150" width="190" height="56" rx="10" className="d-box d-box--needle" />
        <text x="556" y="174">Revalidate route</text>
        <text x="556" y="192" className="d-muted">
          only the pages touched
        </text>
        <path d="M635 150 V110" className="d-line d-line--needle" />
        <rect x="540" y="40" width="190" height="70" rx="10" className="d-box" />
        <text x="556" y="64">Server components</text>
        <text x="556" y="82" className="d-muted">
          parameterised queries
        </text>
        <text x="556" y="98" className="d-muted">
          English and Chinese
        </text>
        <path d="M730 75 H790" className="d-flow" />
        <rect x="790" y="47" width="160" height="56" rx="10" className="d-box" />
        <text x="806" y="71">Visitors</text>
        <text x="806" y="89" className="d-muted">
          filter, compare, enquire
        </text>
        <path d="M635 206 V250 H790" className="d-line" />
        <rect x="790" y="230" width="160" height="44" rx="10" className="d-box" />
        <text x="806" y="257">CRM leads</text>
      </svg>
    </div>
  );
}

export default function WestTelecom() {
  return (
    <CaseStudy
      slug="westtelecom"
      role="Sole developer, client project"
      stage={
        <figure className="glass stage rise">
          <CoverageMock />
          <figcaption className="credit">WestTelecom is a fictional name. The real site was built for a client in 2024 and is shown here with their branding removed.</figcaption>
        </figure>
      }
    >
      <Section title="The brief">
        <p>
          A Canadian telecom reseller needed a bilingual site where customers browse mobile, internet, television, home-security and
          special-number plans, filter and compare them, then pay through a provider link or leave an enquiry. Retail staff, none of them
          technical, had to change plans themselves the same day.
        </p>
        <p>
          I built it in 2024 on the Next.js App Router with an embedded Sanity Studio. In 2026 I audited my own code before showing it
          publicly, and the fixes are below.
        </p>
      </Section>
      <Section title="How content moves" figure={<ContentFlow />}>
        <p>
          Every page is a server component that queries the content store directly. Filters and sorts live in the URL, so a filtered view is
          a shareable, server-rendered link. A document store fits because plans change shape all the time: a new network tier, another
          province on a coverage list. In SQL that is a steady stream of migrations.
        </p>
      </Section>
      <Section title="What the audit fixed">
        <Highlights
          items={[
            {
              fig: "3",
              unit: "secrets moved off the browser",
              title: "Credentials that shipped in the bundle",
              body: "The CMS token, the CRM token and the webhook secret all carried a public prefix. They are server-only now, and an accidental client import fails the build.",
            },
            {
              fig: "2",
              unit: "injection paths closed",
              title: "Queries built from the URL",
              body: "A job slug and a sort parameter went straight into the query string. Values are bound parameters now, and sort direction is limited to ascending or descending.",
            },
            {
              fig: "404",
              unit: "since day one",
              title: "A webhook that never existed",
              body: "The revalidation endpoint was saved under a file name the router ignores, so published content never propagated. It is a real route with signature checks now.",
            },
            {
              fig: "17",
              unit: "hidden type errors",
              title: "Type checking switched back on",
              body: "The build was set to ignore type errors. Clearing them found four with one root cause: five copies of the React types in the dependency tree.",
            },
          ]}
        />
      </Section>
      <Section title="See it running" figure={<LiveDemo href="https://westtelecom-demo.vercel.app" host="westtelecom-demo.vercel.app" img="/img/live/westtelecom-home" alt="The WestTelecom demo home page: a coral and ink brand, a phone mock-up and featured mobile plans" />}>
        <p>
          The demo needs no CMS project: the site's real GROQ queries run against an in-memory sample dataset, every login, studio and
          checkout route returns 404, and a banner says the brand is fictional. Try it in English and Chinese.
        </p>
      </Section>
      <Section title="Stack">
        <StackGroups
          groups={[
            ["App", ["Next.js App Router", "React Server Components", "TypeScript", "Tailwind", "next-intl"]],
            ["Content", ["Sanity v3 embedded studio", "GROQ", "signed webhooks", "on-demand revalidation"]],
            ["Integrations", ["HubSpot", "NextAuth", "Vercel Analytics"]],
          ]}
        />
      </Section>
    </CaseStudy>
  );
}
