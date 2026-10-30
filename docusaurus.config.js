// @ts-check
const { themes } = require("prism-react-renderer");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Kit Kong",
  tagline: "Full-stack engineer working on market data, on-chain infrastructure and LLM pipelines",
  url: "https://blog.kitkong.xyz",
  baseUrl: "/",
  onBrokenLinks: "throw",
  markdown: {
    format: "detect",
    hooks: { onBrokenMarkdownLinks: "warn" },
  },
  favicon: "img/favicon.svg",
  organizationName: "nvmmonkey",
  projectName: "my-blog",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  stylesheets: [
    {
      href: "https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:wght@400;500;600&family=Wix+Madefor+Text:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      type: "text/css",
    },
  ],
  headTags: [
    { tagName: "link", attributes: { rel: "preconnect", href: "https://fonts.googleapis.com" } },
    { tagName: "link", attributes: { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" } },
  ],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
        },
        blog: {
          routeBasePath: "blog",
          blogTitle: "Blog",
          blogDescription: "Notes from building AI systems, trading infrastructure and data pipelines.",
          blogSidebarTitle: "All posts",
          blogSidebarCount: "ALL",
          showReadingTime: true,
          postsPerPage: 10,
          onInlineAuthors: "throw",
          onInlineTags: "ignore",
          onUntruncatedBlogPosts: "warn",
          feedOptions: { type: ["rss", "atom"], title: "Kit Kong: writing", copyright: `© ${new Date().getFullYear()} Kit Kong` },
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: "Kit Kong",
        logo: {
          alt: "Kit Kong",
          src: "img/mark.svg",
        },
        items: [
          { label: "Projects", to: "/work", position: "left" },
          { label: "About Me", to: "/about", position: "left" },
          { label: "Experience", to: "/resume", position: "left" },
          { label: "Blog", to: "/blog", position: "left" },
          { label: "GitHub", href: "https://github.com/nvmmonkey", position: "right" },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Projects",
            items: [
              { label: "LLM-Digest", to: "/work/llm-digest" },
              { label: "KV-cache LLM serving", to: "/work/kv-cache" },
              { label: "Solana MEV and Jito relay", to: "/work/solana-mev" },
              { label: "RootData", to: "/work/rootdata" },
              { label: "Payment indexer", to: "/work/paymentindexer" },
              { label: "WestTelecom", to: "/work/westtelecom" },
            ],
          },
          {
            title: "Blog",
            items: [
              { label: "All posts", to: "/blog" },
              { label: "Where I am, autumn 2026", to: "/blog/autumn-2026" },
              { label: "RSS", href: "https://blog.kitkong.xyz/blog/rss.xml" },
            ],
          },
          {
            title: "Notes, 2023–2024",
            items: [
              { label: "Blockchain", to: "/docs/blockchain/bitcoin" },
              { label: "Coding", to: "/docs/coding/nextjs-mongoose" },
              { label: "VC deals", to: "/docs/vc/20230401" },
              { label: "AI", to: "/docs/ai/read" },
            ],
          },
          {
            title: "Elsewhere",
            items: [
              { label: "GitHub", href: "https://github.com/nvmmonkey" },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/wenhui-kang-800859a4/" },
              { label: "Telegram", href: "https://t.me/fifibam" },
              { label: "Twitter", href: "https://twitter.com/bamboobee5" },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} Kit Kong`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.oneDark,
      },
    }),
};

module.exports = config;
