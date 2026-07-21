// src/components/PushManager/PushManager.tsx

import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '../../store/authStore';
import { useNotificationPreferencesStore } from '../../store/notificationPreferencesStore';
import {
  initializePushNotifications,
  removePushToken,
} from '../../services/pushNotificationService';
import type { NotificationTapData } from '../../constants/pushCategories';

function extractTapData(
  raw: Record<string, unknown> | undefined,
): NotificationTapData | undefined {
  if (!raw) return undefined;
  return raw as unknown as NotificationTapData;
}

function handleNotificationTap(data?: NotificationTapData) {
  if (!data?.screen) {
    router.push('/(tabs)' as any);
    return;
  }

  switch (data.screen) {
    case 'order_detail':
      if (data.orderId) {
        router.push(`/orders/${data.orderId}` as any);
      } else {
        router.push('/orders' as any);
      }
      break;

    case 'cart':
      router.push('/cart' as any);
      break;

    case 'product':
      if (data.productId) {
        router.push(`/product/${data.productId}` as any);
      } else {
        router.push('/(tabs)' as any);
      }
      break;

    case 'category':
      if (data.categoryName) {
        router.push({
          pathname: '/marketplace/category' as any,
          params:   { name: data.categoryName },
        });
      } else {
        router.push('/marketplace/categories' as any);
      }
      break;

    case 'prescription_upload':
      router.push('/prescription/upload' as any);
      break;

    // ── NEW ────────────────────────────────────────────────────────────────
    case 'prescription_request_detail':
      if (data.requestId) {
        router.push(`/prescription-request/${data.requestId}` as any);
      } else {
        router.push('/prescription-request' as any);
      }
      break;
    // ──────────────────────────────────────────────────────────────────────

    case 'home':
    default:
      router.push('/(tabs)' as any);
      break;
  }
}

export function PushManager() {
  const status      = useAuthStore((s) => s.status);
  const prevStatus  = useRef<string | null>(null);

  const loadPreferences = useNotificationPreferencesStore(
    (s) => s.loadPreferences,
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = extractTapData(
          response.notification.request.content.data,
        );
        // console.log('[Push] Notification tapped:', data);
        handleNotificationTap(data);
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // console.log(
        //   '[Push] Notification received in foreground:',
        //   notification.request.content.title,
        // );
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (status === 'authenticated' && prev !== 'authenticated') {
      initializePushNotifications().then((token) => {
        if (token) {
          // console.log('[Push] Initialized with token:', token.slice(0, 30) + '...');
        }
      });

      loadPreferences();
    }

    if (status === 'unauthenticated' && prev === 'authenticated') {
      removePushToken();
    }
  }, [status, loadPreferences]);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const data = extractTapData(
        response.notification.request.content.data,
      );

      if (data) {
        setTimeout(() => handleNotificationTap(data), 500);
      }
    });
  }, []);

  return null;
}