// app/(tabs)/_layout.tsx — True Floating Notch Dock
//
// Changes in this version:
//   - TabItem accepts optional badgeColor prop
//   - Orders tab reads from tabBadgeStore and passes badge color
//   - Red dot = active orders, brand dot = active prescription requests
//   - Red takes priority when both are true

import { Tabs, router }          from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type LayoutChangeEvent,
}                                from 'react-native';
import { useSafeAreaInsets }     from 'react-native-safe-area-context';
import { Ionicons }              from '@expo/vector-icons';
import Svg, { Path }             from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
}                                from 'react-native-reanimated';
import { useEffect, useState }   from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme }          from '../../src/theme/ThemeContext';
import { useLayoutStore }    from '../../src/store/layoutStore';
import { useTabBadgeStore }  from '../../src/store/tabBadgeStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const DOCK_CORNER_RADIUS  = 28;
const NOTCH_RADIUS        = 34;
const BAR_CONTENT_HEIGHT  = 64;
const DOCK_SIDE_MARGIN    = 12;
const DOCK_BOTTOM_GAP     = Platform.OS === 'ios' ? 22 : 12;
const FAB_OVERHANG_SPACE  = 28;

// ── Notch Background SVG ──────────────────────────────────────────────────────

interface NotchBgProps {
  width:        number;
  height:       number;
  notchRadius:  number;
  fillColor:    string;
  borderColor:  string;
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

  const cx         = width / 2;
  const nr         = notchRadius;
  const curveDepth = nr + 10;
  const curveWidth = nr + 20;
  const cr         = cornerRadius;

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
  ].join(' ');

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

// ── Tab Item ──────────────────────────────────────────────────────────────────

interface TabItemProps {
  routeName:     string;
  label:         string;
  isFocused:     boolean;
  onPress:       () => void;
  activeColor:   string;
  inactiveColor: string;
  // Optional badge dot. When provided renders a small filled circle
  // at top-right of the icon. Undefined = no badge.
  badgeColor?:   string;
  // Background color of the dock — used as badge border to make it
  // appear to "float" above the icon (visual separation trick).
  dockBgColor:   string;
}

function TabItem({
  routeName,
  label,
  isFocused,
  onPress,
  activeColor,
  inactiveColor,
  badgeColor,
  dockBgColor,
}: TabItemProps) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, {
      damping:   14,
      stiffness: 140,
    });
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
      { scale:      interpolate(progress.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ scaleX: interpolate(progress.value, [0, 1], [0, 1]) }],
  }));

  const getIcon = (name: string, focused: boolean) => {
    const color = focused ? activeColor : inactiveColor;
    const size  = 22;

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

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      {/* Icon wrapper — position: relative so badge can be absolute inside */}
      <View style={styles.iconWrap}>
        <Animated.View style={iconStyle}>
          {getIcon(routeName, isFocused)}
        </Animated.View>

        {/* Badge dot — only rendered when badgeColor is provided */}
        {badgeColor !== undefined && (
          <View
            style={[
              styles.badgeDot,
              {
                backgroundColor: badgeColor,
                borderColor:     dockBgColor,
              },
            ]}
          />
        )}
      </View>

      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color:      isFocused ? activeColor : inactiveColor,
            fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
          },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      <Animated.View
        style={[
          styles.activeDot,
          { backgroundColor: activeColor },
          dotStyle,
        ]}
      />
    </TouchableOpacity>
  );
}

// ── Animated FAB ──────────────────────────────────────────────────────────────

interface SearchFABProps {
  onPress:         () => void;
  backgroundColor: string;
  labelColor:      string;
}

