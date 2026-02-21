import { Link } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/bookstore/BookCard";
import { HeroButton } from "@/components/HeroButton";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const FeaturedBooksSection = () => {
  const { data: books, isLoading } = useBooks();
  const featured = books?.filter((b) => b.featured)?.slice(0, 4) ?? [];

  if (isLoading || featured.length === 0) return null;

  return (
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
                onSelect={() => {}}
                onAddToCart={() =>
                  toast({ title: "Visit the bookstore", description: "Head to our bookstore to add items to your cart." })
                }
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
  );
};

export default FeaturedBooksSection;
