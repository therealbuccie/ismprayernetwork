import { Book } from "@/hooks/useBooks";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ShoppingCart, Star, X, Package } from "lucide-react";

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (book: Book, format: "physical" | "digital") => void;
}

const isCombo = (book: Book) => {
  const text = `${book.title} ${book.subtitle || ""}`.toLowerCase();
  return text.includes("combo") || text.includes("pack") || text.includes("bundle") || text.includes("collection");
};

export function BookDetailModal({ book, open, onClose, onAddToCart }: BookDetailModalProps) {
  if (!book) return null;
  const combo = isCombo(book);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-border/50 bg-card max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-[280px_1fr] gap-0 overflow-y-auto max-h-[90vh]">
          {/* Cover */}
          <div className="relative w-full bg-muted flex-shrink-0">
            <img
              src={book.cover_image_url || "/placeholder.svg"}
              alt={book.title}
              className="w-full h-auto max-h-[40vh] md:max-h-none md:h-full object-contain md:object-cover"
            />
            {combo && (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <Package className="w-3 h-3" /> Combo Pack
                </Badge>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {book.featured && (
                <Badge className="bg-accent text-accent-foreground gap-1">
                  <Star className="w-3 h-3" /> Featured
                </Badge>
              )}
              <Badge variant="outline">{book.categories?.name || "Uncategorized"}</Badge>
              {combo && (
                <Badge variant="outline" className="border-accent text-accent gap-1">
                  <Package className="w-3 h-3" /> Multiple Titles Included
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{book.title}</h2>
              {book.subtitle && (
                <p className="text-sm text-muted-foreground italic mb-1">{book.subtitle}</p>
              )}
              <p className="text-muted-foreground">by {book.author}</p>
            </div>

            <p className="text-3xl font-bold gold-gradient">${book.price.toFixed(2)}</p>

            {/* Combo highlight */}
            {combo && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                <p className="text-sm font-semibold text-accent mb-1 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> What's Included in This Pack
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {book.description || book.short_description || "Multiple titles bundled together at a special price."}
                </p>
              </div>
            )}

            {/* Long description (non-combo) */}
            {!combo && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {book.description || book.short_description || "No description available."}
              </p>
            )}

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
              {book.is_physical && (
                <div className="glass-card rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Stock</p>
                  <p className={`font-semibold ${book.stock > 0 ? "text-foreground" : "text-destructive"}`}>
                    {book.stock > 0 ? `${book.stock} available` : "Out of stock"}
                  </p>
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <div className="flex flex-col gap-2 mt-auto pt-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {combo ? "Add combo pack to cart" : "Choose format"}
              </p>
              {book.is_physical && book.stock > 0 && (
                <Button
                  size="lg"
                  className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90 font-semibold"
                  onClick={() => onAddToCart(book, "physical")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {combo ? "Add Combo Pack (Physical)" : "Add Physical Copy"} — ${book.price.toFixed(2)}
                </Button>
              )}
              {book.is_physical && book.stock === 0 && (
                <Button size="lg" disabled className="w-full font-semibold">
                  <BookOpen className="w-4 h-4 mr-2" /> Physical — Out of Stock
                </Button>
              )}
              {book.is_digital && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent/10 font-semibold"
                  onClick={() => onAddToCart(book, "digital")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {combo ? "Add Combo Pack (Digital)" : "Add Digital Copy"} — ${book.price.toFixed(2)}
                </Button>
              )}
              {!book.is_physical && !book.is_digital && (
                <p className="text-sm text-muted-foreground text-center">No formats available</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