function SearchFAB({ onPress, backgroundColor, labelColor }: SearchFABProps) {
  const scale = useSharedValue(1);

  const handlePressIn  = () => {
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

// ── Custom Tab Bar ────────────────────────────────────────────────────────────

function FloatingNotchTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets                = useSafeAreaInsets();
  const { colors, isDark }    = useTheme();
  const setBottomTabBarHeight = useLayoutStore((s) => s.setBottomTabBarHeight);

  // Badge store
  const hasActiveOrders        = useTabBadgeStore((s) => s.hasActiveOrders);
  const hasActivePrescriptions = useTabBadgeStore((s) => s.hasActivePrescriptions);

  const [dockWidth, setDockWidth] = useState(0);

  const rawBottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const bottomInset    =
    Platform.OS === 'ios' ? Math.min(rawBottomInset, 5) : rawBottomInset;
  const dockHeight          = BAR_CONTENT_HEIGHT + bottomInset;
  const totalFloatingHeight = FAB_OVERHANG_SPACE + dockHeight + DOCK_BOTTOM_GAP;

  const handleOuterLayout = (e: LayoutChangeEvent) => {
    setBottomTabBarHeight(e.nativeEvent.layout.height);
  };
  const handleDockLayout = (e: LayoutChangeEvent) => {
    setDockWidth(e.nativeEvent.layout.width);
  };

  const handleTabPress = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type:             'tabPress',
      target:           route.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const getLabel = (index: number): string => {
    const route = state.routes[index];
    const desc  = descriptors[route.key];
    const raw   = desc.options.tabBarLabel ?? route.name;
    const str   = String(raw);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const fabBg        = isDark ? colors.brand.accent   : colors.brand.primary;
  const fabLabelColor = isDark ? colors.brand.accent   : colors.brand.primary;
  const dockBg       = colors.tab.background;
  const dockBorder   = colors.tab.border;

  // ── Badge color logic for Orders tab ─────────────────────────────────
  // Red (active orders) takes priority over brand (active prescriptions).
  // Both off = no badge.
  const ordersBadgeColor: string | undefined = hasActiveOrders
    ? colors.status.error
    : hasActivePrescriptions
      ? (isDark ? colors.brand.accent : colors.brand.primary)
      : undefined;

  return (
    <View
      pointerEvents="box-none"
      onLayout={handleOuterLayout}
      style={[styles.outerWrap, { height: totalFloatingHeight }]}
    >
      <View
        onLayout={handleDockLayout}
        style={[styles.dock, { height: dockHeight, paddingBottom: bottomInset }]}
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
          {/* Home — index 0, no badge */}
          <TabItem
            routeName={state.routes[0].name}
            label={getLabel(0)}
            isFocused={state.index === 0}
            onPress={() => handleTabPress(0)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
            dockBgColor={dockBg}
          />

          {/* Orders — index 1, badge when active orders or prescriptions */}
          <TabItem
            routeName={state.routes[1].name}
            label={getLabel(1)}
            isFocused={state.index === 1}
            onPress={() => handleTabPress(1)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
            badgeColor={ordersBadgeColor}
            dockBgColor={dockBg}
          />

          <SearchFAB
            onPress={() => router.push('/search')}
            backgroundColor={fabBg}
            labelColor={fabLabelColor}
          />

          {/* Categories — index 2, no badge */}
          <TabItem
            routeName={state.routes[2].name}
            label={getLabel(2)}
            isFocused={state.index === 2}
            onPress={() => handleTabPress(2)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
            dockBgColor={dockBg}
          />

          {/* Profile — index 3, no badge */}
          <TabItem
            routeName={state.routes[3].name}
            label={getLabel(3)}
            isFocused={state.index === 3}
            onPress={() => handleTabPress(3)}
            activeColor={colors.tab.itemactive}
            inactiveColor={colors.text.secondary}
            dockBgColor={dockBg}
          />
        </View>
      </View>
    </View>
  );
}

// ── Tab Layout ────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingNotchTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position:        'absolute',
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          elevation:       0,
          shadowOpacity:   0,
        },
      }}
    >
      <Tabs.Screen name="home"       options={{ tabBarLabel: 'home'       }} />
      <Tabs.Screen name="orders"     options={{ tabBarLabel: 'orders'     }} />
      <Tabs.Screen name="categories" options={{ tabBarLabel: 'categories' }} />
      <Tabs.Screen name="profile"    options={{ tabBarLabel: 'profile'    }} />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrap: {
    position:          'absolute',
    left:              0,
    right:             0,
    bottom:            0,
    paddingHorizontal: DOCK_SIDE_MARGIN,
    paddingTop:        FAB_OVERHANG_SPACE,
    paddingBottom:     DOCK_BOTTOM_GAP,
    backgroundColor:   'transparent',
    zIndex:            100,
  },
  dock: {
    position:        'relative',
    overflow:        'visible',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius:  20,
      },
      android: { elevation: 16 },
    }),
  },
  tabRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingTop:        10,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap:            3,
  },
  // Wraps the icon so the badge can be absolutely positioned inside it
  iconWrap: {
    position: 'relative',
    width:    26,
    height:   26,
    alignItems:     'center',
    justifyContent: 'center',
  },
  // Badge dot — floats at top-right of the icon
  badgeDot: {
    position:     'absolute',
    top:          -3,
    right:        -3,
    width:        8,
    height:       8,
    borderRadius: 4,
    // borderColor comes from dockBgColor prop, giving the "floating" look
    borderWidth:  1.5,
  },
  tabLabel: {
    fontSize:   10,
    lineHeight: 14,
  },
  activeDot: {
    width:        4,
    height:       4,
    borderRadius: 2,
    marginTop:    2,
  },
  fabWrapper: {
    alignItems:     'center',
    justifyContent: 'flex-start',
    width:          72,
    gap:            2,
  },
  fabButton: {
    width:          60,
    height:         60,
    borderRadius:   30,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      -34,
    ...Platform.select({
      ios: {
        shadowColor:   '#090025',
        shadowOffset:  { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius:  16,
      },
      android: { elevation: 12 },
    }),
  },
  fabInnerRing: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    2,
    borderColor:    'rgba(255,255,255,0.2)',
  },
  fabLabel: {
    fontSize:   10,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
    marginTop:  -4,
  },
});