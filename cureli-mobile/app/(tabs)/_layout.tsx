// app/(tabs)/_layout.tsx — True Floating Notch Dock

import { Tabs, router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useTheme } from "../../src/theme/ThemeContext";
import { useLayoutStore } from "../../src/store/layoutStore";

// ── Floating dock constants ───────────────────────────────────

const DOCK_CORNER_RADIUS = 28;
const NOTCH_RADIUS = 34;
const BAR_CONTENT_HEIGHT = 64;

const DOCK_SIDE_MARGIN = 12;
const DOCK_BOTTOM_GAP = 12;

// This is the transparent headroom above the dock so the FAB can
// visually float upward without getting clipped.
const FAB_OVERHANG_SPACE = 28;

// ── Notch Background SVG ──────────────────────────────────────

interface NotchBgProps {
  width: number;
  height: number;
  notchRadius: number;
  fillColor: string;
  borderColor: string;
  cornerRadius: number;
}

function NotchBackground({
  width,
  height,
  notchRadius,
  fillColor,
  borderColor,
  cornerRadius,
}: NotchBgProps) {
  if (width === 0) return null;

  const cx = width / 2;
  const nr = notchRadius;
  const curveDepth = nr + 10;
  const curveWidth = nr + 20;
  const cr = cornerRadius;

  const d = [
    `M 0 ${cr}`,
    `Q 0 0, ${cr} 0`,
    `L ${cx - curveWidth} 0`,
    `C ${cx - curveWidth + 20} 0, ${cx - nr - 4} ${curveDepth}, ${cx} ${curveDepth}`,
    `C ${cx + nr + 4} ${curveDepth}, ${cx + curveWidth - 20} 0, ${cx + curveWidth} 0`,
    `L ${width - cr} 0`,
    `Q ${width} 0, ${width} ${cr}`,
    `L ${width} ${height - cr}`,
    `Q ${width} ${height}, ${width - cr} ${height}`,
    `L ${cr} ${height}`,
    `Q 0 ${height}, 0 ${height - cr}`,
    `Z`,
  ].join(" ");

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Path d={d} fill={fillColor} stroke={borderColor} strokeWidth={1} />
    </Svg>
  );
}

// ── Animated Tab Button ───────────────────────────────────────

interface TabItemProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}

function TabItem({
  routeName,
  label,
  isFocused,
  onPress,
  activeColor,
  inactiveColor,
}: TabItemProps) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, {
      damping: 14,
      stiffness: 140,
    });
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ scaleX: interpolate(progress.value, [0, 1], [0, 1]) }],
  }));

  const getIcon = (name: string, focused: boolean) => {
    const color = focused ? activeColor : inactiveColor;
    const size = 22;

    switch (name) {
      case "home":
        return (
          <Ionicons
            name={focused ? "home" : "home-outline"}
            size={size}
            color={color}
          />
        );
      case "orders":
        return (
          <Ionicons
            name={focused ? "receipt" : "receipt-outline"}
            size={size}
            color={color}
          />
        );
      case "categories":
        return (
          <Ionicons
            name={focused ? "grid" : "grid-outline"}
            size={size}
            color={color}
          />
        );
      case "profile":
        return (
          <Ionicons
            name={focused ? "person" : "person-outline"}
            size={size}
            color={color}
          />
        );
      default:
        return <Ionicons name="ellipse-outline" size={size} color={color} />;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <Animated.View style={iconStyle}>
        {getIcon(routeName, isFocused)}
      </Animated.View>

      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontFamily: isFocused ? "Inter_600SemiBold" : "Inter_400Regular",
          },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      <Animated.View
        style={[styles.activeDot, { backgroundColor: activeColor }, dotStyle]}
      />
    </TouchableOpacity>
  );
}

// ── Animated FAB ──────────────────────────────────────────────

interface SearchFABProps {
  onPress: () => void;
  backgroundColor: string;
  labelColor: string;
}

