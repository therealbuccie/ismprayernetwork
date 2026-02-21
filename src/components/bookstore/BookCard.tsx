import { Book } from "@/hooks/useBooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onAddToCart: (book: Book, format: "physical" | "digital") => void;
}

export function BookCard({ book, onSelect, onAddToCart }: BookCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative glass-card rounded-xl overflow-hidden cursor-pointer"
      onClick={() => onSelect(book)}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={book.cover_image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"}
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
          {book.is_digital && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Download className="w-3 h-3" /> Digital
            </Badge>
          )}
          {book.is_physical && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <BookOpen className="w-3 h-3" /> Physical
            </Badge>
          )}
        </div>

        {/* Quick add */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {book.is_physical && book.stock > 0 && (
            <Button
              size="sm"
              className="flex-1 text-xs bg-primary/90 backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); onAddToCart(book, "physical"); }}
            >
              <ShoppingCart className="w-3 h-3 mr-1" /> Physical
            </Button>
          )}
          {book.is_digital && (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 text-xs backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); onAddToCart(book, "digital"); }}
            >
              <Download className="w-3 h-3 mr-1" /> Digital
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {book.categories?.name || "Uncategorized"}
        </p>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-accent transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold gold-gradient">${book.price.toFixed(2)}</span>
          {book.is_physical && book.stock <= 10 && book.stock > 0 && (
            <span className="text-[10px] text-destructive font-medium">Only {book.stock} left</span>
          )}
          {book.is_physical && book.stock === 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
