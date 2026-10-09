"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { OrderItemModifier } from "@/lib/types";

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  quantity: number;
  optionIds: string[];
  modifiers: OrderItemModifier[];
  notes?: string;
  unitPrice: number; // solo para mostrar; el servidor recalcula el precio
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(l: Pick<CartLine, "productId" | "optionIds" | "notes">) {
  return `${l.productId}|${[...l.optionIds].sort().join(",")}|${(l.notes ?? "").trim().toLowerCase()}`;
}

/** Carrito por negocio, guardado en el navegador para no perderlo al recargar. */
export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `klisto:cart:${slug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratar desde localStorage solo ocurre en el navegador
      if (saved) setLines(JSON.parse(saved) as CartLine[]);
    } catch {
      // almacenamiento no disponible (modo privado): el carrito vive solo en memoria
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // ignorar
    }
  }, [lines, ready, storageKey]);

  const add = useCallback((line: Omit<CartLine, "key">) => {
    const key = lineKey(line);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(99, l.quantity + line.quantity) } : l));
      }
      return [...prev, { ...line, key }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(99, quantity) } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((a, l) => a + l.quantity, 0),
      total: lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
