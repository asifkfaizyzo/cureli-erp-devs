// pharmacy-web/src/hooks/useSSENotifications.js

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';

export const useSSENotifications = () => {
  const receiveSSE          = useNotificationStore((s) => s.receiveSSENotification);
  const receiveNewOrder     = useNotificationStore((s) => s.receiveNewOrderSSE);
  const receiveStatusChange = useNotificationStore((s) => s.receiveOrderStatusChangeSSE);
  const eventSourceRef      = useRef(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
      const es  = new EventSource(url);

      // ── Existing: initial unread count on connect ─────────────────────────
      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useNotificationStore.setState({ unreadCount: data.unread_count });
      });

      // ── Existing: notification bell update ────────────────────────────────
      es.addEventListener('new_notification', (e) => {
        receiveSSE(JSON.parse(e.data));
      });

      // ── Existing: new marketplace order (tab badge + list refresh) ────────
      es.addEventListener('marketplace_new_order', (e) => {
        const data = JSON.parse(e.data);
        receiveNewOrder(data);

        try {
          const audio = new Audio('/sounds/order-alert.mp3');
          audio.volume = 0.6;
          audio.play().catch(() => {});
        } catch {
          // Audio not available — silent fail
        }
      });

      // ── New: order status changed (cancellation, pharmacy actions) ────────
      // Fires for ALL status transitions: ACCEPTED, REJECTED, READY_FOR_PICKUP,
      // COMPLETED, CANCELLED (by customer or system).
      // useOrdersPage watches lastOrderUpdate to refresh list + detail panel.
      es.addEventListener('marketplace_order_status_changed', (e) => {
        const data = JSON.parse(e.data);
        receiveStatusChange(data);
      });

      es.onerror = () => es.close();
      eventSourceRef.current = es;
    };

    connect();

    const handleStorage = (e) => {
      if (e.key === 'access_token') {
        eventSourceRef.current?.close();
        if (e.newValue) connect();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      eventSourceRef.current?.close();
    };
  }, [receiveSSE, receiveNewOrder, receiveStatusChange]);

  return null;
};