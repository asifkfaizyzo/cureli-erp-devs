// src/store/orderNotificationStore.ts
//
// Single-purpose store for mobile SSE order status updates.
// Kept separate from authStore and prescriptionStore to avoid coupling.
//
// Flow:
//   useMobileSSE hook receives 'order_status_changed' SSE event
//   → calls setLastStatusUpdate
//   → OrdersScreen and OrderDetailScreen watch lastStatusUpdate
//   → they refetch and then call clearLastStatusUpdate

import { create } from 'zustand';

interface OrderStatusUpdate {
  order_id:     string;
  order_number: string;
  new_status:   string;
}

interface OrderNotificationStore {
  lastStatusUpdate: OrderStatusUpdate | null;
  setLastStatusUpdate: (update: OrderStatusUpdate) => void;
  clearLastStatusUpdate: () => void;
}

export const useOrderNotificationStore = create<OrderNotificationStore>((set) => ({
  lastStatusUpdate: null,

  setLastStatusUpdate: (update) => set({ lastStatusUpdate: update }),

  clearLastStatusUpdate: () => set({ lastStatusUpdate: null }),
}));