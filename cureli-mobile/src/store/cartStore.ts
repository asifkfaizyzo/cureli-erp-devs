// src/store/cartStore.ts
//
// Per-user cart store with MMKV persistence.
//
// PHASE 3 CHANGE: single-pharmacy cart enforcement.
//
// CartItem now carries pharmacy context (shopId, shopName, branchId,
// branchName). addItem detects when the incoming item belongs to a
// different branch than items already in the cart and returns a conflict
// signal instead of adding silently.
//
// The UI handles the conflict by showing a dialog:
//   "Your cart contains items from [shopName]. Clear cart and continue?"
// User confirms → clearCart() then addItem() again.
// User cancels → nothing changes.
//
// Cart enforcement is at the BRANCH level. Same shop, different branch =
// conflict. This is intentional — different branches have different
// inventory, pricing, and fulfillment.
//
// cartPharmacy is a derived selector — null when cart is empty,
// otherwise the pharmacy context of the current cart items.
//
// cartTotal is a derived selector — sum of pricePerUnit * quantity for
// all items. Used by the shop screen's "Go to Cart" sticky bar.

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

// Result of addItem — either success or a conflict that needs user resolution
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

  // ── Load cart for user on login / app start ───────────────

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

  // ── Clear cart on logout ──────────────────────────────────

  clearCartForUser: (userId: string) => {
    StorageService.clearCart(userId);
    set({ items: [], cartCount: 0, currentUserId: null });
  },

  // ── Add item with pharmacy conflict detection ─────────────
  //
  // Returns { status: "added" } on success.
  // Returns { status: "conflict", existingPharmacy } when the item
  // belongs to a different branch than existing cart items.
  //
  // On conflict: caller must show dialog, then call clearCart() and
  // addItem() again if user confirms.

  addItem: (item): AddItemResult => {
    const { items, currentUserId } = get();

    // ── Conflict check ──────────────────────────────────────
    // Only check if cart is non-empty.
    if (items.length > 0) {
      const existingBranchId = items[0].branchId;

      if (item.branchId !== existingBranchId) {
        // Different branch — return conflict signal without mutating state
        return {
          status: "conflict",
          existingPharmacy: {
            shopId: items[0].shopId,
            shopName: items[0].shopName,
            branchId: items[0].branchId,
            branchName: items[0].branchName,
          },
        };
      }
    }

    // ── No conflict — add or increment ──────────────────────
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

  // ── Remove item entirely ──────────────────────────────────

  removeItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.filter((i) => i.variantId !== variantId);
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  // ── Increment quantity ────────────────────────────────────

  incrementItem: (variantId) => {
    const { items, currentUserId } = get();
    const updated = items.map((i) =>
      i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i,
    );
    persist(currentUserId, updated);
    set({ items: updated, cartCount: deriveCount(updated) });
  },

  // ── Decrement quantity ────────────────────────────────────
  // Allows quantity to reach 0 then filters the item out.
  //
  // Behavior:
  //   quantity 3 → tap − → quantity 2  (stepper stays)
  //   quantity 2 → tap − → quantity 1  (stepper stays)
  //   quantity 1 → tap − → quantity 0  → item REMOVED from cart
  //                                     → UI reverts to plain "ADD" button

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

  // ── Clear entire cart ─────────────────────────────────────

  clearCart: () => {
    const { currentUserId } = get();
    if (currentUserId) StorageService.clearCart(currentUserId);
    set({ items: [], cartCount: 0 });
  },

  // ── Derived: current cart pharmacy ───────────────────────
  // Returns null when cart is empty.
  // Returns pharmacy context when items exist — all items in cart
  // always belong to the same branch (enforced by addItem).

  cartPharmacy: (): CartPharmacy | null => {
    const { items } = get();
    if (items.length === 0) return null;
    return {
      shopId: items[0].shopId,
      shopName: items[0].shopName,
      branchId: items[0].branchId,
      branchName: items[0].branchName,
    };
  },

  // ── Derived: cart grand total ─────────────────────────────
  // Sum of pricePerUnit × quantity across all items.
  // Used by the shop screen "Go to Cart" bar so it can show a
  // running total without needing a separate computation.

  cartTotal: (): number => {
    const { items } = get();
    return items.reduce(
      (sum, item) => sum + item.pricePerUnit * item.quantity,
      0,
    );
  },
}));
