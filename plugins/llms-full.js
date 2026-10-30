// Writes /llms-full.txt after the build: llms.txt followed by every blog post as plain
// markdown, so an AI reader can take the whole site's writing in one request.
const fs = require("fs");
const path = require("path");

module.exports = function llmsFull(context) {
  return {
    name: "llms-full",
    async postBuild({ outDir }) {
      const site = context.siteConfig.url;
      const head = fs.readFileSync(path.join(context.siteDir, "static", "llms.txt"), "utf8");
      const dir = path.join(context.siteDir, "blog");
      const posts = fs
        .readdirSync(dir)
        .filter((f) => /\.(md|mdx)$/.test(f))
        .sort()
        .reverse()
        .map((f) => {
          const raw = fs.readFileSync(path.join(dir, f), "utf8");
          const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
          const meta = Object.fromEntries(
            (fm ? fm[1] : "")
              .split("\n")
              .map((l) => l.match(/^(\w+):\s*(.*)$/))
              .filter(Boolean)
              .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")])
          );
          const body = (fm ? raw.slice(fm[0].length) : raw).replace("<!-- truncate -->", "").trim();
          const date = f.slice(0, 10);
          return `\n\n---\n\n# ${meta.title}\n\nURL: ${site}/blog/${meta.slug}\nDate: ${date}\n${meta.description ? `Summary: ${meta.description}\n` : ""}\n${body}`;
        });
      fs.writeFileSync(path.join(outDir, "llms-full.txt"), head + "\n\n# Full text of the writing" + posts.join(""));
    },
  };
};
