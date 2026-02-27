import { useState, useEffect } from "react";
import { useMyPurchases, Purchase } from "@/hooks/usePurchases";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Library, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

declare global {
  interface Window {
    CloudPDF: (config: any, el: HTMLElement) => Promise<any>;
  }
}

function CloudPDFViewer({ documentId, title }: { documentId: string; title: string }) {
  useEffect(() => {
    const container = document.getElementById("cloudpdf-viewer");
    if (!container) return;

    // Load CloudPDF script if not already loaded
    const existingScript = document.querySelector('script[src="https://cloudpdf.io/viewer.min.js"]');
    const initViewer = () => {
      if (window.CloudPDF && container) {
        window.CloudPDF({ documentId, darkMode: true }, container);
      }
    };

    if (existingScript) {
      initViewer();
    } else {
      const script = document.createElement("script");
      script.src = "https://cloudpdf.io/viewer.min.js";
      script.onload = initViewer;
      document.body.appendChild(script);
    }

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [documentId]);

  return <div id="cloudpdf-viewer" style={{ width: "100%", minHeight: "80vh" }} />;
}

const MyLibrary = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: purchases, isLoading } = useMyPurchases();
  const [viewingBook, setViewingBook] = useState<Purchase | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const digitalPurchases = purchases?.filter(
    p => (p.format === "digital" || p.format === "both") && p.books?.cloudpdf_document_id
  );

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-4 text-sm text-primary-foreground/80">
              <Library className="w-4 h-4 text-accent" />
              My Library
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-3">
              Your <span className="gold-gradient">Books</span>
            </h1>
            <p className="text-primary-foreground/70 max-w-md mx-auto">
              Access your purchased books anytime.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No books in your library yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Purchase books from the bookstore to see them here</p>
            <Button onClick={() => navigate("/bookstore")}>Browse Bookstore</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {purchases.map((purchase) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl overflow-hidden group"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={purchase.books?.cover_image_url || "/placeholder.svg"}
                    alt={purchase.books?.title || "Book"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {purchase.books?.cloudpdf_document_id && (purchase.format === "digital" || purchase.format === "both") && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => setViewingBook(purchase)}
                      >
                        <Eye size={14} /> Read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2">{purchase.books?.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{purchase.books?.author}</p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent capitalize">{purchase.format}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />

      {/* CloudPDF Reader Modal */}
      <Dialog open={!!viewingBook} onOpenChange={() => setViewingBook(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{viewingBook?.books?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4 pt-2">
            {viewingBook?.books?.cloudpdf_document_id && (
              <CloudPDFViewer
                documentId={viewingBook.books.cloudpdf_document_id}
                title={viewingBook.books.title || "Book"}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyLibrary;
