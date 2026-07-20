// src/constants/pushCategories.ts

export const PUSH_CATEGORIES = {
  ORDER_UPDATES:        'order_updates',
  PROMOTIONS:           'promotions',
  PRESCRIPTION_UPDATES: 'prescription_updates',
  SYSTEM_MESSAGES:      'system_messages',
  CART_ABANDONMENT:     'cart_abandonment',
} as const;

export type PushCategory = typeof PUSH_CATEGORIES[keyof typeof PUSH_CATEGORIES];

export const PUSH_CATEGORY_META: Record<PushCategory, {
  title:       string;
  description: string;
  canDisable:  boolean;
}> = {
  [PUSH_CATEGORIES.ORDER_UPDATES]: {
    title:       'Order Updates',
    description: 'Order status, delivery tracking, and completion alerts',
    canDisable:  false,
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

export type TapScreen =
  | 'home'
  | 'order_detail'
  | 'cart'
  | 'product'
  | 'category'
  | 'prescription_upload'
  | 'prescription_request_detail';  // ← ADDED

export interface NotificationTapData {
  screen:        TapScreen;
  orderId?:      string;
  productId?:    string;
  categoryName?: string;
  requestId?:    string;            // ← ADDED
}