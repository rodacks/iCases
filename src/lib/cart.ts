'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Design } from './catalog';
export type CartItem = {
  key: string;
  kind: 'product' | 'custom';
  productId?: string;
  designId?: string;
  modelId: string;
  materialId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  design: Design;
};
type Cart = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>) => void;
  quantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};
export const useCart = create<Cart>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.key === item.key);
          return {
            items: existing
              ? s.items.map((i) =>
                  i.key === item.key ? { ...i, quantity: Math.min(20, i.quantity + 1) } : i,
                )
              : [...s.items, { ...item, quantity: 1 }],
          };
        }),
      quantity: (key, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(20, quantity)) } : i,
          ),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'icases-cart-v1' },
  ),
);
