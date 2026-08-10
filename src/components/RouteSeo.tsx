import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://ismprayernetwork.org";
const BRAND = "ISM Ministers' Prayer Network";

type Meta = { title: string; description: string; noindex?: boolean };

export const routeMeta: Record<string, Meta> = {
  "/": {
    title: `${BRAND} — Global Prayer Community for Ministers`,
    description:
      "A global prayer network for pastors, ministers and evangelists: join prayer groups, submit prayer requests, watch live services and access ministry resources.",
  },
  "/about": {
    title: `About Us | ${BRAND}`,
    description:
      "Learn about ISM Ministers' Prayer Network — our mission to unite ministers across nations in consistent, Spirit-led intercession and ministry growth.",
  },
  "/prayer-requests": {
    title: `Submit a Prayer Request | ${BRAND}`,
    description:
      "Send your prayer request and stand in agreement with thousands of ministers praying daily for families, churches and nations around the world.",
  },
  "/groups": {
    title: `Prayer Groups | ${BRAND}`,
    description:
      "Join a live prayer group of ministers, pray together by video, and grow in fellowship with intercessors from over 195 nations.",
  },
  "/prayer-room": {
    title: `ISM Prayer Room — Pray Live Anytime | ${BRAND}`,
    description:
      "Enter the ISM Prayer Room for live, round-the-clock prayer with ministers worldwide. Scheduled slots, timers and live intercession sessions.",
  },
  "/prayer-points": {
    title: `Weekly Prayer Points & Bulletin | ${BRAND}`,
    description:
      "Read this week's prayer points, confession, affirmation and song of the week prepared for ministers of the ISM Prayer Network.",
  },
  "/testimonies": {
    title: `Testimonies | ${BRAND}`,
    description:
      "Read and share testimonies of answered prayer from ministers and partners across the ISM Ministers' Prayer Network community.",
  },
  "/live-tv": {
    title: `Live TV — Watch ISM Services Online | ${BRAND}`,
    description:
      "Watch ISM Prayer Network live services, broadcasts and ministry programmes streaming online for ministers and partners worldwide.",
  },
  "/radio": {
    title: `Online Radio | ${BRAND}`,
    description:
      "Listen to ISM Prayer Network online radio for continuous worship, teaching and prayer wherever you are ministering.",
  },
  "/bookstore": {
    title: `Bookstore — Books for Ministers | ${BRAND}`,
    description:
      "Browse and buy books, combo packs and digital resources written to strengthen pastors, ministers and evangelists in ministry.",
  },
  "/events": {
    title: `Events | ${BRAND}`,
    description:
      "See upcoming ISM Prayer Network events, conferences and gatherings for ministers, with dates, details and registration links.",
  },
  "/programs": {
    title: `Programs | ${BRAND}`,
    description:
      "Explore ISM Prayer Network programmes, master classes and ministry schools designed to equip ministers for effective service.",
  },
  "/partner": {
    title: `Partner With Us | ${BRAND}`,
    description:
      "Partner with ISM Ministers' Prayer Network and help sustain global intercession, ministry training and outreach to nations.",
  },
  "/contact": {
    title: `Contact Us | ${BRAND}`,
    description:
      "Get in touch with the ISM Ministers' Prayer Network team for prayer support, partnership enquiries or technical assistance.",
  },
  "/global-prayer-map": {
    title: `Global Prayer Map | ${BRAND}`,
    description:
      "Explore the global prayer map showing ministers interceding across 195+ nations within the ISM Prayer Network.",
  },
  "/our-impact": {
    title: `Our Impact | ${BRAND}`,
    description:
      "Discover the measurable impact of the ISM Ministers' Prayer Network: nations reached, prayers answered and ministers equipped.",
  },
  "/archives": {
    title: `Archives — Prayer Points & Announcements | ${BRAND}`,
    description:
      "Search past prayer points and ministry announcements archived by the ISM Ministers' Prayer Network.",
  },
  "/report": {
    title: `Submit a Ministry Report | ${BRAND}`,
    description:
      "Ministers can submit prayer and church reports, including attendance and supporting documents, to the ISM Prayer Network team.",
  },
  "/api-docs": {
    title: `API Documentation | ${BRAND}`,
    description:
      "Technical documentation for the ISM Prayer Network partner API, covering endpoints, authentication and data access.",
  },
};

const NOINDEX_PREFIXES = [
  "/auth",
  "/admin",
  "/dashboard",
  "/prayer-dashboard",
  "/api/",
  "/my-library",
  "/unsubscribe",
  "/api-key-doc",
];

export default function RouteSeo() {
  const { pathname } = useLocation();
  const path = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const noindex = NOINDEX_PREFIXES.some((p) => path.startsWith(p));
  const meta =
    routeMeta[path] ?? {
      title: `${BRAND} — Global Prayer Community for Ministers`,
      description:
        "A global prayer network for pastors, ministers and evangelists: prayer groups, live services, prayer requests and ministry resources.",
    };
  const url = `${SITE}${path}`;

  const schema = pageSchema(path, url);

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
    </Helmet>
  );
}

function pageSchema(path: string, url: string) {
  if (path === "/bookstore") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "ISM Bookstore",
      url,
      about: "Books, combo packs and digital resources for ministers",
      isPartOf: { "@type": "WebSite", name: BRAND, url: SITE },
    };
  }
  if (path === "/events" || path === "/programs") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: path === "/events" ? "ISM Events" : "ISM Programs",
      url,
      about:
        path === "/events"
          ? "Upcoming conferences and gatherings for ministers"
          : "Ministry programmes, master classes and schools for ministers",
      isPartOf: { "@type": "WebSite", name: BRAND, url: SITE },
    };
  }
  if (path === "/contact") {
    return {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact ISM Ministers' Prayer Network",
      url,
      isPartOf: { "@type": "WebSite", name: BRAND, url: SITE },
    };
  }
  return null;
}

