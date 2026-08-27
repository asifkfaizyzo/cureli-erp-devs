// cureli-mobile/src/services/pushNotificationService.ts

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { StorageService } from './storage';
import { api } from './api';

// ── Notification handler behavior ─────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ── Android default channel ───────────────────────────────────────────────────
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name:             'General',
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor:       '#05015A',
    sound:            'default',
    enableLights:     true,
    enableVibrate:    true,
    showBadge:        true,
  });

  await Notifications.setNotificationChannelAsync('order_updates', {
    name:             'Order Updates',
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor:       '#05015A',
    sound:            'default',
    enableLights:     true,
    enableVibrate:    true,
    showBadge:        true,
  });
}

// ── Permission request ────────────────────────────────────────────────────────
export async function requestPushPermission(): Promise<boolean> {
  const { status: existing, canAskAgain } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  if (existing === 'denied' && !canAskAgain) {
    return false;
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}

// ── Get Expo push token ───────────────────────────────────────────────────────
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    if (!projectId) {
      console.warn('[Push] No projectId found in app config — check extra.eas.projectId in app.config.js');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (err) {
    console.warn('[Push] Failed to get Expo push token:', err);
    return null;
  }
}

// ── Register token with backend ───────────────────────────────────────────────
export async function registerPushToken(token: string): Promise<void> {
  try {
    await api.post('/mobile/push/register-token', {
      push_token:      token,
      push_token_type: 'expo',
      platform:        Platform.OS,
    });
    // Cache the registered token so we can track local changes if needed
    StorageService.setPushToken(token);
    console.log('[Push] Registered push token with backend successfully.');
  } catch (err) {
    console.warn('[Push] Token registration failed:', err);
  }
}

// ── Remove token from backend ─────────────────────────────────────────────────
export async function removePushToken(): Promise<void> {
  try {
    await api.post('/mobile/push/remove-token');
    StorageService.removePushToken();
    console.log('[Push] Cleared push token from backend and local cache.');
  } catch (err) {
    console.warn('[Push] Token removal failed:', err);
  }
}

// ── Full initialization ───────────────────────────────────────────────────────
export async function initializePushNotifications(): Promise<string | null> {
  try {
    await ensureAndroidChannel();

    const granted = await requestPushPermission();
    if (!granted) {
      console.warn('[Push] Permission not granted.');
      return null;
    }

    const token = await getExpoPushToken();
    if (!token) return null;

    // ── FIXED: Always register the token on initialization ───────────────────
    // This guarantees the token is bound to the current active session.
    await registerPushToken(token);

    return token;
  } catch (err) {
    console.warn('[Push] Initialization failed:', err);
    return null;
  }
}