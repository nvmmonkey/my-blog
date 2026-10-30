import React from "react";
import CaseStudy, { Section, Highlights, StackGroups, LiveDemo } from "../../components/dusk/CaseStudy";

const DATA = [
  ["22K+", "projects"],
  ["33K", "linked wallets"],
  ["6,000+", "projects scored"],
];

const OUT = [
  ["Binance Alpha", "partner"],
  ["OKX Boost", "partner"],
  ["Ethereum Foundation", "partner"],
  ["HashKey", "partner"],
  ["CoinGlass", "partner"],
  ["200+ products", "API"],
];

// The data layer: what goes in, the platform, and who reads it out, people, partners and agents.
function DataLayer() {
  const outY = (i) => 26 + i * 52;
  return (
    <div className="diagram rise">
      <svg viewBox="0 0 960 360" role="img" aria-label="Project, wallet and funding data feed RootData; people use the site, 200 partner products read it through the API, and AI agents read it through MCP servers">
        {DATA.map(([fig, label], i) => {
          const y = 70 + i * 80;
          const d = `M200 ${y + 22} C 260 ${y + 22}, 280 180, 340 180`;
          return (
            <g key={label}>
              <rect x="10" y={y} width="190" height="44" rx="8" className="d-box" />
              <text x="26" y={y + 19} className="num">
                {fig}
              </text>
              <text x="26" y={y + 35} className="d-muted">
                {label}
              </text>
              <path d={d} className="d-line" />
              <circle r="3" className="d-packet" style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 0.6}s` }} />
            </g>
          );
        })}
        <rect x="340" y="110" width="250" height="140" rx="14" className="d-box d-box--needle" />
        <text x="360" y="140">RootData</text>
        <text x="360" y="162" className="d-muted">
          428K users
        </text>
        <text x="360" y="182" className="d-muted">
          700K–1M page views a day
        </text>
        <text x="360" y="202" className="d-muted">
          charting, SEO, anti-crawling,
        </text>
        <text x="360" y="220" className="d-muted">
          CRM, wallet sign-in
        </text>
        {OUT.map(([name, kind], i) => {
          const y = outY(i);
          const d = `M590 180 C 650 180, 660 ${y + 14}, 720 ${y + 14}`;
          return (
            <g key={name}>
              <path d={d} className="d-line" />
              <circle r="3" className="d-packet" style={{ offsetPath: `path("${d}")`, animationDelay: `${0.3 + i * 0.45}s` }} />
              <rect x="720" y={y} width="230" height="28" rx="7" className="d-box" />
              <text x="734" y={y + 19}>
                {name}
              </text>
              <text x="936" y={y + 19} className="d-muted" textAnchor="end">
                {kind}
              </text>
            </g>
          );
        })}
        <path d="M465 250 V300" className="d-flow" />
        <rect x="340" y="300" width="250" height="48" rx="10" className="d-box d-box--needle" />
        <text x="360" y="322">MCP servers, ~20 tools</text>
        <text x="360" y="340" className="d-muted">
          AI agents query it directly
        </text>
      </svg>
    </div>
  );
}

export default function RootData() {
  return (
    <CaseStudy
      slug="rootdata"
      role="Co-founder: database design, product, later advisor"
      stage={
        <figure className="glass stage rise">
          <DataLayer />
        </figure>
      }
    >
      <Section title="What it is">
        <p>
          RootData is a crypto asset database: projects, funding rounds, investors, people and the wallets behind them. I
          co-founded it in September 2022 and stayed until September 2026. The database was mine from zero to one: I decided what to collect, designed how projects, rounds, investors, people and wallets connect, and gathered the first data myself. Then I built the product on top and, later, advised.
        </p>
        <p>
          It grew to 428K users, about 14 times over in one year without paid acquisition, with 700K to 1M page views a day, more than 22K
          projects and 33K linked wallets. More than 200 partner products, among them Binance Alpha, OKX Boost, the Ethereum Foundation,
          HashKey and CoinGlass, embed its data through the API.
        </p>
      </Section>

      <Section title="What I built">
        <Highlights
          items={[
            {
              fig: "2 months",
              unit: "to 2,000 DAU",
              title: "A launch that held",
              body: "At launch I ran the product and the channels around it: 1,600 registered users, 2,000 daily actives and retention above 90% within two months.",
            },
            {
              fig: "0 → 1",
              unit: "the database",
              title: "Designing the data before the product",
              body: "I chose what to collect and how it connects: projects to funding rounds, rounds to investors, people to the projects they built and the wallets they use. I gathered the first records myself, then turned the collection into a repeatable pipeline.",
            },
            {
              fig: "6",
              unit: "product areas",
              title: "The parts users touch and the parts they don't",
              body: "Data preparation and charting, SEO, anti-crawling, UI and UX, the back-office CRM and wallet integration.",
            },
            {
              fig: "~20",
              unit: "tools for agents",
              title: "Opening the data to AI agents",
              body: "Open-source MCP servers in TypeScript and Python, over stdio, SSE and Cloudflare Workers, so an agent can search projects, funding and investors as tools instead of scraping pages.",
            },
            {
              fig: "61",
              unit: "models, AUC 0.81",
              title: "Predicting listings and launches",
              body: "A Streamlit analytics app with 61 XGBoost models over 6,000+ projects, chosen from 116 automated experiments, that scores which projects are likely to list on an exchange or launch a token.",
            },
          ]}
        />
      </Section>

      <Section title="See it running" figure={<LiveDemo href="https://www.rootdata.com" host="rootdata.com" img="/img/live/rootdata-home" alt="The RootData home page: market overview cards for market cap, ETFs, tokenized assets and prediction markets" />}>
        <p>The public site as it is today. The MCP servers are on GitHub.</p>
        <p>
          <a href="https://github.com/nvmmonkey/Rootdata-MCP">Rootdata-MCP</a> (TypeScript) and{" "}
          <a href="https://github.com/nvmmonkey/Rootdata-MCP-Python">Rootdata-MCP-Python</a>.
        </p>
      </Section>

      <Section title="Stack">
        <StackGroups
          groups={[
            ["Product", ["roadmap and specs", "SEO", "growth channels", "partner integrations"]],
            ["AI", ["Model Context Protocol", "TypeScript", "Python", "Cloudflare Workers", "SSE"]],
            ["Data", ["XGBoost", "Streamlit", "the RootData API"]],
          ]}
        />
      </Section>
    </CaseStudy>
  );
}
