import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import solid from "@astrojs/solid-js";

export default defineConfig({
  site: "https://millipede-academy.pages.dev",
  integrations: [mdx(), solid()],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
