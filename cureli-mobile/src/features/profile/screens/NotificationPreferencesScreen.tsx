// src/features/profile/screens/NotificationPreferencesScreen.tsx
//
// Notification preferences — UI only for now.
// Toggles are stored locally in component state.
// Will be wired to a backend API later.

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';

// ── Notification category config ──────────────────────────────

interface NotificationCategory {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  defaultEnabled: boolean;
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'order_updates',
    icon: 'local-shipping',
    title: 'Order Updates',
    description: 'Your order status, delivery tracking, and completion alerts',
    defaultEnabled: true,
  },
  {
    id: 'promotions',
    icon: 'local-offer',
    title: 'Promotions & Offers',
    description: 'Deals, discounts, coupons, and new product launches',
    defaultEnabled: true,
  },
  {
    id: 'prescription_reminders',
    icon: 'event-repeat',
    title: 'Prescription Reminders',
    description: 'Reminders when it\'s time to reorder your medicines',
    defaultEnabled: true,
  },
  {
    id: 'app_announcements',
    icon: 'campaign',
    title: 'App Announcements',
    description: 'New features, maintenance updates, and important notices',
    defaultEnabled: false,
  },
];

// ── Component ─────────────────────────────────────────────────

export function NotificationPreferencesScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  // Local state — will be replaced with API/MMKV persistence later
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      initial[cat.id] = cat.defaultEnabled;
    });
    return initial;
  });

  const [masterEnabled, setMasterEnabled] = useState(true);

  const toggleCategory = (id: string) => {
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMaster = (value: boolean) => {
    setMasterEnabled(value);
    if (!value) {
      // Turn off all when master is off
      const allOff: Record<string, boolean> = {};
      NOTIFICATION_CATEGORIES.forEach((cat) => {
        allOff[cat.id] = false;
      });
      setPreferences(allOff);
    } else {
      // Restore defaults when master is turned on
      const defaults: Record<string, boolean> = {};
      NOTIFICATION_CATEGORIES.forEach((cat) => {
        defaults[cat.id] = cat.defaultEnabled;
      });
      setPreferences(defaults);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      {/* ── Header ─────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
          ]}
        >
          Notifications
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Master toggle ────────────────────────── */}
        <View
          style={[
            styles.masterCard,
            {
              backgroundColor: colors.background.card,
              borderColor: masterEnabled ? brandColor : colors.border.default,
            },
          ]}
        >
          <View
            style={[
              styles.masterIcon,
              {
                backgroundColor: masterEnabled
                  ? brandColor
                  : colors.background.elevated,
              },
            ]}
          >
            <MaterialIcons
              name={masterEnabled ? 'notifications-active' : 'notifications-off'}
              size={24}
              color={masterEnabled ? '#ffffff' : colors.text.disabled}
            />
          </View>
          <View style={styles.masterText}>
            <Text
              style={[
                styles.masterTitle,
                { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
              ]}
            >
              Push Notifications
            </Text>
            <Text
              style={[
                styles.masterSubtitle,
                { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {masterEnabled
                ? 'You will receive notifications'
                : 'All notifications are turned off'}
            </Text>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={toggleMaster}
            trackColor={{
              false: colors.border.default,
              true: brandColor,
            }}
            thumbColor="#ffffff"
          />
        </View>

        {/* ── Info text ────────────────────────────── */}
        <Text
          style={[
            styles.infoText,
            { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Choose which notifications you'd like to receive. You can change these at any time.
        </Text>

        {/* ── Category toggles ─────────────────────── */}
        <View
          style={[
            styles.categoriesCard,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          {NOTIFICATION_CATEGORIES.map((category, index) => {
            const isEnabled = preferences[category.id] ?? false;
            const isLast = index === NOTIFICATION_CATEGORIES.length - 1;

            return (
              <View key={category.id}>
                <View style={styles.categoryRow}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: isEnabled && masterEnabled
                          ? brandColor + '15'
                          : colors.background.elevated,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={20}
                      color={
                        isEnabled && masterEnabled
                          ? brandColor
                          : colors.text.disabled
                      }
                    />
                  </View>

                  <View style={styles.categoryText}>
                    <Text
                      style={[
                        styles.categoryTitle,
                        {
                          color: masterEnabled
                            ? colors.text.primary
                            : colors.text.disabled,
                          fontFamily: 'Inter_600SemiBold',
                        },
                      ]}
                    >
                      {category.title}
                    </Text>
                    <Text
                      style={[
                        styles.categoryDescription,
                        {
                          color: masterEnabled
                            ? colors.text.faint
                            : colors.text.disabled,
                          fontFamily: 'Inter_400Regular',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {category.description}
                    </Text>
                  </View>

                  <Switch
                    value={isEnabled && masterEnabled}
                    onValueChange={() => toggleCategory(category.id)}
                    disabled={!masterEnabled}
                    trackColor={{
                      false: colors.border.default,
                      true: brandColor,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.border.subtle },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* ── Footer note ──────────────────────────── */}
        <View style={styles.footerNote}>
          <MaterialIcons name="info-outline" size={14} color={colors.text.disabled} />
          <Text
            style={[
              styles.footerText,
              { color: colors.text.disabled, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Order updates cannot be fully turned off — critical delivery notifications will always be sent.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: 16 },

  // Master toggle card
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  masterText: {
    flex: 1,
    gap: 2,
  },
  masterTitle: {
    fontSize: 16,
  },
  masterSubtitle: {
    fontSize: 12,
  },

  // Info
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Categories card
  categoriesCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
    fontSize: 14,
  },
  categoryDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },

  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  bottomPad: { height: 32 },
});