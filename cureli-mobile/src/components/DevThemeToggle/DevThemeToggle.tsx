// src/components/DevThemeToggle/DevThemeToggle.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const PILL_WIDTH = 48;
const PILL_HEIGHT = 48;
const EXPANDED_WIDTH = 180;
const EXPANDED_HEIGHT = 52;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function DevThemeToggle() {
  const { isDark, preference, setPreference, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - PILL_WIDTH - 12,
      y: SCREEN_HEIGHT - 200 - insets.bottom,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(false);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          setIsDragging(true);
        }
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(_, gesture);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Small delay so the tap handler can check isDragging
        setTimeout(() => setIsDragging(false), 50);
      },
    })
  ).current;

  const toggleTheme = () => {
    setPreference(isDark ? 'light' : 'dark');
  };

  const handlePress = () => {
    if (isDragging) return;
    if (expanded) {
      toggleTheme();
    } else {
      setExpanded(true);
    }
  };

  const handleCollapse = () => {
    setExpanded(false);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
          width: expanded ? EXPANDED_WIDTH : PILL_WIDTH,
          height: expanded ? EXPANDED_HEIGHT : PILL_HEIGHT,
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.default,
          shadowColor: isDark ? '#000000' : '#000000',
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.touchArea}
      >
        {expanded ? (
          <View style={styles.expandedContent}>
            {/* Current mode indicator */}
            <View style={styles.modeInfo}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={isDark ? colors.brand.light : colors.status.warning}
              />
              <Text
                style={[
                  styles.modeLabel,
                  { color: colors.text.primary },
                ]}
              >
                {isDark ? 'Dark' : 'Light'}
              </Text>
            </View>

            {/* Toggle button */}
            <TouchableOpacity
              onPress={() => {
                toggleTheme();
              }}
              activeOpacity={0.7}
              style={[
                styles.switchButton,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={14}
                color={isDark ? colors.status.warning : colors.brand.soft}
              />
              <Text
                style={[
                  styles.switchLabel,
                  { color: colors.text.secondary },
                ]}
              >
                → {isDark ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>

            {/* Close / collapse */}
            <TouchableOpacity onPress={handleCollapse} style={styles.closeBtn}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text.faint}
              />
            </TouchableOpacity>
          </View>
        ) : (
          /* Collapsed pill — just the icon */
          <View style={styles.collapsedContent}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? colors.brand.light : colors.status.warning}
            />
            <View style={styles.devDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 99999,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 20,
    overflow: 'hidden',
  },

  touchArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  // ── Collapsed ────────────────────────────────────────────
  collapsedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  devDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  // ── Expanded ─────────────────────────────────────────────
  expandedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 4,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },

  closeBtn: {
    marginLeft: 'auto',
    padding: 2,
  },
});