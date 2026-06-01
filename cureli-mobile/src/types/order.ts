// src/types/order.ts

export interface OrderItem {
  id: string;
  name: string;
  brand: string | null;
  packSize: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderBill {
  mrp: number;
  discount: number;
  itemTotal: number;
  handlingFee: number;
  deliveryFee: number;
  billTotal: number;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Cash on Delivery' | 'Wallet';
export type OrderStatus = 'delivered' | 'cancelled' | 'processing';

export interface DispensedOrder {
  id: string;
  status: OrderStatus;
  arrivedInMinutes: number;
  deliveredAt: string;       // ISO string
  placedAt: string;          // ISO string
  items: OrderItem[];
  bill: OrderBill;
  ratingSubmitted: boolean;
  ratingValue: number | null;
  paymentMethod: PaymentMethod;
  addressLine: string;
}