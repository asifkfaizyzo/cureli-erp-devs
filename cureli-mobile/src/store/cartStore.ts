// src/store/cartStore.ts
//
// Zustand cart store.
// cartCount is initialised to 10 for the showcase.
// Replace initialisation + mutations with real API calls in Phase 6.

import { create } from "zustand";

export interface CartItem {
  variantId: string;
  skuId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
}

interface CartStore {
  items: CartItem[];
  cartCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()((set) => ({
  // ── Initial state ────────────────────────────────────────────
  items: [],
  cartCount: 10, // showcase default — replace with real data in Phase 6

  // ── Mutations ────────────────────────────────────────────────
  addItem: (item) =>
    set((state) => {
      const exists = state.items.find((i) => i.variantId === item.variantId);
      if (exists) {
        // Increment quantity if already in cart.
        const updated = state.items.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
        return { items: updated, cartCount: state.cartCount + 1 };
      }
      return {
        items: [...state.items, item],
        cartCount: state.cartCount + 1,
      };
    }),

  removeItem: (variantId) =>
    set((state) => {
      const target = state.items.find((i) => i.variantId === variantId);
      if (!target) return state;
      if (target.quantity > 1) {
        const updated = state.items.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity - 1 } : i,
        );
        return { items: updated, cartCount: Math.max(0, state.cartCount - 1) };
      }
      return {
        items: state.items.filter((i) => i.variantId !== variantId),
        cartCount: Math.max(0, state.cartCount - 1),
      };
    }),

  clearCart: () => set({ items: [], cartCount: 0 }),
}));