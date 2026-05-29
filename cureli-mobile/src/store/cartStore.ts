// src/store/cartStore.ts
//
// Per-user cart store with MMKV persistence.
//
// Persistence rules:
//   - Cart is stored under key "cart.{userId}" in MMKV.
//   - On app start, initCart(userId) loads the user's cart.
//   - On logout, clearCartForUser(userId) wipes their cart from memory + MMKV.
//   - Different users on the same device have separate carts.
//
// cartCount is derived from items so it is always in sync.

import { create } from "zustand";
import { StorageService } from "../services/storage";

// ── Types ─────────────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  skuId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  image: string | null;
  manufacturer: string | null;
}

interface CartStore {
  items: CartItem[];
  cartCount: number;
  currentUserId: string | null;

  // Lifecycle
  initCart: (userId: string) => void;
  clearCartForUser: (userId: string) => void;

  // Mutations
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  incrementItem: (variantId: string) => void;
  decrementItem: (variantId: string) => void;
  clearCart: () => void;
}

// ── Helpers ───────────────────────────────────────────────────

function deriveCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function persist(userId: string | null, items: CartItem[]): void {
  if (!userId) return;
  StorageService.setCart(userId, items);
}

// ── Store ─────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  cartCount: 0,
  currentUserId: null,

  // ── Load cart for user on login / app start ───────────────────

  initCart: (userId: string) => {
    const raw = StorageService.getCart(userId);
    let items: CartItem[] = [];

    if (raw) {
      try {
        items = JSON.parse(raw) as CartItem[];
      } catch {
        items = [];
      }
    }

    set({
      items,
      cartCount: deriveCount(items),
      currentUserId: userId,
    });
  },

  // ── Clear cart on logout ──────────────────────────────────────

  clearCartForUser: (userId: string) => {
    StorageService.clearCart(userId);
    set({ items: [], cartCount: 0, currentUserId: null });
  },

  // ── Add item ──────────────────────────────────────────────────

  addItem: (item) => {
    const { items, currentUserId } = get();
    const existing = items.find((i) => i.variantId === item.variantId);

    let updated: CartItem[];

    if (existing) {
      updated = items.map((i) =>
        i.variantId === item.variantId
          ? { ...i, quantity: i.quantity + 1 }
          : i,
      );
    } else {
      updated = [...items, { ...item, quantity: 1 }];
    }

    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  // ── Remove item entirely ──────────────────────────────────────

  removeItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.filter((i) => i.variantId !== variantId);
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  // ── Increment quantity ────────────────────────────────────────

  incrementItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.map((i) =>
      i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i,
    );
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  // ── Decrement quantity (caller decides whether to remove) ─────

  decrementItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.map((i) =>
      i.variantId === variantId && i.quantity > 1
        ? { ...i, quantity: i.quantity - 1 }
        : i,
    );
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  // ── Clear entire cart ─────────────────────────────────────────

  clearCart: () => {
    const { currentUserId } = get();
    if (currentUserId) StorageService.clearCart(currentUserId);
    set({ items: [], cartCount: 0 });
  },
}));