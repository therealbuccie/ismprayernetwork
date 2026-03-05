import { Link } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useCart } from "@/hooks/useCart";
import { BookCard } from "@/components/bookstore/BookCard";
import { BookDetailModal } from "@/components/bookstore/BookDetailModal";
import { CartSidebar } from "@/components/bookstore/CartSidebar";
import { HeroButton } from "@/components/HeroButton";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Book } from "@/hooks/useBooks";
import { toast } from "@/hooks/use-toast";

const FeaturedBooksSection = () => {
  const { data: books, isLoading } = useBooks();
  const cart = useCart();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const featuredBooks = books?.filter((b) => b.featured) ?? [];
  // Show featured books, or fall back to showing all books if none are featured
  const featured = (featuredBooks.length > 0 ? featuredBooks : books ?? []).slice(0, 4);

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-4 text-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            Minister's Bookstore
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Featured <span className="gold-gradient">Books</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  const handleAddToCart = (book: Book, format: "physical" | "digital") => {
    cart.addToCart(book, format);
    toast({
      title: "Added to cart",
      description: `${book.title} (${format}) added to your cart.`,
    });
  };

  return (
    <>
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-4 text-sm">
              <Sparkles className="w-4 h-4 text-accent" />
              Minister's Bookstore
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Featured <span className="gold-gradient">Books</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Curated resources to equip your ministry journey — available in physical and digital formats.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {featured.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <BookCard
                  book={book}
                  onSelect={(b) => setSelectedBook(b)}
                  onAddToCart={handleAddToCart}
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/bookstore">
              <HeroButton variant="gold" size="lg" className="gap-2">
                Browse All Books <ArrowRight className="w-4 h-4" />
              </HeroButton>
            </Link>
          </div>
        </div>
      </section>

      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onAddToCart={handleAddToCart}
      />

      <CartSidebar
        items={cart.items}
        open={cart.isOpen}
        onClose={() => cart.setIsOpen(false)}
        onRemove={cart.removeFromCart}
        onUpdateQuantity={cart.updateQuantity}
        totalPrice={cart.totalPrice}
      />
    </>
  );
};

export default FeaturedBooksSection;
