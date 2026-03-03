import { Book } from "@/hooks/useBooks";
import { Badge } from "@/components/ui/badge";
import { Star, Package } from "lucide-react";
import { motion } from "framer-motion";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onAddToCart: (book: Book, format: "physical" | "digital") => void;
}

const isCombo = (book: Book) => {
  const text = `${book.title} ${book.subtitle || ""}`.toLowerCase();
  return text.includes("combo") || text.includes("pack") || text.includes("bundle") || text.includes("collection");
};

export function BookCard({ book, onSelect }: BookCardProps) {
  const combo = isCombo(book);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`group relative glass-card rounded-xl overflow-hidden cursor-pointer ${combo ? "ring-2 ring-accent/40" : ""}`}
      onClick={() => onSelect(book)}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={book.cover_image_url || "/placeholder.svg"}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {book.featured && (
            <Badge className="bg-accent text-accent-foreground text-[10px] gap-1">
              <Star className="w-3 h-3" /> Featured
            </Badge>
          )}
          {combo && (
            <Badge className="bg-primary text-primary-foreground text-[10px] gap-1">
              <Package className="w-3 h-3" /> Combo Pack
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-1.5">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {book.categories?.name || "Uncategorized"}
        </p>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-accent transition-colors">
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">{book.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground">{book.author}</p>
        {book.short_description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 pt-1">{book.short_description}</p>
        )}
        {combo && book.description && (
          <p className="text-xs text-accent/80 font-medium line-clamp-2 pt-1">
            📦 {book.description.split('\n')[0]}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold gold-gradient">${book.price.toFixed(2)}</span>
          {combo && (
            <span className="text-[10px] text-accent font-semibold">Bundle Deal</span>
          )}
          {!combo && book.is_physical && book.stock <= 10 && book.stock > 0 && (
            <span className="text-[10px] text-destructive font-medium">Only {book.stock} left</span>
          )}
          {!combo && book.is_physical && book.stock === 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
