import { useState } from "react";
import { ComboPack } from "@/hooks/useComboPacks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Package, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface ComboPackCardProps {
  combo: ComboPack;
  onAddToCart: (combo: ComboPack) => void;
}

export function ComboPackCard({ combo, onAddToCart }: ComboPackCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const individualTotal = combo.books?.reduce((sum, item) => sum + (item.books?.price || 0), 0) || 0;
  const savings = individualTotal - combo.price;
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-card rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 border border-accent/20"
        onClick={() => setDetailOpen(true)}
      >
        {/* Cover */}
        <div className="aspect-[3/4] relative bg-gradient-to-br from-accent/20 to-primary/10 overflow-hidden">
          {combo.cover_image_url ? (
            <img src={combo.cover_image_url} alt={combo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
              <Package className="w-10 h-10 text-accent" />
              <div className="flex flex-wrap justify-center gap-1">
                {combo.books?.slice(0, 4).map((item) => (
                  item.books?.cover_image_url && (
                    <img key={item.id} src={item.books.cover_image_url} alt="" className="w-12 h-16 rounded object-cover shadow-sm" />
                  )
                ))}
              </div>
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold gap-1">
            <Package size={10} /> COMBO
          </Badge>
          {savings > 0 && (
            <Badge className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold">
              SAVE {savingsPercent}%
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <p className="text-xs text-muted-foreground">{combo.books?.length || 0} books included</p>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{combo.title}</h3>
          {combo.short_description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{combo.short_description}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="font-bold text-accent text-base">${Number(combo.price).toFixed(2)}</span>
            {savings > 0 && (
              <span className="text-xs text-muted-foreground line-through">${individualTotal.toFixed(2)}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package size={20} className="text-accent" /> {combo.title}
            </DialogTitle>
            <DialogDescription>{combo.short_description || "Bundle deal"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {combo.cover_image_url && (
              <img src={combo.cover_image_url} alt={combo.title} className="w-full max-h-48 object-cover rounded-lg" />
            )}

            {combo.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{combo.description}</p>
            )}

            {/* Pricing breakdown */}
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">What's Included:</h4>
              <div className="space-y-2">
                {combo.books?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.books?.cover_image_url && (
                      <img src={item.books.cover_image_url} alt="" className="w-8 h-10 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.books?.title}</p>
                      <p className="text-xs text-muted-foreground">{item.books?.author}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">${Number(item.books?.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Individual total</span>
                  <span className="line-through text-muted-foreground">${individualTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Combo price</span>
                  <span className="text-accent">${Number(combo.price).toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500 font-medium">You save</span>
                    <span className="text-green-500 font-bold">${savings.toFixed(2)} ({savingsPercent}% off)</span>
                  </div>
                )}
              </div>

              {/* Multi-currency */}
              <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                {combo.espees_price && combo.espees_price > 0 && (
                  <span>ESPEES: {Number(combo.espees_price).toFixed(2)}</span>
                )}
                {combo.ngn_price && combo.ngn_price > 0 && (
                  <span>NGN: ₦{Number(combo.ngn_price).toLocaleString()}</span>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                onAddToCart(combo);
                setDetailOpen(false);
              }}
              className="w-full gap-2 gold-gradient-bg text-accent-foreground"
            >
              <ShoppingCart size={16} /> Add Combo to Cart — ${Number(combo.price).toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
