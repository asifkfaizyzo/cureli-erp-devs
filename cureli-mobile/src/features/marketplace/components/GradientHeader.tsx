// src/features/marketplace/components/GradientHeader.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '../../../theme/typography';

import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { useTheme } from '../../../theme/ThemeContext';
import { HEADER_HEIGHT } from '../constants/marketplace.constants';

import { SearchBar } from './SearchBar';
import { PrescriptionButton } from './PrescriptionButton';
import { CartButton } from './CartButton';
import { AddressDropdown } from './AddressDropdown';
import { useDeliveryLocation } from '../../../hooks/useDeliveryLocation';

// ── Constants ────────────────────────────────────────────────

const FADE_STRIP_HEIGHT = 28;

const LOGO = require('../../../../assets/images/cureliwhitenew.png');

// ── Props ─────────────────────────────────────────────────────

interface GradientHeaderProps {
  onPressSearch?: () => void;
  onPressPrescription?: () => void;
  onPressCart?: () => void;
}

// ── Subcomponent: location pill ───────────────────────────────

interface LocationPillProps {
  isResolving: boolean;
  hasLocation: boolean;
  area: string;
  addressLine: string;
  source: string;
  dropdownVisible: boolean;
  onPress: () => void;
  onGradientText: string;
  onGradientTextMuted: string;
  onGradientTextSubtle: string;
  pillBg: string;
  pillBorder: string;
  locationGps: string;
  locationSaved: string;
  locationNone: string;
}

const LocationPill = React.memo(function LocationPill({
  isResolving,
  hasLocation,
  area,
  addressLine,
  source,
  dropdownVisible,
  onPress,
  onGradientText,
  onGradientTextMuted,
  onGradientTextSubtle,
  pillBg,
  pillBorder,
  locationGps,
  locationSaved,
  locationNone,
}: LocationPillProps) {
  const locationIcon =
    source === 'gps'
      ? 'navigate'
      : source === 'saved'
        ? 'location'
        : 'location-outline';

  const iconColor =
    source === 'gps'
      ? locationGps
      : source === 'saved'
        ? locationSaved
        : locationNone;

  const areaLabel = isResolving
    ? 'Detecting location…'
    : hasLocation
      ? area
      : 'Set delivery location';

  const lineLabel = isResolving
    ? 'Please wait…'
    : hasLocation
      ? addressLine
      : 'Tap to set your address';

  return (
    <TouchableOpacity
      style={[
        styles.locationPill,
        {
          backgroundColor: pillBg,
          borderColor: pillBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={
        hasLocation
          ? `Delivering to ${area}. Tap to change.`
          : 'Set delivery location'
      }
      accessibilityState={{ expanded: dropdownVisible }}
    >
      <View style={styles.locationTextStack}>
        <View style={styles.locationAreaRow}>
          {isResolving ? (
            <ActivityIndicator size={11} color={onGradientTextMuted} />
          ) : (
            <Ionicons name={locationIcon} size={14} color={iconColor} />
          )}

          <Text
            style={[styles.locationAreaText, { color: onGradientText }]}
            numberOfLines={1}
          >
            {areaLabel}
          </Text>

          <Ionicons
            name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
            size={11}
            color={onGradientTextSubtle}
          />
        </View>

        <Text
          style={[styles.locationLineText, { color: onGradientTextSubtle }]}
          numberOfLines={1}
        >
          {lineLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ── Main component ────────────────────────────────────────────

function GradientHeaderBase({
  onPressSearch,
  onPressPrescription,
  onPressCart,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { location, isResolving } = useDeliveryLocation();

  const [dropdownVisible, setDropdownVisible] = useState(false);

  const hasLocation =
    location.source === 'gps' || location.source === 'saved';

  const toggleDropdown = useCallback(() => {
    setDropdownVisible((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownVisible(false);
  }, []);

  const h = colors.header;
  const gradientColors: [string, string] = [h.gradientFrom, h.gradientTo];

  return (
    <>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.gradient,
          {
            height: HEADER_HEIGHT + insets.top,
            paddingTop: insets.top,
          },
        ]}
      >
        {/* ── Top row ── */}
        <View style={styles.topRow}>
          <View style={styles.brand}>
            <Image
              source={LOGO}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Cureli logo"
            />
            <Text style={[styles.wordmark, { color: h.onGradientText }]}>
              Cureli
            </Text>
          </View>

          <LocationPill
            isResolving={isResolving}
            hasLocation={hasLocation}
            area={location.area}
            addressLine={location.addressLine}
            source={location.source}
            dropdownVisible={dropdownVisible}
            onPress={toggleDropdown}
            onGradientText={h.onGradientText}
            onGradientTextMuted={h.onGradientTextMuted}
            onGradientTextSubtle={h.onGradientTextSubtle}
            pillBg={h.pillBg}
            pillBorder={h.pillBorder}
            locationGps={h.locationGps}
            locationSaved={h.locationSaved}
            locationNone={h.locationNone}
          />
        </View>

        {/* ── Bottom row ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar onPress={onPressSearch} variant="header-tinted" />
          </View>

          <PrescriptionButton onPress={onPressPrescription} />
          {/* <CartButton onPress={onPressCart} /> */}
        </View>
      </LinearGradient>

      <View
        style={[
          styles.fadeStrip,
          {
            top: HEADER_HEIGHT + insets.top,
            height: FADE_STRIP_HEIGHT,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[h.gradientTo, colors.background.page]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fadeStripGradient}
        />
      </View>

      <AddressDropdown visible={dropdownVisible} onClose={closeDropdown} />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },

  fadeStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  fadeStripGradient: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  wordmark: {
    ...Typography.wordmark,
    fontSize: 40,
    lineHeight: Platform.OS === 'ios' ? 58 : 34,
    letterSpacing: -0.3,
    fontFamily:
      Platform.OS === 'ios'
        ? FontFamily.amulyaBold
        : FontFamily.amulya,
    ...(Platform.OS === 'android'
      ? { fontWeight: '800' as const }
      : {}),
  },

  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '40%',
  },
  locationTextStack: {
    flex: 1,
    gap: 1,
  },
  locationAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    justifyContent: 'flex-end',
  },
  locationAreaText: {
    ...Typography.smallMedium,
    flexShrink: 1,
    textAlign: 'right',
  },
  locationLineText: {
    ...Typography.caption,
    textAlign: 'right',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchFlex: {
    flex: 1,
  },
});

export { HEADER_HEIGHT };
export const GradientHeader = React.memo(GradientHeaderBase);