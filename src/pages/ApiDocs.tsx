import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { Code2, BookOpen, FolderOpen, Users, ShoppingCart, Copy, Check, ChevronDown, ChevronRight, Lock } from "lucide-react";

const BASE_URL = "https://ryitxoymayasdlabojsx.supabase.co/functions/v1/partner-api";

interface EndpointProps {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  exampleRequest: string;
  exampleResponse: string;
}

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border/50 bg-muted/50">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      <pre className="p-4 overflow-x-auto text-xs md:text-sm leading-relaxed">
        <code className="text-foreground/90">{code}</code>
      </pre>
    </div>
  );
};

const MethodBadge = ({ method }: { method: "GET" | "POST" }) => (
  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
    method === "GET"
      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
      : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
  }`}>
    {method}
  </span>
);

const EndpointCard = ({ method, path, description, params, body, exampleRequest, exampleResponse }: EndpointProps) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-muted/30 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-foreground">{path}</code>
        <span className="text-sm text-muted-foreground ml-auto hidden sm:inline">{description}</span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-border/50 p-4 md:p-5 space-y-5"
        >
          <p className="text-sm text-muted-foreground sm:hidden">{description}</p>

          {params && params.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Query Parameters</h4>
              <div className="space-y-2">
                {params.map((p) => (
                  <div key={p.name} className="flex items-start gap-2 text-sm">
                    <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{p.name}</code>
                    <span className="text-muted-foreground text-xs">({p.type})</span>
                    {p.required && <span className="text-xs text-destructive">required</span>}
                    <span className="text-muted-foreground text-xs">— {p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {body && body.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Request Body (JSON)</h4>
              <div className="space-y-2">
                {body.map((b) => (
                  <div key={b.name} className="flex items-start gap-2 text-sm">
                    <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{b.name}</code>
                    <span className="text-muted-foreground text-xs">({b.type})</span>
                    {b.required && <span className="text-xs text-destructive">required</span>}
                    <span className="text-muted-foreground text-xs">— {b.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Example Request</h4>
            <CodeBlock code={exampleRequest} />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Example Response</h4>
            <CodeBlock code={exampleResponse} language="json" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const endpoints: EndpointProps[] = [
  {
    method: "GET",
    path: "/books",
    description: "List all available books",
    params: [
      { name: "search", type: "string", required: false, description: "Search by title or author" },
      { name: "category_id", type: "uuid", required: false, description: "Filter by category ID" },
      { name: "format", type: "string", required: false, description: "Filter by format: 'digital' or 'physical'" },
      { name: "featured", type: "boolean", required: false, description: "Set to 'true' to show featured books only" },
      { name: "limit", type: "number", required: false, description: "Max results (default 50, max 100)" },
      { name: "offset", type: "number", required: false, description: "Pagination offset (default 0)" },
    ],
    exampleRequest: `curl -X GET "${BASE_URL}/books?limit=3&featured=true" \\
  -H "x-api-key: YOUR_API_KEY"`,
    exampleResponse: `{
  "books": [
    {
      "id": "d5cc8d4a-88fd-4ea8-a735-1b4756484c7e",
      "title": "Prophecy",
      "subtitle": "Understanding The Power That Controls Your Future",
      "author": "Pastor Chris Oyakhilome",
      "price": 10,
      "is_digital": true,
      "is_physical": false,
      "cover_image_url": "https://ryitxoymayasdlabojsx.supabase.co/storage/v1/object/public/book-covers/1772200289603.jpg",
      "featured": true,
      "stock": 100,
      "category_id": "37f46bd0-d4bf-47b5-bbd1-6fadf4444776"
    }
  ],
  "count": 1
}`,
  },
  {
    method: "GET",
    path: "/books/:id",
    description: "Get full details of a single book",
    params: [],
    exampleRequest: `curl -X GET "${BASE_URL}/books/d5cc8d4a-88fd-4ea8-a735-1b4756484c7e" \\
  -H "x-api-key: YOUR_API_KEY"`,
    exampleResponse: `{
  "id": "d5cc8d4a-88fd-4ea8-a735-1b4756484c7e",
  "title": "Prophecy",
  "subtitle": "Understanding The Power That Controls Your Future",
  "author": "Pastor Chris Oyakhilome",
  "description": "God's people are a people of prophecy...",
  "short_description": "\\"And it shall come to pass in the last days...\\\" Acts 2:17 (NKJV).",
  "price": 10,
  "pages": null,
  "isbn": null,
  "is_digital": true,
  "is_physical": false,
  "stock": 100,
  "cover_image_url": "https://ryitxoymayasdlabojsx.supabase.co/storage/v1/object/public/book-covers/1772200289603.jpg",
  "category_id": "37f46bd0-d4bf-47b5-bbd1-6fadf4444776"
}`,
  },
  {
    method: "GET",
    path: "/categories",
    description: "List all book categories",
    exampleRequest: `curl -X GET "${BASE_URL}/categories" \\
  -H "x-api-key: YOUR_API_KEY"`,
    exampleResponse: `{
  "categories": [
    { "id": "37f46bd0-d4bf-47b5-bbd1-6fadf4444776", "name": "Prayer & Devotion" },
    { "id": "4db82a35-4e72-4fdc-87c0-5a854aa60eab", "name": "Ministry" },
    { "id": "1d216302-72ac-40d3-b541-07b437994d21", "name": "Leadership" }
  ]
}`,
  },
  {
    method: "POST",
    path: "/prayer-groups",
    description: "Create a public prayer group",
    body: [
      { name: "name", type: "string", required: true, description: "Name of the prayer group" },
      { name: "description", type: "string", required: false, description: "Group description" },
    ],
    exampleRequest: `curl -X POST "${BASE_URL}/prayer-groups" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Morning Glory Fellowship",
    "description": "A daily morning prayer group"
  }'`,
    exampleResponse: `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Morning Glory Fellowship",
  "description": "A daily morning prayer group",
  "is_public": true,
  "member_count": 1,
  "created_at": "2026-03-03T10:00:00Z"
}`,
  },
  {
    method: "POST",
    path: "/orders",
    description: "Place a book purchase order",
    body: [
      { name: "items", type: "array", required: true, description: "Array of { book_id, quantity, format, title, price }" },
      { name: "external_user_id", type: "string", required: true, description: "Your platform's user identifier" },
      { name: "external_user_name", type: "string", required: false, description: "User's display name" },
      { name: "total_amount", type: "number", required: false, description: "Total order amount" },
      { name: "payment_method", type: "string", required: false, description: "Payment method used" },
      { name: "espees_code", type: "string", required: false, description: "Espees payment code if applicable" },
    ],
    exampleRequest: `curl -X POST "${BASE_URL}/orders" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "external_user_id": "user-789",
    "external_user_name": "John Doe",
    "total_amount": 20,
    "items": [
      {
        "book_id": "d5cc8d4a-88fd-4ea8-a735-1b4756484c7e",
        "title": "Prophecy",
        "quantity": 2,
        "format": "digital",
        "price": 10
      }
    ]
  }'`,
    exampleResponse: `{
  "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "status": "pending",
  "total_amount": 20,
  "items": [...],
  "created_at": "2026-03-03T10:00:00Z"
}`,
  },
];

