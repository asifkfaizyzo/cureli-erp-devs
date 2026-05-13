// app/_layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ROOT STACK NAVIGATOR
//
// This is the outermost navigator. Every screen in the app lives inside this.
//
// Mental model for web devs:
//   This is like your root <Router> in React Router, but instead of declaring
//   <Route> components, Expo Router reads the file system automatically.
//   You only need <Stack> here to configure header behavior per screen.
//
// How Stack works in React Native:
//   Screens are pushed ONTO a stack (like a deck of cards).
//   Navigating to /search pushes it on top of everything.
//   Pressing back POPS it off, revealing whatever was underneath.
//
// Why (tabs) is just ONE entry here:
//   From the Root Stack's perspective, the entire tab navigator is a single
//   child screen. The tab switching happens INSIDE that child — the root
//   stack doesn't know or care which tab is active.
// ─────────────────────────────────────────────────────────────────────────────

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/*
        (tabs) — The entire tab group is registered as ONE screen here.
        Expo Router automatically maps the (tabs) folder to this entry.
        headerShown: false because the tab navigator manages its own UI.
        The parentheses in (tabs) mean it's a route GROUP — it does NOT
        add "/tabs" to the URL. home.tsx is at /home, not /tabs/home.
      */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/*
        search — Lives OUTSIDE (tabs) intentionally.
        When navigated to, it COVERS the tab navigator entirely.
        The tab bar disappears. This is a full-screen experience.
        This is why Search is not a tab — it behaves like a modal/overlay.
      */}
      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          // presentation: 'modal' — optional, would slide up from bottom
          // leaving as default (slide from right) for now
        }}
      />

      {/*
        product/[id] — Dynamic route. The [id] part works exactly like
        React Router's :id param. Access it with useLocalSearchParams().
        Also lives outside tabs so it covers the tab bar when open.
      */}
      <Stack.Screen
        name="product/[id]"
        options={{ headerShown: false }}
      />

      {/*
        cart and checkout — Root stack screens.
        Globally accessible from anywhere in the app.
        Not linked from anything yet — placeholders only.
      */}
      <Stack.Screen
        name="cart"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="checkout"
        options={{ headerShown: false }}
      />

      {/*
        Stubs — registered so Expo Router doesn't 404 if navigated to.
        Not wired into any navigation flow yet.
      */}
      <Stack.Screen
        name="splash"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="intro"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(auth)/login"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(auth)/otp"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}