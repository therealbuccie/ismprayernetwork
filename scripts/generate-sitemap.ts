import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ismprayernetwork.org";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/prayer-requests", changefreq: "daily", priority: "0.9" },
  { path: "/groups", changefreq: "weekly", priority: "0.8" },
  { path: "/prayer-room", changefreq: "daily", priority: "0.8" },
  { path: "/prayer-points", changefreq: "weekly", priority: "0.8" },
  { path: "/testimonies", changefreq: "weekly", priority: "0.7" },
  { path: "/live-tv", changefreq: "daily", priority: "0.8" },
  { path: "/radio", changefreq: "weekly", priority: "0.6" },
  { path: "/bookstore", changefreq: "weekly", priority: "0.9" },
  { path: "/events", changefreq: "weekly", priority: "0.8" },
  { path: "/programs", changefreq: "weekly", priority: "0.8" },
  { path: "/partner", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/global-prayer-map", changefreq: "monthly", priority: "0.6" },
  { path: "/our-impact", changefreq: "monthly", priority: "0.6" },
  { path: "/archives", changefreq: "weekly", priority: "0.5" },
  { path: "/report", changefreq: "monthly", priority: "0.5" },
  { path: "/api-docs", changefreq: "monthly", priority: "0.3" },
];

function generateSitemap(list: SitemapEntry[]) {
  const urls = list.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
