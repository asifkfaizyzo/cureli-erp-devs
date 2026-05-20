import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

export const useSSENotifications = () => {
  const receiveSSE = useNotificationStore(s => s.receiveSSENotification);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
      const es = new EventSource(url);

      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useNotificationStore.setState({ unreadCount: data.unread_count });
      });

      es.addEventListener('new_notification', (e) => {
        receiveSSE(JSON.parse(e.data));
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
  }, [receiveSSE]);

  return null;
};