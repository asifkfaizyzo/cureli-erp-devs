// src/services/pushNotificationService.ts
//
// Handles:
//   1. Requesting permission from the OS
//   2. Getting the Expo push token
//   3. Registering/updating the token with our backend
//   4. Setting up Android notification channel
//
// This is called ONCE after login from PushManager.
// Token is stored in MMKV so we can detect when it changes.

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { StorageService } from './storage';
import { api } from './api';

// ── Notification handler behavior ─────────────────────────────────────────────
// Controls how notifications behave when the app is in the FOREGROUND.
// - alert: show the notification banner while app is open
// - badge: update the app badge count
// - sound: play notification sound
//
// Set here at module level so it applies before any notification arrives.
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
// Android 8+ requires notifications to be posted to a channel.
// This creates the default channel. Users can customize it in system settings.
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

  // Order updates get their own channel so users can control them separately
  // in Android system settings
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
    // User has permanently denied — they must go to Settings manually
    
    return false;
  }

  // Either undetermined OR denied-but-canAskAgain — prompt the user
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
// projectId is required for Expo push tokens in SDK 50+.
// Pulled from app.config.js → extra.eas.projectId
// which was set by running: npx eas init

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
// Called after login and whenever the token changes.
// The backend stores the token on the current session.

export async function registerPushToken(token: string): Promise<void> {
  try {
    await api.post('/mobile/push/register-token', {
      push_token:      token,
      push_token_type: 'expo',
      platform:        Platform.OS,
    });
    // Cache the registered token so we can detect future changes
    StorageService.setPushToken(token);
    
  } catch (err) {
    console.warn('[Push] Token registration failed:', err);
    // Non-fatal — will retry next app open
  }
}

// ── Remove token from backend ─────────────────────────────────────────────────
// Called on logout so we stop sending notifications to this device.

export async function removePushToken(): Promise<void> {
  try {
    await api.post('/mobile/push/remove-token');
    StorageService.removePushToken();
    
  } catch (err) {
    console.warn('[Push] Token removal failed:', err);
  }
}

// ── Full initialization ───────────────────────────────────────────────────────
// Called once after authentication is confirmed.
// Returns the token if successful, null otherwise.

export async function initializePushNotifications(): Promise<string | null> {
  try {
    await ensureAndroidChannel();

    const granted = await requestPushPermission();
    if (!granted) {
      
      return null;
    }

    const token = await getExpoPushToken();
    if (!token) return null;

    // Only register if token is new or changed
    const cachedToken = StorageService.getPushToken();
    if (token !== cachedToken) {
      await registerPushToken(token);
    } else {
      
    }

    return token;
  } catch (err) {
    console.warn('[Push] Initialization failed:', err);
    return null;
  }
}