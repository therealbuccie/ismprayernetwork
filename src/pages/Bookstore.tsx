import { useState, useMemo, useEffect } from "react";
import { useBooks, useCategories, Book } from "@/hooks/useBooks";
import { useCartContext } from "@/contexts/CartContext";
import { BookCard } from "@/components/bookstore/BookCard";
import { BookDetailModal } from "@/components/bookstore/BookDetailModal";
import { CartSidebar } from "@/components/bookstore/CartSidebar";
import { BookstoreAuthModal } from "@/components/bookstore/BookstoreAuthModal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CampaignBanner from "@/components/CampaignBanner";

const Bookstore = () => {
  const { data: books, isLoading } = useBooks();
  const { data: categories } = useCategories();
  const cart = useCartContext();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<"all" | "digital" | "physical">("all");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<{ book: Book; format: "physical" | "digital" } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // When user logs in and there's a pending cart action, execute it
  useEffect(() => {
    if (user && pendingCartAction) {
      cart.addToCart(pendingCartAction.book, pendingCartAction.format);
      toast({ title: "Added to cart", description: `${pendingCartAction.book.title} added to your cart.` });
      setPendingCartAction(null);
    }
  }, [user, pendingCartAction]);

  const handleAddToCart = (book: Book, format: "physical" | "digital") => {
    if (!user) {
      setPendingCartAction({ book, format });
      setAuthModalOpen(true);
      return;
    }
    cart.addToCart(book, format);
    toast({ title: "Added to cart", description: `${book.title} (${format}) added to your cart.` });
    setSelectedBook(null);
  };

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter((b) => {
      const matchSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || b.category_id === selectedCategory;
      const matchFormat =
        formatFilter === "all" ||
        (formatFilter === "digital" && b.is_digital) ||
        (formatFilter === "physical" && b.is_physical);
      return matchSearch && matchCategory && matchFormat;
    });
  }, [books, search, selectedCategory, formatFilter]);

  const featuredBooks = useMemo(
    () => filteredBooks.filter((b) => b.featured),
    [filteredBooks]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 hero-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--accent) / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.2) 0%, transparent 50%)"
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-6 text-sm text-primary-foreground/80">
              <Sparkles className="w-4 h-4 text-accent" />
              Minister's Bookstore
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
              Equip Your <span className="gold-gradient">Ministry</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              Curated books for pastors, ministers, and spiritual leaders. Available in physical and digital formats.
            </p>

            {/* Search bar */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 h-12 rounded-full bg-background/90 backdrop-blur-sm border-border/50 text-foreground shadow-lg"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile-only floating cart button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full gold-gradient-bg text-accent-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center md:hidden"
        onClick={() => cart.setIsOpen(true)}
      >
        <ShoppingCart className="w-5 h-5" />
        {cart.totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {cart.totalItems}
          </span>
        )}
      </motion.button>

      {/* Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedCategory
                  ? "gold-gradient-bg text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
              }`}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "gold-gradient-bg text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1.5">
            {(["all", "physical", "digital"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  formatFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                }`}
              >
                {f === "all" ? "All Formats" : f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign Banner */}
      <section className="container mx-auto px-4 pb-10">
        <CampaignBanner />
      </section>

      {/* Featured */}
      {featuredBooks.length > 0 && !search && !selectedCategory && formatFilter === "all" && (
        <section className="container mx-auto px-4 pb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" /> Featured Books
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} onSelect={setSelectedBook} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* All Books */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            {search ? "Search Results" : "All Books"}
          </h2>
          <span className="text-sm text-muted-foreground">{filteredBooks.length} books</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No books found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} onSelect={setSelectedBook} onAddToCart={handleAddToCart} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <Footer />

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onAddToCart={handleAddToCart}
      />

      <CartSidebar
        open={cart.isOpen}
        onClose={() => cart.setIsOpen(false)}
        items={cart.items}
        totalPrice={cart.totalPrice}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeFromCart}
        onClearCart={cart.clearCart}
      />

      <BookstoreAuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setPendingCartAction(null); }}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default Bookstore;
