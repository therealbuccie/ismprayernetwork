import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { Code2, BookOpen, FolderOpen, Users, ShoppingCart, Copy, Check, ChevronDown, ChevronRight, Lock, Shield, FileText, Globe } from "lucide-react";

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

interface EndpointInfo {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
}

const EndpointCard = ({ method, path, description, params, body }: EndpointInfo) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div layout className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/50 p-4 md:p-5 space-y-5">
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

          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
           <p className="text-xs text-muted-foreground">
              📄 Request your API key from the ISM admin team to get started with full integration.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const endpoints: EndpointInfo[] = [
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
  },
  {
    method: "GET",
    path: "/books/:id",
    description: "Get full details of a single book",
  },
  {
    method: "GET",
    path: "/categories",
    description: "List all book categories",
  },
  {
    method: "POST",
    path: "/prayer-groups",
    description: "Create a public prayer group",
    body: [
      { name: "name", type: "string", required: true, description: "Name of the prayer group" },
      { name: "description", type: "string", required: false, description: "Group description" },
    ],
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
  },
];


const ApiDocs = () => {
  return (
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
            Access our bookstore, create prayer groups, and place orders — all through a simple REST API designed for easy integration with any platform.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live API — Production Ready
          </div>
        </motion.div>
      </div>
    </section>

    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">

      {/* How It Works — General overview */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">How It Works</h2>
        </div>
        <div className="border border-border/50 rounded-xl p-5 bg-card/50 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
              <div className="text-2xl font-bold text-accent mb-1">1</div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Get Your API Key</h4>
              <p className="text-xs text-muted-foreground">Request API credentials from the ISM admin team. You'll receive a private key and endpoint URL.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
              <div className="text-2xl font-bold text-accent mb-1">2</div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Call From Your Server</h4>
              <p className="text-xs text-muted-foreground">Use PHP, Python, Node.js, or any server-side language to make standard HTTP requests.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
              <div className="text-2xl font-bold text-accent mb-1">3</div>
              <h4 className="font-semibold text-foreground text-sm mb-1">Display On Your Site</h4>
              <p className="text-xs text-muted-foreground">Show books, place orders, and create prayer groups — all powered by our backend.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Base URL */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Base URL</h2>
        </div>
        <div className="border border-border/50 rounded-xl p-5 bg-card/50 space-y-3">
          <p className="text-sm text-muted-foreground">
            All API requests are made against the following base URL:
          </p>
          <CodeBlock code={`https://ismprayernetwork.org/api/v1`} />
          <p className="text-xs text-muted-foreground">
            Append the endpoint path to this base URL. For example, to list books: <code className="text-accent">https://ismprayernetwork.org/api/v1/books</code>
          </p>
        </div>
      </motion.section>

      {/* Authentication — General, no secrets */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Authentication</h2>
        </div>
        <div className="border border-border/50 rounded-xl p-5 bg-card/50 space-y-3">
          <p className="text-sm text-muted-foreground">
            All API requests require authentication via a secret API key sent in the request header.
          </p>
          <CodeBlock code={`// Include this header in every request:
x-api-key: YOUR_API_KEY`} />
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <Shield className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Security:</strong> Your API key is confidential. Never expose it in HTML, JavaScript, or any code that runs in a user's browser. Always make API calls from your <strong>server-side code</strong> (e.g., PHP).
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            To receive your API key, contact the ISM Prayer Network admin team directly.
          </p>
        </div>
      </motion.section>

      {/* Endpoints — No examples with real URLs */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-xl font-bold text-foreground mb-2">Available Endpoints</h2>
        <p className="text-sm text-muted-foreground mb-6">Click on any endpoint to see its parameters and expected data format.</p>

        <div className="space-y-6">
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

      {/* Quick PHP Preview — generic, no secrets */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Quick PHP Example</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Here's a general idea of how to call the API from PHP. Request your API key from the admin team to get started.
        </p>
        <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
          <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-bold">PHP</span>
            <span className="text-sm text-muted-foreground">Server-side integration pattern</span>
          </div>
          <div className="p-4">
            <CodeBlock code={`<?php
// config.php — store OUTSIDE your web root for security
define('ISM_API_KEY', 'YOUR_API_KEY');    // Provided by ISM admin
define('ISM_API_URL', 'YOUR_API_URL');    // Provided by ISM admin

// Make an API request
function ism_api_request($endpoint, $method = 'GET', $data = null) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => ISM_API_URL . $endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'x-api-key: ' . ISM_API_KEY,
            'Content-Type: application/json',
        ],
    ]);

    if ($method === 'POST' && $data !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return json_decode($response, true);
}

// Usage: Fetch featured books
$books = ism_api_request('/books?featured=true');
foreach ($books['books'] as $book) {
    echo $book['title'] . ' — $' . $book['price'] . "\\n";
}`} />
          </div>
        </div>
      </motion.section>

      {/* Get API Key Section */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="border-2 border-accent/30 rounded-xl p-6 md:p-8 bg-gradient-to-br from-accent/5 to-transparent text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-2">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Request Your API Key</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            To integrate with the ISM Prayer Network API, contact the admin team to request your <strong>API key</strong> and <strong>endpoint URL</strong>. Credentials are issued to authorized partners only.
          </p>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-left max-w-md mx-auto">
            <Shield className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              API credentials are <strong className="text-foreground">confidential</strong>. Never expose them in client-side code. Always call the API from your server backend.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Notes */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="pb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">General Notes</h2>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Orders are created with <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">pending</code> status and require admin approval.</li>
          <li>Prayer groups created via the API are always public.</li>
          <li>Book listings return a maximum of 100 results per request. Use <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">offset</code> for pagination.</li>
          <li>Your users do not need accounts on ISM Prayer Network — authentication is handled via your API key.</li>
          <li>All API calls should be made from server-side code only (PHP, Node.js, etc.).</li>
          <li>For support or to request API access, contact the ISM Prayer Network admin team.</li>
        </ul>
      </motion.section>
    </div>

    <Footer />
  </div>
  );
};

export default ApiDocs;
