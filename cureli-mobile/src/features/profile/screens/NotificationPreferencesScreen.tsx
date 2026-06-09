// src/features/profile/screens/NotificationPreferencesScreen.tsx
// Full replacement — wires existing UI to the real store

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import {
  useNotificationPreferencesStore,
} from '../../../store/notificationPreferencesStore';
import {
  PUSH_CATEGORY_META,
  PUSH_CATEGORIES,
  type PushCategory,
} from '../../../constants/pushCategories';

// ── Category config for the UI ────────────────────────────────────────────────
// Maps store keys to MaterialIcons icon names

const CATEGORY_ICONS: Record<PushCategory, keyof typeof MaterialIcons.glyphMap> = {
  [PUSH_CATEGORIES.ORDER_UPDATES]:        'local-shipping',
  [PUSH_CATEGORIES.PROMOTIONS]:           'local-offer',
  [PUSH_CATEGORIES.PRESCRIPTION_UPDATES]: 'event-repeat',
  [PUSH_CATEGORIES.SYSTEM_MESSAGES]:      'campaign',
  [PUSH_CATEGORIES.CART_ABANDONMENT]:     'shopping-cart',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationPreferencesScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    setMasterEnabled,
  } = useNotificationPreferencesStore();

  const handleCategoryToggle = useCallback(
    (category: PushCategory) => {
      const meta = PUSH_CATEGORY_META[category];
      // order_updates cannot be disabled — canDisable: false
      if (!meta.canDisable) return;

      const currentValue = preferences[category];
      updatePreference(category, !currentValue);
    },
    [preferences, updatePreference],
  );

  const handleMasterToggle = useCallback(
    (value: boolean) => {
      setMasterEnabled(value);
    },
    [setMasterEnabled],
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.default }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
            Notifications
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  const masterEnabled = preferences.master_enabled;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:   colors.background.card,
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
        {/* Saving indicator */}
        <View style={styles.headerRight}>
          {isSaving && (
            <ActivityIndicator size="small" color={brandColor} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Master toggle */}
        <View
          style={[
            styles.masterCard,
            {
              backgroundColor: colors.background.card,
              borderColor:     masterEnabled ? brandColor : colors.border.default,
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
            onValueChange={handleMasterToggle}
            disabled={isSaving}
            trackColor={{
              false: colors.border.default,
              true:  brandColor,
            }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Info text */}
        <Text
          style={[
            styles.infoText,
            { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Choose which notifications you'd like to receive. You can change these at any time.
        </Text>

        {/* Category toggles */}
        <View
          style={[
            styles.categoriesCard,
            {
              backgroundColor: colors.background.card,
              borderColor:     colors.border.default,
            },
          ]}
        >
          {(Object.values(PUSH_CATEGORIES) as PushCategory[]).map(
            (category, index, arr) => {
              const meta      = PUSH_CATEGORY_META[category];
              const icon      = CATEGORY_ICONS[category];
              const isEnabled = preferences[category] ?? true;
              const isLast    = index === arr.length - 1;
              // order_updates is always on — cannot be toggled
              const isForced  = !meta.canDisable;

              return (
                <View key={category}>
                  <View style={styles.categoryRow}>
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor:
                            isEnabled && masterEnabled
                              ? brandColor + '15'
                              : colors.background.elevated,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={icon}
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
                            color:      masterEnabled
                              ? colors.text.primary
                              : colors.text.disabled,
                            fontFamily: 'Inter_600SemiBold',
                          },
                        ]}
                      >
                        {meta.title}
                        {isForced && (
                          <Text
                            style={[
                              styles.requiredLabel,
                              { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
                            ]}
                          >
                            {' '}(required)
                          </Text>
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.categoryDescription,
                          {
                            color:      masterEnabled
                              ? colors.text.faint
                              : colors.text.disabled,
                            fontFamily: 'Inter_400Regular',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {meta.description}
                      </Text>
                    </View>

                    <Switch
                      value={(isEnabled || isForced) && masterEnabled}
                      onValueChange={() => handleCategoryToggle(category)}
                      disabled={!masterEnabled || isForced || isSaving}
                      trackColor={{
                        false: colors.border.default,
                        true:  brandColor,
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
            },
          )}
        </View>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <MaterialIcons name="info-outline" size={14} color={colors.text.disabled} />
          <Text
            style={[
              styles.footerText,
              { color: colors.text.disabled, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Order updates cannot be turned off — critical delivery notifications will always be sent.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
  },
  backButton:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36, alignItems: 'flex-end', justifyContent: 'center' },

  scroll:  { flex: 1 },
  content: { padding: 16 },

  masterCard: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    padding:           16,
    borderRadius:      14,
    borderWidth:       1.5,
    marginBottom:      12,
  },
  masterIcon: {
    width:          48,
    height:         48,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  masterText:     { flex: 1, gap: 2 },
  masterTitle:    { fontSize: 16 },
  masterSubtitle: { fontSize: 12 },

  infoText: {
    fontSize:      13,
    lineHeight:    19,
    marginBottom:  16,
    paddingHorizontal: 4,
  },

  categoriesCard: {
    borderRadius:  14,
    borderWidth:   1,
    overflow:      'hidden',
    marginBottom:  16,
  },
  categoryRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
  },
  categoryIcon: {
    width:          40,
    height:         40,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  categoryText:        { flex: 1, gap: 2 },
  categoryTitle:       { fontSize: 14 },
  requiredLabel:       { fontSize: 11 },
  categoryDescription: { fontSize: 12, lineHeight: 17 },
  separator:           { height: 1, marginLeft: 68 },

  footerNote: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
    paddingHorizontal: 4,
  },
  footerText: { flex: 1, fontSize: 12, lineHeight: 17 },
  bottomPad:  { height: 32 },
});