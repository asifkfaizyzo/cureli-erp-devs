// src/constants/pushCategories.ts
//
// Single source of truth for push notification categories.
// Used by:
//   - Mobile: preference store, PushManager routing
//   - Backend: push service, preference API
//   - Both must stay in sync — if you add a category here,
//     add the corresponding column to CureliMobilePushPreference in schema.prisma

export const PUSH_CATEGORIES = {
  ORDER_UPDATES:        'order_updates',
  PROMOTIONS:           'promotions',
  PRESCRIPTION_UPDATES: 'prescription_updates',
  SYSTEM_MESSAGES:      'system_messages',
  CART_ABANDONMENT:     'cart_abandonment',
} as const;

export type PushCategory = typeof PUSH_CATEGORIES[keyof typeof PUSH_CATEGORIES];

// Category metadata for the preferences UI
export const PUSH_CATEGORY_META: Record<PushCategory, {
  title:       string;
  description: string;
  canDisable:  boolean; // false = always sent (critical), user cannot turn off
}> = {
  [PUSH_CATEGORIES.ORDER_UPDATES]: {
    title:       'Order Updates',
    description: 'Order status, delivery tracking, and completion alerts',
    canDisable:  false, // Critical — always sent
  },
  [PUSH_CATEGORIES.PROMOTIONS]: {
    title:       'Promotions & Offers',
    description: 'Deals, discounts, and new product launches',
    canDisable:  true,
  },
  [PUSH_CATEGORIES.PRESCRIPTION_UPDATES]: {
    title:       'Prescription Updates',
    description: 'Prescription verified or rejected notifications',
    canDisable:  true,
  },
  [PUSH_CATEGORIES.SYSTEM_MESSAGES]: {
    title:       'System Messages',
    description: 'Account updates and important notices',
    canDisable:  true,
  },
  [PUSH_CATEGORIES.CART_ABANDONMENT]: {
    title:       'Cart Reminders',
    description: 'Reminders when you have items waiting in your cart',
    canDisable:  true,
  },
};

// ── Tap action routing ────────────────────────────────────────────────────────
// Maps notification data.screen values to Expo Router paths.
// Used by the notification tap handler in PushManager.

export type TapScreen =
  | 'home'
  | 'order_detail'
  | 'cart'
  | 'product'
  | 'category'
  | 'prescription_upload';

export interface NotificationTapData {
  screen:   TapScreen;
  orderId?:       string;
  productId?:     string;
  categoryName?:  string;
}