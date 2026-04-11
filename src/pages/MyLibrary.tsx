import { useState, useEffect, useRef } from "react";
import { useMyPurchases, Purchase } from "@/hooks/usePurchases";
import { useMyOrders } from "@/hooks/usePurchaseOrders";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Library, Eye, ArrowLeft, Maximize2, Minimize2, Clock, CheckCircle2, XCircle, Package, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    CloudPDF: (config: any, el: HTMLElement) => Promise<any>;
  }
}

function FullScreenReader({
  documentId,
  title,
  coverUrl,
  userEmail,
  userName,
  onClose,
}: {
  documentId: string;
  title: string;
  coverUrl?: string;
  userEmail?: string;
  userName?: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const existingScript = document.querySelector(
      'script[src="https://cloudpdf.io/viewer.min.js"]'
    );
    const initViewer = () => {
      if (window.CloudPDF && container) {
        window.CloudPDF(
          {
            documentId,
            darkMode: false,
            download: false,
            print: false,
          },
          container
        );
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

  // Blur content when window loses focus (screenshot protection)
  useEffect(() => {
    const onBlur = () => setIsBlurred(true);
    const onFocus = () => setIsBlurred(false);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Visibility API — blur when tab is hidden (mobile screenshot, app switch)
  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden) setIsBlurred(true);
      else setIsBlurred(false);
    };
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
      // Block PrintScreen — also clear clipboard
      if (e.key === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText?.("").catch(() => {});
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 1500);
      }
      // Block Ctrl+P (print), Ctrl+S (save), Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s" || e.key === "P" || e.key === "S")) {
        e.preventDefault();
      }
      // Block Ctrl+Shift+I (dev tools), Ctrl+Shift+C (inspect element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && /^[iIcCjJ]$/.test(e.key)) {
        e.preventDefault();
      }
      // Block F12 (dev tools)
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Block Windows Snipping Tool shortcut (Win+Shift+S)
      if (e.shiftKey && (e.key === "S" || e.key === "s") && (e.metaKey || e.getModifierState("Meta"))) {
        e.preventDefault();
        navigator.clipboard?.writeText?.("").catch(() => {});
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 1500);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Prevent right-click context menu, copy, selection, drag
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const prevent = (e: Event) => e.preventDefault();
    wrapper.addEventListener("contextmenu", prevent);
    wrapper.addEventListener("copy", prevent);
    wrapper.addEventListener("cut", prevent);
    wrapper.addEventListener("selectstart", prevent);
    return () => {
      wrapper.removeEventListener("contextmenu", prevent);
      wrapper.removeEventListener("copy", prevent);
      wrapper.removeEventListener("cut", prevent);
      wrapper.removeEventListener("selectstart", prevent);
    };
  }, []);

  const watermarkText = userEmail || userName || "Licensed Reader";

  return (
    <motion.div
      ref={wrapperRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col select-none"
      style={{
        backgroundColor: "#f5f0e8",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#3b2f1e] text-[#f5f0e8] shadow-md z-10 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium hover:text-[#d4a574] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Library</span>
        </button>

        <h2 className="text-sm sm:text-base font-semibold truncate max-w-[50%] text-center font-serif">
          {title}
        </h2>

        <button
          onClick={toggleFullscreen}
          className="p-2 hover:text-[#d4a574] transition-colors cursor-pointer"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Reader area */}
      <div className="flex-1 overflow-hidden relative" style={{ filter: isBlurred ? "blur(30px)" : "none", transition: "filter 0.1s" }}>
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ backgroundColor: "#f5f0e8" }}
        />

        {/* Dynamic watermark overlay — traceable to user */}
        <div
          className="absolute inset-0 pointer-events-none z-40 overflow-hidden"
          aria-hidden="true"
          style={{ mixBlendMode: "multiply" }}
        >
          <div
            className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 120px,
                rgba(0,0,0,0.015) 120px,
                rgba(0,0,0,0.015) 121px
              )`,
            }}
          >
            {Array.from({ length: 60 }).map((_, i) => (
              <span
                key={i}
                className="inline-block text-[11px] font-mono select-none"
                style={{
                  color: "rgba(0,0,0,0.04)",
                  transform: "rotate(-35deg)",
                  padding: "60px 40px",
                  whiteSpace: "nowrap",
                  letterSpacing: "2px",
                }}
              >
                {watermarkText}
              </span>
            ))}
          </div>
        </div>

        {isBlurred && (
          <div className="absolute inset-0 bg-[#f5f0e8] flex flex-col items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#3b2f1e]/10 flex items-center justify-center mx-auto mb-4">
                <Eye size={28} className="text-[#3b2f1e]/60" />
              </div>
              <p className="text-[#3b2f1e] font-serif text-lg font-semibold">Content Protected</p>
              <p className="text-[#3b2f1e]/60 text-sm mt-1">Click here or return to this tab to continue reading</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const MyLibrary = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: purchases, isLoading } = useMyPurchases();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const [viewingBook, setViewingBook] = useState<Purchase | null>(null);
  const [ordersExpanded, setOrdersExpanded] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Prevent body scroll when reader is open
  useEffect(() => {
    if (viewingBook) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [viewingBook]);

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
                className="glass-card rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => {
                  if (purchase.books?.cloudpdf_document_id && (purchase.format === "digital" || purchase.format === "both")) {
                    setViewingBook(purchase);
                  }
                }}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={purchase.books?.cover_image_url || "/placeholder.svg"}
                    alt={purchase.books?.title || "Book"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {purchase.books?.cloudpdf_document_id && (purchase.format === "digital" || purchase.format === "both") && (
                      <Button size="sm" className="gap-2 rounded-full px-6 bg-[#3b2f1e] hover:bg-[#3b2f1e]/90">
                        <Eye size={14} /> Read Now
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

      {/* Order History Section */}
      <section className="container mx-auto px-4 pb-12">
        <button
          onClick={() => setOrdersExpanded(!ordersExpanded)}
          className="flex items-center gap-2 mb-4 text-foreground hover:text-accent transition-colors cursor-pointer"
        >
          <Package size={20} />
          <h2 className="text-lg font-semibold">Order History</h2>
          {ordersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {orders && orders.length > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{orders.length}</span>
          )}
        </button>

        <AnimatePresence>
          {ordersExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
                      pending: { icon: <Clock size={14} />, color: "text-yellow-500 bg-yellow-500/10", label: "Pending Review" },
                      approved: { icon: <CheckCircle2 size={14} />, color: "text-green-500 bg-green-500/10", label: "Approved" },
                      rejected: { icon: <XCircle size={14} />, color: "text-red-500 bg-red-500/10", label: "Rejected" },
                      completed: { icon: <CheckCircle2 size={14} />, color: "text-green-500 bg-green-500/10", label: "Completed" },
                    };
                    const status = statusConfig[order.status] || statusConfig.pending;

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                                {status.icon}
                                {status.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(order.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {(order.items as any[]).map((item: any, idx: number) => (
                                <p key={idx} className="text-sm text-foreground">
                                  {item.title || "Book"}{" "}
                                  <span className="text-muted-foreground text-xs">× {item.quantity} • {item.format}</span>
                                </p>
                              ))}
                            </div>
                            {order.admin_note && (
                              <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-accent/30 pl-2">
                                Admin: {order.admin_note}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-foreground">${order.total_amount.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{order.payment_method.replace("_", " ")}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />

      {/* Full-screen book reader */}
      <AnimatePresence>
        {viewingBook?.books?.cloudpdf_document_id && (
          <FullScreenReader
            key={viewingBook.id}
            documentId={viewingBook.books.cloudpdf_document_id}
            title={viewingBook.books.title || "Book"}
            coverUrl={viewingBook.books.cover_image_url || undefined}
            userEmail={user?.email || undefined}
            userName={profile?.full_name || undefined}
            onClose={() => setViewingBook(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyLibrary;
