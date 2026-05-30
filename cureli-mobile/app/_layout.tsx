// app/_layout.tsx

import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import { useAuthStore } from '../src/store/authStore';
import { authEventEmitter } from '../src/services/api';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { DialogProvider } from '../src/components/Dialog/DialogProvider';
import { LogBox } from 'react-native';

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { initialize, logout } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Amulya: require('../assets/fonts/Amulya-Variable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const unsubscribe = authEventEmitter.on('logout', () => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
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
            <Stack.Screen name="cart"                    options={{ headerShown: false }} />
            <Stack.Screen name="checkout"               options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/name"        options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="onboarding/email"       options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="profile/edit"           options={{ headerShown: false }} />
            <Stack.Screen name="profile/addresses"      options={{ headerShown: false }} />
            <Stack.Screen name="profile/address/new"    options={{ headerShown: false }} />
            <Stack.Screen name="profile/address/[id]"   options={{ headerShown: false }} />
            <Stack.Screen name="profile/delete-account" options={{ headerShown: false }} />
            <Stack.Screen name="profile/settings"       options={{ headerShown: false }} />
            <Stack.Screen name="prescription/upload"    options={{ headerShown: false }} />
            <Stack.Screen name="marketplace/categories" options={{ headerShown: false }} />
            <Stack.Screen name="marketplace/category"   options={{ headerShown: false }} />
            <Stack.Screen name="orders"                 options={{ headerShown: false }} />
          </Stack>
        </DialogProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}