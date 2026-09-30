import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const LANGUAGES = ["ru", "zh"];

/**
 * SEO tags that need the site's absolute address.
 * SITE_URL from .env (template: .env.example; a real environment variable overrides it),
 * e.g. https://chess.example.com:
 * - replaces %SITE_URL% in index.html
 * - keeps the canonical/og:url/hreflang block (removed when SITE_URL is unset)
 * - adds a Sitemap line to robots.txt and emits sitemap.xml
 */
function seo(siteUrl) {
  return {
    name: "seo",
    transformIndexHtml(html) {
      const withBlock = siteUrl
        ? html.replace(/\s*<!-- SITE_URL:(START|END)[^>]*-->/g, "")
        : html.replace(/\s*<!-- SITE_URL:START[\s\S]*?<!-- SITE_URL:END -->/, "");
      return withBlock.replaceAll("%SITE_URL%", siteUrl);
    },
    generateBundle() {
      const robots = ["User-agent: *", "Allow: /"];
      if (siteUrl) {
        robots.push("", `Sitemap: ${siteUrl}/sitemap.xml`);
        const alternates = [
          `<xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/"/>`,
          ...LANGUAGES.map((lang) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${siteUrl}/?lang=${lang}"/>`),
          `<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/"/>`,
        ].join("\n    ");
        const urls = [`${siteUrl}/`, ...LANGUAGES.map((lang) => `${siteUrl}/?lang=${lang}`)]
          .map((loc) => `  <url>\n    <loc>${loc.replace(/&/g, "&amp;")}</loc>\n    ${alternates}\n  </url>`)
          .join("\n");
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
        });
      }
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots.join("\n") + "\n" });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Reads .env, .env.local, .env.[mode] (keys listed in .env.example) plus process environment
  // variables, which take precedence. Empty prefix: config-only, nothing is exposed to client code.
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.SITE_URL || "").replace(/\/+$/, "");
  // Public path the app is served from, e.g. "/chess-evaluate/" for a GitHub Pages project site
  const base = env.BASE_PATH || "/";

  return {
    base,
    plugins: [react(), tailwindcss(), seo(siteUrl)],
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3000,
      },
    },
  };
});
