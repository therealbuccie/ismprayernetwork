import { CartItem } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (bookId: string, format: "physical" | "digital", quantity: number) => void;
  onRemove: (bookId: string, format: "physical" | "digital") => void;
}

export function CartSidebar({ open, onClose, items, totalPrice, onUpdateQuantity, onRemove }: CartSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-card border-border/50 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="w-5 h-5 text-accent" />
            Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button variant="outline" onClick={onClose}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={`${item.book.id}-${item.format}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card rounded-lg p-3 flex gap-3"
                  >
                    <img
                      src={item.book.cover_image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100"}
                      alt={item.book.title}
                      className="w-16 h-20 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">{item.book.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.book.author}</p>
                      <Badge variant="outline" className="text-[10px] mt-1 capitalize">{item.format}</Badge>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateQuantity(item.book.id, item.format, item.quantity - 1)}
                            className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.book.id, item.format, item.quantity + 1)}
                            className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold gold-gradient">
                          ${(item.book.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(item.book.id, item.format)}
                      className="self-start p-1 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold gold-gradient">${totalPrice.toFixed(2)}</span>
              </div>
              <Button
                size="lg"
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90 font-semibold text-base"
              >
                Proceed to Checkout
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
