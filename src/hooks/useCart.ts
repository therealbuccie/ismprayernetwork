import { useState, useCallback } from "react";
import { Book } from "./useBooks";

export interface CartItem {
  book: Book;
  quantity: number;
  format: "physical" | "digital";
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = useCallback((book: Book, format: "physical" | "digital") => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.book.id === book.id && i.format === format
      );
      if (existing) {
        return prev.map((i) =>
          i.book.id === book.id && i.format === format
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { book, quantity: 1, format }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((bookId: string, format: "physical" | "digital") => {
    setItems((prev) => prev.filter((i) => !(i.book.id === bookId && i.format === format)));
  }, []);

  const updateQuantity = useCallback((bookId: string, format: "physical" | "digital", quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId, format);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.book.id === bookId && i.format === format ? { ...i, quantity } : i
      )
    );
  }, [removeFromCart]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.book.price * i.quantity, 0);

  const clearCart = useCallback(() => setItems([]), []);

  return { items, isOpen, setIsOpen, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice, clearCart };
}
