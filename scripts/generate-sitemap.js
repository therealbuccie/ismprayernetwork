import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = "https://ismprayernetwork.org";

const entries = [
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
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

const today = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq || "weekly"}</changefreq>
    <priority>${e.priority || "0.5"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outPath = resolve(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`sitemap.xml written (${entries.length} entries)`);
