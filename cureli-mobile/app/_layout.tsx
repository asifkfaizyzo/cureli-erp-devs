// app/_layout.tsx

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '../src/store/authStore';
import { api, authEventEmitter } from '../src/services/api';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { DialogProvider } from '../src/components/Dialog/DialogProvider';
import { GlobalCartBar } from '../src/components/CartBar/GlobalCartBar';
import { useMobileSSE } from '../src/hooks/useMobileSSE';
import { PushManager } from '../src/components/PushManager/PushManager';
import { DevThemeToggle } from '../src/components/DevThemeToggle/DevThemeToggle';

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:     2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function SSEManager() {
  useMobileSSE();
  return null;
}

const __DEV_SHOW_THEME_TOGGLE__ = true;

export default function RootLayout() {
  const { initialize, logout } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Amulya:            require('../assets/fonts/Amulya-Variable.ttf'),
    'Amulya-Variable': require('../assets/fonts/Amulya-Variable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initialize();
  }, []);

  // ── Logout event from axios interceptor ──────────────────
  useEffect(() => {
    const unsubscribe = authEventEmitter.on('logout', () => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  // ── Profile incomplete gate ───────────────────────────────
  // Catches any 403 PROFILE_INCOMPLETE response from any API call
  // made while the user is inside the app (post-splash).
  // This is the safety net for the mid-session case — e.g. user
  // somehow reaches checkout without completing profile.
  // The primary gate is in splash.tsx navigateNext().
  // This interceptor is the secondary defence.
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error?.response?.status === 403 &&
          error?.response?.data?.data?.code === 'PROFILE_INCOMPLETE'
        ) {
          router.replace('/onboarding/profile' as any);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SSEManager />
          <PushManager />

          <DialogProvider>
            <Stack>
              <Stack.Screen name="index"                  options={{ headerShown: false }} />
              <Stack.Screen name="splash"                 options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen name="intro"                  options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="(auth)/login"           options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/otp"             options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)"                 options={{ headerShown: false }} />
              <Stack.Screen name="search"                 options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]"           options={{ headerShown: false }} />
              <Stack.Screen name="shop/[id]"              options={{ headerShown: false }} />
              <Stack.Screen name="cart"                   options={{ headerShown: false }} />
              <Stack.Screen name="checkout"               options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/name"        options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="onboarding/profile"     options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="onboarding/email"       options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="profile/edit"           options={{ headerShown: false }} />
              <Stack.Screen name="profile/addresses"      options={{ headerShown: false }} />
              <Stack.Screen name="profile/address/new"    options={{ headerShown: false }} />
              <Stack.Screen name="profile/address/[id]"   options={{ headerShown: false }} />
              <Stack.Screen name="profile/delete-account" options={{ headerShown: false }} />
              <Stack.Screen name="profile/settings"       options={{ headerShown: false }} />
              <Stack.Screen name="profile/dispensed"      options={{ headerShown: false }} />
              <Stack.Screen name="profile/members"        options={{ headerShown: false }} />
              <Stack.Screen name="profile/notifications"  options={{ headerShown: false }} />
              <Stack.Screen name="prescription/upload"    options={{ headerShown: false }} />
              <Stack.Screen name="marketplace/categories" options={{ headerShown: false }} />
              <Stack.Screen name="marketplace/category"   options={{ headerShown: false }} />
              <Stack.Screen name="orders"                 options={{ headerShown: false }} />
            </Stack>

            <GlobalCartBar />

            {/* {__DEV_SHOW_THEME_TOGGLE__ && <DevThemeToggle />} */}
          </DialogProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}