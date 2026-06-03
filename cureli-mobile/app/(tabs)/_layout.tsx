import { Tabs, router } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '../../src/theme/ThemeContext';
import { useLayoutStore } from '../../src/store/layoutStore';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const setBottomTabBarHeight = useLayoutStore(
    (store) => store.setBottomTabBarHeight,
  );

  const handleTabBarLayout = (event: LayoutChangeEvent) => {
    setBottomTabBarHeight(event.nativeEvent.layout.height);
  };

  const renderTab = (routeIndex: number) => {
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

    const getIcon = (name: string, focused: boolean) => {
      const color = focused ? colors.tab.active : colors.tab.inactive;
      const size = 22;

      switch (name) {
        case 'home':
          return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
        case 'orders':
          return <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />;
        case 'categories':
          return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />;
        case 'profile':
          return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
        default:
          return <Ionicons name="ellipse-outline" size={size} color={color} />;
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
            {
              color: isFocused ? colors.tab.active : colors.tab.inactive,
              fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
            },
          ]}
        >
          {String(label).charAt(0).toUpperCase() + String(label).slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      onLayout={handleTabBarLayout}
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.tab.background,
          borderTopColor: colors.tab.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {renderTab(0)}
      {renderTab(1)}

      {/* Center FAB */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          onPress={() => router.push('/search')}
          style={[
            styles.fabButton,
            { backgroundColor: isDark ? colors.brand.accent : colors.brand.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text
          style={[
            styles.fabLabel,
            { color: isDark ? colors.brand.accent : colors.brand.primary },
          ]}
        >
          Search
        </Text>
      </View>

      {renderTab(2)}
      {renderTab(3)}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"       options={{ tabBarLabel: 'home' }} />
      <Tabs.Screen name="orders"     options={{ tabBarLabel: 'orders' }} />
      <Tabs.Screen name="categories" options={{ tabBarLabel: 'categories' }} />
      <Tabs.Screen name="profile"    options={{ tabBarLabel: 'profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
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
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...Platform.select({
      ios: {
        shadowColor: '#090025',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  fabLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
});