const ApiDocs = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 hero-gradient overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-5 text-sm text-primary-foreground/80">
            <Code2 className="w-4 h-4 text-accent" />
            Partner API Documentation
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Integrate With <span className="gold-gradient">ISM Prayer Network</span>
          </h1>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">
            Access our bookstore, create prayer groups, and place orders — all through a simple REST API.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live API — Production Ready
          </div>
        </motion.div>
      </div>
    </section>

    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
      {/* Authentication */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Authentication</h2>
        </div>
        <div className="border border-border/50 rounded-xl p-5 bg-card/50 space-y-3">
          <p className="text-sm text-muted-foreground">
            All requests must include your API key in the <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">x-api-key</code> header.
            Contact the ISM Prayer Network admin to receive your key.
          </p>
          <CodeBlock code={`curl -H "x-api-key: YOUR_API_KEY" ${BASE_URL}/books`} />
          <p className="text-xs text-muted-foreground">
            ⚠️ Keep your API key secure. Do not expose it in client-side code. Use it from your server only.
          </p>
        </div>
      </motion.section>

      {/* Base URL */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">Base URL</h2>
        <CodeBlock code={BASE_URL} />
      </motion.section>

      {/* Endpoints */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-xl font-bold text-foreground mb-2">Endpoints</h2>
        <p className="text-sm text-muted-foreground mb-6">Click on any endpoint to see parameters, examples, and response formats.</p>

        <div className="space-y-6">
          {/* Books */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Books</h3>
            </div>
            <div className="space-y-2">
              {endpoints.filter(e => e.path.startsWith("/books")).map((ep) => (
                <EndpointCard key={ep.path + ep.method} {...ep} />
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Categories</h3>
            </div>
            <div className="space-y-2">
              {endpoints.filter(e => e.path === "/categories").map((ep) => (
                <EndpointCard key={ep.path + ep.method} {...ep} />
              ))}
            </div>
          </div>

          {/* Prayer Groups */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Prayer Groups</h3>
            </div>
            <div className="space-y-2">
              {endpoints.filter(e => e.path === "/prayer-groups").map((ep) => (
                <EndpointCard key={ep.path + ep.method} {...ep} />
              ))}
            </div>
          </div>

          {/* Orders */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Orders</h3>
            </div>
            <div className="space-y-2">
              {endpoints.filter(e => e.path === "/orders").map((ep) => (
                <EndpointCard key={ep.path + ep.method} {...ep} />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Error Handling */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">Error Handling</h2>
        <div className="border border-border/50 rounded-xl p-5 bg-card/50 space-y-3">
          <p className="text-sm text-muted-foreground">All errors return a JSON body with an <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">error</code> field.</p>
          <div className="grid gap-2 text-sm">
            <div className="flex gap-3 items-center">
              <code className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-bold">401</code>
              <span className="text-muted-foreground">Invalid or missing API key</span>
            </div>
            <div className="flex gap-3 items-center">
              <code className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs font-bold">400</code>
              <span className="text-muted-foreground">Bad request (missing required fields)</span>
            </div>
            <div className="flex gap-3 items-center">
              <code className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-bold">404</code>
              <span className="text-muted-foreground">Resource not found</span>
            </div>
            <div className="flex gap-3 items-center">
              <code className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-bold">500</code>
              <span className="text-muted-foreground">Server error</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Rate Limits / Notes */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Notes</h2>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Orders are created with <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">pending</code> status and require admin approval.</li>
          <li>Prayer groups created via the API are always public.</li>
          <li>Book listings return a maximum of 100 results per request. Use <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">offset</code> for pagination.</li>
          <li>Your users do not need accounts on our platform — authentication is handled via your API key.</li>
          <li>For support, contact the ISM Prayer Network admin team.</li>
        </ul>
      </motion.section>
    </div>

    <Footer />
  </div>
);

export default ApiDocs;
