import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const CartCtx = createContext(null);
const STORAGE_KEY = "foundation_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const key = (it) => `${it.product_id}-${it.variant_id}`;
      const existing = prev.find((p) => key(p) === key(item));
      if (existing) {
        return prev.map((p) => key(p) === key(item) ? { ...p, quantity: Math.min(10, p.quantity + item.quantity) } : p);
      }
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const removeItem = useCallback((product_id, variant_id) => {
    setItems((prev) => prev.filter((p) => !(p.product_id === product_id && p.variant_id === variant_id)));
  }, []);

  const updateQty = useCallback((product_id, variant_id, qty) => {
    setItems((prev) => prev.map((p) =>
      p.product_id === product_id && p.variant_id === variant_id ? { ...p, quantity: Math.max(1, Math.min(10, qty)) } : p
    ));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <CartCtx.Provider value={{ items, addItem, removeItem, updateQty, clear, subtotal, count, open, setOpen }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
