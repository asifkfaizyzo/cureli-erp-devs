// pharmacy-web/src/hooks/useSSENotifications.js

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';

export const useSSENotifications = () => {
  const receiveSSE = useNotificationStore((s) => s.receiveSSENotification);
  const receiveNewOrder = useNotificationStore((s) => s.receiveNewOrderSSE);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
      const es = new EventSource(url);

      // ── Existing: notification bell ───────────────────────────────────
      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useNotificationStore.setState({ unreadCount: data.unread_count });
      });

      es.addEventListener('new_notification', (e) => {
        receiveSSE(JSON.parse(e.data));
      });

      // ── New: marketplace order real-time update ───────────────────────
      // This event is fired directly from the order service
      // independently of the notification bell pipeline.
      // It carries order payload for live Orders page update.
      es.addEventListener('marketplace_new_order', (e) => {
        const data = JSON.parse(e.data);
        receiveNewOrder(data);

        // Play notification sound once
        try {
          const audio = new Audio('/sounds/order-alert.mp3');
          audio.volume = 0.6;
          audio.play().catch(() => {
            // Browser may block autoplay — silent fail is correct
          });
        } catch {
          // Audio not available — silent fail
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
  }, [receiveSSE, receiveNewOrder]);

  return null;
};