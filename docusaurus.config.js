// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Kit Kong",
  tagline: "Welcoome to my blog",
  url: "https://your-docusaurus-test-site.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "nvmmonkey", // Usually your GitHub org/user name.
  projectName: "my-blog", // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
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
      navbar: {
        title: "blog.kitkong",
        logo: {
          alt: "Kitkong's Blog Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            label: "About",
            position: "left",
            to: "/docs/intro",
          },
          {
            label: "Blockchain",
            to: "/docs/blockchain/bitcoin",
            position: "left",
          },
          {
            label: "Coding",
            to: "/docs/coding/nextjs-mongoose",
            position: "left",
          },
          {
            label: "VC Deal",
            to: "/docs/vc/20230401",
            position: "left",
          },
          {
            label: "MyGPT",
            href: "https://gpt.kitkong.xyz",
            position: "right",
          },
          {
            label: "Telegram",
            href: "https://t.me/fifibam",
            position: "right",
          },
          {
            label: "GitHub",
            href: "https://github.com/nvmmonkey",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "About",
                to: "/docs/intro",
              },
              {
                label: "Blockchain",
                to: "/docs/blockchain/bitcoin",
              },
              {
                label: "Coding",
                to: "/docs/coding/nextjs-mongoose",
              },
              {
                label: "VC Deal",
                to: "/docs/vc/20230401",
              },
              {
                label: "Music",
                to: "/docs/music/read",
              },
              {
                label: "Art",
                to: "/docs/art/kongfu",
              },
              {
                label: "AI",
                to: "/docs/ai/read",
              },
              {
                label: "Mechanic",
                to: "/docs/car-mod/read",
              },
            ],
          },
          {
            title: "Links",
            items: [
              {
                label: "Github",
                href: "https://github.com/nvmmonkey",
              },
              {
                label: "Telegram",
                href: "https://t.me/fifibam",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/bamboobee5",
              },
              {
                label: "Linkedin",
                href: "https://www.linkedin.com/in/wenhui-kang-800859a4/",
              },
              {
                label: "MyGPT",
                href: "https://gpt.kitkong.xyz",
              },
            ],
          },
          {
            title: "❤️ Thank you for supporting",
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Kitkong's Blog, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
