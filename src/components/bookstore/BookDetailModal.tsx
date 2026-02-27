import { Book } from "@/hooks/useBooks";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ShoppingCart, Star, X } from "lucide-react";
import { motion } from "framer-motion";

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (book: Book, format: "physical" | "digital") => void;
}

export function BookDetailModal({ book, open, onClose, onAddToCart }: BookDetailModalProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-border/50 bg-card">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-[280px_1fr] gap-0">
          {/* Cover */}
          <div className="relative aspect-[3/4] md:aspect-auto bg-muted">
            <img
              src={book.cover_image_url || "/placeholder.svg"}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
            <div className="flex flex-wrap gap-2">
              {book.featured && (
                <Badge className="bg-accent text-accent-foreground gap-1">
                  <Star className="w-3 h-3" /> Featured
                </Badge>
              )}
              <Badge variant="outline">{book.categories?.name || "Uncategorized"}</Badge>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{book.title}</h2>
              <p className="text-muted-foreground">by {book.author}</p>
            </div>

            <p className="text-3xl font-bold gold-gradient">${book.price.toFixed(2)}</p>

            <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {book.pages && (
                <div className="glass-card rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Pages</p>
                  <p className="font-semibold text-foreground">{book.pages}</p>
                </div>
              )}
              {book.isbn && (
                <div className="glass-card rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">ISBN</p>
                  <p className="font-semibold text-foreground text-xs">{book.isbn}</p>
                </div>
              )}
              <div className="glass-card rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Formats</p>
                <div className="flex gap-1 mt-1">
                  {book.is_physical && <Badge variant="secondary" className="text-[10px]"><BookOpen className="w-3 h-3 mr-1" />Physical</Badge>}
                  {book.is_digital && <Badge variant="secondary" className="text-[10px]"><Download className="w-3 h-3 mr-1" />Digital</Badge>}
                </div>
              </div>
              {book.is_physical && (
                <div className="glass-card rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Stock</p>
                  <p className={`font-semibold ${book.stock > 0 ? "text-foreground" : "text-destructive"}`}>
                    {book.stock > 0 ? `${book.stock} available` : "Out of stock"}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto pt-4">
              {book.is_physical && book.stock > 0 && (
                <Button
                  size="lg"
                  className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90 font-semibold"
                  onClick={() => onAddToCart(book, "physical")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add Physical Copy to Cart
                </Button>
              )}
              {book.is_digital && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent/10 font-semibold"
                  onClick={() => onAddToCart(book, "digital")}
                >
                  <Download className="w-4 h-4 mr-2" /> Add Digital Copy to Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
