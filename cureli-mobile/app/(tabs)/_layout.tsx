// app/(tabs)/_layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TAB NAVIGATOR + CUSTOM TAB BAR
//
// This file does two things:
//   1. Defines which files inside (tabs)/ are actual tabs
//   2. Renders a custom bottom tab bar with a center FAB for Search
//
// Why a custom tab bar?
//   Expo Router's <Tabs> accepts a `tabBar` prop. You give it a function
//   that returns any View you want. This lets us insert a fake center button
//   that triggers router.push('/search') instead of switching tabs.
//
// The 5 visual slots:
//   [ Home ] [ Orders ] [ SEARCH FAB ] [ Categories ] [ Profile ]
//   real tab   real tab   NOT A TAB      real tab        real tab
//
// How tab state + stack navigation coexist:
//   The Tab navigator manages which tab is "active" in memory.
//   When you push /search via the Root Stack, the Tab navigator is still
//   alive underneath — it just gets covered. When you pop back, the Tab
//   navigator resurfaces with the same active tab. State is preserved.
// ─────────────────────────────────────────────────────────────────────────────

import { Tabs, router } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// ─── Brand colors pulled from Cureli design system ───────────────────────────
const BRAND = {
  primary: '#05015A',
  primaryMid: '#0a0280',
  inactive: '#94a3b8',   // slate-400
  tabBarBg: '#ffffff',
  border: '#e2e8f0',     // slate-200
  fabBg: '#05015A',
  fabIcon: '#ffffff',
};

// ─── Custom Tab Bar Component ─────────────────────────────────────────────────
//
// BottomTabBarProps is typed by React Navigation.
// `state`       → which tab index is currently active
// `descriptors` → per-tab config (label, options, etc.)
// `navigation`  → the tab navigator's navigation object
//
// We map over the real tabs but INSERT a fake center slot between
// index 1 (Orders) and index 2 (Categories).

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  //
  // useSafeAreaInsets() — React Native concept, no web equivalent.
  // On devices with home indicators (iPhone X+) or notches, the OS
  // reserves safe space at the top and bottom. We must add paddingBottom
  // so our tab bar content isn't hidden behind the home indicator.
  //

  // Build the 5 visual slots:
  //   slots 0,1   → real tabs (Home, Orders)
  //   slot  2     → fake FAB (Search)
  //   slots 3,4   → real tabs (Categories, Profile)
  //
  // state.routes = [home, orders, categories, profile]  (4 real tabs)
  // We manually interleave the FAB at visual position 2.

  const renderTab = (routeIndex: number, visualIndex: number) => {
    const route = state.routes[routeIndex];
    const descriptor = descriptors[route.key];
    const isFocused = state.index === routeIndex;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    // Map route names to icons
    const getIcon = (name: string, focused: boolean) => {
      const color = focused ? BRAND.primary : BRAND.inactive;
      const size = 22;
      switch (name) {
        case 'home':
          return (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          );
        case 'orders':
          return (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size}
              color={color}
            />
          );
        case 'categories':
          return (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={color}
            />
          );
        case 'profile':
          return (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          );
        default:
          return (
            <Ionicons name="ellipse-outline" size={size} color={color} />
          );
      }
    };

    const label = descriptor.options.tabBarLabel ?? route.name;

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.tabButton}
        accessibilityRole="button"
        accessibilityLabel={String(label)}
      >
        {getIcon(route.name, isFocused)}
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? BRAND.primary : BRAND.inactive },
          ]}
        >
          {String(label).charAt(0).toUpperCase() + String(label).slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          // If device has a home indicator, respect it.
          // If not (older Android), use a minimum of 8px.
        },
      ]}
    >
      {/* Tab 0: Home */}
      {renderTab(0, 0)}

      {/* Tab 1: Orders */}
      {renderTab(1, 1)}

      {/*
        CENTER FAB — Search
        This is NOT a tab. It's a regular TouchableOpacity that calls
        router.push('/search'), which triggers the Root Stack to push
        the search screen on top of everything.
        The tab bar will disappear (covered by the stack screen).
        When user presses back, stack pops, tab bar reappears with
        the same active tab still selected.
      */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          onPress={() => router.push('/search')}
          style={styles.fabButton}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={24} color={BRAND.fabIcon} />
        
        </TouchableOpacity>
        <Text style={styles.fabLabel}>Search</Text>
      </View>

      {/* Tab 2: Categories (routeIndex 2) */}
      {renderTab(2, 3)}

      {/* Tab 3: Profile (routeIndex 3) */}
      {renderTab(3, 4)}
    </View>
  );
}

// ─── Tab Layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // We hide the default header for all tabs.
        // Each tab screen will manage its own header/title if needed.
      }}
    >
      {/*
        Each <Tabs.Screen> maps to a file inside (tabs)/.
        The `name` must exactly match the filename (without .tsx).
        Order here determines tab index (0, 1, 2, 3).
      */}
      <Tabs.Screen
        name="home"
        options={{ tabBarLabel: 'home' }}
      />
      <Tabs.Screen
        name="orders"
        options={{ tabBarLabel: 'orders' }}
      />
      <Tabs.Screen
        name="categories"
        options={{ tabBarLabel: 'categories' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarLabel: 'profile' }}
      />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
//
// StyleSheet.create() — React Native's equivalent of CSS-in-JS.
// No Tailwind here — RN uses a subset of CSS as JS objects.
// Key differences from web CSS:
//   - No units (px, em, etc.) — just numbers (density-independent pixels)
//   - No cascading inheritance
//   - flexDirection defaults to 'column' (not 'row' like web)
//   - All Views are flex containers by default

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',        // horizontal row of tab buttons
    alignItems: 'center',
    backgroundColor: BRAND.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 8,
    // Shadow — Platform-specific
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,                     // each tab takes equal width
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 3,                      // space between icon and label
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    gap: 3,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,            // perfect circle
    backgroundColor: BRAND.fabBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,              // lifts the FAB above the tab bar line
    // Shadow for the FAB
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: BRAND.primary,
  },
});