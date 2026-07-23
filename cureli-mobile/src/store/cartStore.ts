// src/store/cartStore.ts
//
// Per-user cart store with MMKV persistence.
//
// CHANGE: Added setItems() — bulk-loads items directly bypassing the
// conflict check. Used by the prescription request quote acceptance flow
// to populate the cart before navigating to /cart.

import { create } from "zustand";
import { StorageService } from "../services/storage";
import type { CartPharmacy } from "../types/shop";

// ── Types ─────────────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  skuId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  image: string | null;
  manufacturer: string | null;
  shopId: string;
  shopName: string;
  branchId: string;
  branchName: string;
  requiresPrescription: boolean;
  category: string | null;
  branchLatitude?: number | null;
  branchLongitude?: number | null;
}

export type AddItemResult =
  | { status: "added" }
  | {
      status: "conflict";
      existingPharmacy: CartPharmacy;
    };

interface CartStore {
  items: CartItem[];
  cartCount: number;
  currentUserId: string | null;

  // Lifecycle
  initCart: (userId: string) => void;
  clearCartForUser: (userId: string) => void;

  // Mutations
  addItem: (item: Omit<CartItem, "quantity">) => AddItemResult;
  removeItem: (variantId: string) => void;
  incrementItem: (variantId: string) => void;
  decrementItem: (variantId: string) => void;
  clearCart: () => void;

  // Bulk load — bypasses conflict check.
  // Clears existing cart and replaces with provided items.
  // Used when accepting a prescription quote to pre-populate
  // the cart before navigating to /cart.
  setItems: (items: CartItem[]) => void;

  // Derived
  cartPharmacy: () => CartPharmacy | null;
  cartTotal: () => number;
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
    set({ items, cartCount: deriveCount(items), currentUserId: userId });
  },

  clearCartForUser: (userId: string) => {
    StorageService.clearCart(userId);
    set({ items: [], cartCount: 0, currentUserId: null });
  },

  addItem: (item): AddItemResult => {
    const { items, currentUserId } = get();

    if (items.length > 0) {
      const existingBranchId = items[0].branchId;
      if (item.branchId !== existingBranchId) {
        return {
          status: "conflict",
          existingPharmacy: {
            shopId:     items[0].shopId,
            shopName:   items[0].shopName,
            branchId:   items[0].branchId,
            branchName: items[0].branchName,
          },
        };
      }
    }

    const existing = items.find((i) => i.variantId === item.variantId);
    let updated: CartItem[];

    if (existing) {
      updated = items.map((i) =>
        i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i,
      );
    } else {
      updated = [...items, { ...item, quantity: 1 }];
    }

    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
    return { status: "added" };
  },

  removeItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.filter((i) => i.variantId !== variantId);
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  incrementItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.map((i) =>
      i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i,
    );
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  decrementItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items
      .map((i) =>
        i.variantId === variantId ? { ...i, quantity: i.quantity - 1 } : i,
      )
      .filter((i) => i.quantity > 0);
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  clearCart: () => {
    const { currentUserId } = get();
    if (currentUserId) StorageService.clearCart(currentUserId);
    set({ items: [], cartCount: 0 });
  },

  // ── Bulk load ─────────────────────────────────────────────
  // Clears current cart and replaces it with the provided items.
  // Does NOT run conflict detection — caller is responsible for
  // ensuring all items belong to the same branch.
  // Persists to MMKV immediately.

  setItems: (items: CartItem[]) => {
    const { currentUserId } = get();
    persist(currentUserId, items);
    set({ items, cartCount: deriveCount(items) });
  },

  cartPharmacy: (): CartPharmacy | null => {
    const { items } = get();
    if (items.length === 0) return null;
    return {
      shopId:     items[0].shopId,
      shopName:   items[0].shopName,
      branchId:   items[0].branchId,
      branchName: items[0].branchName,
    };
  },

  cartTotal: (): number => {
    const { items } = get();
    return items.reduce(
      (sum, item) => sum + item.pricePerUnit * item.quantity,
      0,
    );
  },
}));