function SearchFAB({ onPress, backgroundColor, labelColor }: SearchFABProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 160 });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.fabWrapper}>
      <Animated.View style={animStyle}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[styles.fabButton, { backgroundColor }]}
          accessibilityRole="button"
          accessibilityLabel="Search"
          activeOpacity={1}
        >
          <View style={styles.fabInnerRing}>
            <Ionicons name="search" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.fabLabel, { color: labelColor }]}>Search</Text>
    </View>
  );
}

// ── Custom Tab Bar ────────────────────────────────────────────

function FloatingNotchTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const setBottomTabBarHeight = useLayoutStore((s) => s.setBottomTabBarHeight);

  const [dockWidth, setDockWidth] = useState(0);

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const dockHeight = BAR_CONTENT_HEIGHT + bottomInset;
  const totalFloatingHeight =
    FAB_OVERHANG_SPACE + dockHeight + DOCK_BOTTOM_GAP;

  const handleOuterLayout = (e: LayoutChangeEvent) => {
    setBottomTabBarHeight(e.nativeEvent.layout.height);
  };

  const handleDockLayout = (e: LayoutChangeEvent) => {
    setDockWidth(e.nativeEvent.layout.width);
  };

  const handleTabPress = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const getLabel = (index: number): string => {
    const route = state.routes[index];
    const desc = descriptors[route.key];
    const raw = desc.options.tabBarLabel ?? route.name;
    const str = String(raw);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const fabBg = isDark ? colors.brand.accent : colors.brand.primary;
  const fabLabelColor = isDark ? colors.brand.accent : colors.brand.primary;
  const dockBg = colors.tab.background;
  const dockBorder = colors.tab.border;

  return (
    <View
      pointerEvents="box-none"
      onLayout={handleOuterLayout}
      style={[
        styles.outerWrap,
        {
          height: totalFloatingHeight,
        },
      ]}
    >
      <View
        onLayout={handleDockLayout}
        style={[
          styles.dock,
          {
            height: dockHeight,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <NotchBackground
          width={dockWidth}
          height={dockHeight}
          notchRadius={NOTCH_RADIUS}
          fillColor={dockBg}
          borderColor={dockBorder}
          cornerRadius={DOCK_CORNER_RADIUS}
        />

        <View style={styles.tabRow}>
          <TabItem
            routeName={state.routes[0].name}
            label={getLabel(0)}
            isFocused={state.index === 0}
            onPress={() => handleTabPress(0)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
          />

          <TabItem
            routeName={state.routes[1].name}
            label={getLabel(1)}
            isFocused={state.index === 1}
            onPress={() => handleTabPress(1)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
          />

          <SearchFAB
            onPress={() => router.push("/search")}
            backgroundColor={fabBg}
            labelColor={fabLabelColor}
          />

          <TabItem
            routeName={state.routes[2].name}
            label={getLabel(2)}
            isFocused={state.index === 2}
            onPress={() => handleTabPress(2)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
          />

          <TabItem
            routeName={state.routes[3].name}
            label={getLabel(3)}
            isFocused={state.index === 3}
            onPress={() => handleTabPress(3)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
          />
        </View>
      </View>
    </View>
  );
}

// ── Tab Layout ────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingNotchTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ tabBarLabel: "home" }} />
      <Tabs.Screen name="orders" options={{ tabBarLabel: "orders" }} />
      <Tabs.Screen name="categories" options={{ tabBarLabel: "categories" }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: "profile" }} />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: DOCK_SIDE_MARGIN,
    paddingTop: FAB_OVERHANG_SPACE,
    paddingBottom: DOCK_BOTTOM_GAP,
    backgroundColor: "transparent",
    zIndex: 100,
  },

  dock: {
    position: "relative",
    overflow: "visible",
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },

  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 4,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
  },

  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },

  fabWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 72,
    gap: 2,
  },

  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -34,
    ...Platform.select({
      ios: {
        shadowColor: "#090025",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },

  fabInnerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },

  fabLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 14,
    marginTop: -4,
  },
});