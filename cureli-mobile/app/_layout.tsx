// cureli-mobile/app/_layout.tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { useAuthStore } from "../src/store/authStore";
import { api, authEventEmitter } from "../src/services/api";
import { ThemeProvider } from "../src/theme/ThemeContext";
import { DialogProvider } from "../src/components/Dialog/DialogProvider";
import { GlobalCartBar } from "../src/components/CartBar/GlobalCartBar";
import { useMobileSSE } from "../src/hooks/useMobileSSE";
import { PushManager } from "../src/components/PushManager/PushManager";
import { DevThemeToggle } from "../src/components/DevThemeToggle/DevThemeToggle";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function SSEManager() {
  useMobileSSE();
  return null;
}

export default function RootLayout() {
  const { initialize, logout } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Amulya: require("../assets/fonts/Amulya-Variable.ttf"),
    "Amulya-Variable": require("../assets/fonts/Amulya-Variable.ttf"),
    "Amulya-Bold": require("../assets/fonts/Amulya-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const unsubscribe = authEventEmitter.on("logout", () => logout());
    return unsubscribe;
  }, [logout]);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error?.response?.status === 403 &&
          error?.response?.data?.data?.code === "PROFILE_INCOMPLETE"
        ) {
          router.replace("/onboarding/profile" as any);
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {/* BottomSheetModalProvider must be inside GestureHandlerRootView  */}
          {/* and wrap everything that uses @gorhom/bottom-sheet              */}
          <BottomSheetModalProvider>
            <SSEManager />
            <PushManager />

            <DialogProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                  name="splash"
                  options={{ headerShown: false, animation: "none" }}
                />
                <Stack.Screen
                  name="intro"
                  options={{ headerShown: false, animation: "fade" }}
                />
                <Stack.Screen
                  name="(auth)/login"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(auth)/otp"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="search" options={{ headerShown: false }} />
                <Stack.Screen
                  name="product/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="shop/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="cart" options={{ headerShown: false }} />
                <Stack.Screen
                  name="checkout"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="onboarding/name"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="onboarding/profile"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="onboarding/email"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="profile/edit"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/addresses"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/address/new"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/address/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/loyalty"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/delete-account"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/settings"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/dispensed"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/members"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/notifications"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/privacy"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="profile/terms"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="support/tickets"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="support/raise"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="support/[id]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(auth)/register"
                  options={{ headerShown: false }}
                />
<Stack.Screen
                  name="(auth)/forgot-password"
                  options={{ headerShown: false }}
                />
<Stack.Screen
                  name="(auth)/new-password"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="prescription/upload"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="prescription-request"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="marketplace/categories"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="marketplace/category"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="orders" options={{ headerShown: false }} />
                <Stack.Screen
                  name="+not-found"
                  options={{ headerShown: false }}
                />
              </Stack>

              <GlobalCartBar />
            </DialogProvider>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
