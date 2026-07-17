// pharmacy-web/src/hooks/useSSENotifications.js
// MODIFIED
// Removed: audio ref, audio creation, broken Zustand v5 subscription
// Added: addPendingOrder + resolvePendingOrder calls (audio is now
//        triggered inside the store, not here)
// Everything else unchanged.

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import useOrderAlertStore from '../store/useOrderAlertStore';

// Statuses that mean the order no longer needs pharmacy action
const RESOLVE_STATUSES = new Set(['ACCEPTED', 'REJECTED', 'CANCELLED']);

export const useSSENotifications = () => {
  const receiveSSE          = useNotificationStore((s) => s.receiveSSENotification);
  const receiveNewOrder     = useNotificationStore((s) => s.receiveNewOrderSSE);
  const receiveStatusChange = useNotificationStore((s) => s.receiveOrderStatusChangeSSE);

  const addPendingOrder     = useOrderAlertStore((s) => s.addPendingOrder);
  const resolvePendingOrder = useOrderAlertStore((s) => s.resolvePendingOrder);

  const eventSourceRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
      const es  = new EventSource(url);

      // ── Existing: initial unread count on connect ───────────────────────
      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useNotificationStore.setState({ unreadCount: data.unread_count });
      });

      // ── Existing: notification bell update ─────────────────────────────
      es.addEventListener('new_notification', (e) => {
        receiveSSE(JSON.parse(e.data));
      });

      // ── Existing + NEW: new marketplace order ───────────────────────────
      // receiveNewOrder  → updates badge + triggers list refresh (unchanged)
      // addPendingOrder  → registers order in alert store → audio starts
      es.addEventListener('marketplace_new_order', (e) => {
        const data = JSON.parse(e.data);
        receiveNewOrder(data);

        if (data.order_id) {
          addPendingOrder(data.order_id);
        }
      });

      // ── Existing + NEW: order status changed ────────────────────────────
      // receiveStatusChange  → refreshes list + detail panel (unchanged)
      // resolvePendingOrder  → removes order from registry → audio stops
      //                        when registry hits zero
      es.addEventListener('marketplace_order_status_changed', (e) => {
        const data = JSON.parse(e.data);
        receiveStatusChange(data);

        if (data.order_id && RESOLVE_STATUSES.has(data.new_status)) {
          resolvePendingOrder(data.order_id);
        }
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
  }, [receiveSSE, receiveNewOrder, receiveStatusChange, addPendingOrder, resolvePendingOrder]);

  return null;
};