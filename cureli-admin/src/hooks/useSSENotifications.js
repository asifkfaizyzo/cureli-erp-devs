import { useEffect, useRef } from 'react';
import { useCAdminNotificationStore } from '../store/useCAdminNotificationStore';

export const useSSENotifications = () => {
  const receiveSSE = useCAdminNotificationStore(s => s.receiveSSENotification);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('cadmin_access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/cadmin/notifications/stream?token=${token}`;
      const es = new EventSource(url);

      es.onmessage = (e) => {
        // SSE heartbeat handling if needed, usually ignored
      };

      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useCAdminNotificationStore.setState({ unreadCount: data.unread_count });
      });

      es.addEventListener('new_notification', (e) => {
        const data = JSON.parse(e.data);
        receiveSSE(data);
      });

      es.onerror = () => {
        es.close();
        // Native EventSource auto-reconnects, but if token is expired, 
        // it will fail until a new token is in localStorage.
      };

      eventSourceRef.current = es;
    };

    connect();

    const handleStorage = (e) => {
      if (e.key === 'cadmin_access_token') {
        if (!e.newValue) {
          eventSourceRef.current?.close();
        } else {
          eventSourceRef.current?.close();
          connect();
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      eventSourceRef.current?.close();
    };
  }, [receiveSSE]);

  return null;
};