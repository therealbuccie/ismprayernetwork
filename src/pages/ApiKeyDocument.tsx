import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

const ApiKeyDocument = () => {
  const docRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => window.print();

  const handleCopy = async () => {
    if (docRef.current) {
      await navigator.clipboard.writeText(docRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 print:bg-white print:py-0">
      {/* Action bar - hidden in print */}
      <div className="max-w-3xl mx-auto mb-6 flex gap-3 justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy Text"}
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
        </Button>
      </div>

      {/* Document */}
      <div
        ref={docRef}
        className="max-w-3xl mx-auto bg-white text-gray-900 shadow-lg rounded-lg p-10 print:shadow-none print:rounded-none print:p-8 font-sans leading-relaxed"
      >
        {/* Header */}
        <div className="border-b-2 border-primary pb-6 mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            ISM Prayer Network — Partner API Credentials
          </h1>
          <p className="text-sm text-muted-foreground">
            Confidential • Issued on: <span className="font-medium">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          </p>
        </div>

        {/* API Key section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Your API Key</h2>
          <div className="bg-gray-100 border border-gray-200 rounded-md px-5 py-4 font-mono text-sm break-all">
            <span className="text-muted-foreground select-none">x-api-key: </span>
            <span className="text-red-600 font-bold">ism-partner-2024-a7f3e9b1c4d8</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ Keep this key confidential. Do not share it publicly or commit it to version control.
          </p>
        </section>

        {/* Base URL */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Base URL</h2>
          <div className="bg-gray-100 border border-gray-200 rounded-md px-5 py-3 font-mono text-sm">
            https://api.ismprayernetwork.org/api/v1
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Authentication</h2>
          <p className="text-sm mb-3">
            Include your API key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code> header with every request:
          </p>
          <div className="bg-gray-900 text-green-400 rounded-md px-5 py-4 font-mono text-xs overflow-x-auto">
            <pre>{`curl -X GET "https://api.ismprayernetwork.org/api/v1/books" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
          </div>
        </section>

        {/* Available Endpoints */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Available Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-md">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 border-b font-semibold">Method</th>
                  <th className="text-left px-4 py-2 border-b font-semibold">Endpoint</th>
                  <th className="text-left px-4 py-2 border-b font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs text-blue-700">GET</td>
                  <td className="px-4 py-2 font-mono text-xs">/books</td>
                  <td className="px-4 py-2">List all books (paginated)</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs text-blue-700">GET</td>
                  <td className="px-4 py-2 font-mono text-xs">/books/:id</td>
                  <td className="px-4 py-2">Get a single book by ID</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs text-blue-700">GET</td>
                  <td className="px-4 py-2 font-mono text-xs">/categories</td>
                  <td className="px-4 py-2">List all book categories</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs text-blue-700">GET</td>
                  <td className="px-4 py-2 font-mono text-xs">/analytics</td>
                  <td className="px-4 py-2">Bookstore analytics overview</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs text-green-700">POST</td>
                  <td className="px-4 py-2 font-mono text-xs">/orders</td>
                  <td className="px-4 py-2">Create a purchase order</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-green-700">POST</td>
                  <td className="px-4 py-2 font-mono text-xs">/prayer-groups</td>
                  <td className="px-4 py-2">Create a prayer group</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Query Parameters */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Books Query Parameters</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-md">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 border-b font-semibold">Parameter</th>
                  <th className="text-left px-4 py-2 border-b font-semibold">Type</th>
                  <th className="text-left px-4 py-2 border-b font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">search</td>
                  <td className="px-4 py-2 text-xs">string</td>
                  <td className="px-4 py-2">Search by title or author</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">category_id</td>
                  <td className="px-4 py-2 text-xs">uuid</td>
                  <td className="px-4 py-2">Filter by category</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">format</td>
                  <td className="px-4 py-2 text-xs">string</td>
                  <td className="px-4 py-2">"digital" or "physical"</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">featured</td>
                  <td className="px-4 py-2 text-xs">boolean</td>
                  <td className="px-4 py-2">Filter featured books only</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">limit</td>
                  <td className="px-4 py-2 text-xs">integer</td>
                  <td className="px-4 py-2">Max results (default 50, max 100)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">offset</td>
                  <td className="px-4 py-2 text-xs">integer</td>
                  <td className="px-4 py-2">Pagination offset (default 0)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate Limits & Support */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Rate Limits & Usage</h2>
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            <li>All responses are JSON formatted</li>
            <li>Maximum 100 items per paginated request</li>
            <li>API keys are non-transferable — do not share with third parties</li>
            <li>Abuse or excessive usage may result in key revocation</li>
          </ul>
        </section>

        {/* Support */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Support & Contact</h2>
          <p className="text-sm">
            For API support, integration questions, or to request a new API key, contact:
          </p>
          <ul className="text-sm mt-2 space-y-1">
            <li>📧 <strong>Email:</strong> admin@ismprayernetwork.org</li>
            <li>🌐 <strong>API Docs:</strong> <a href="https://ismprayernetwork.org/api-docs" className="text-primary underline">https://ismprayernetwork.org/api-docs</a></li>
            <li>🌐 <strong>Website:</strong> <a href="https://ismprayernetwork.org" className="text-primary underline">https://ismprayernetwork.org</a></li>
          </ul>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 mt-10 text-xs text-muted-foreground text-center">
          <p>© {new Date().getFullYear()} ISM Prayer Network. All rights reserved.</p>
          <p className="mt-1">This document is confidential and intended solely for the authorized recipient.</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDocument;
