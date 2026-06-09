// src/features/marketplace/components/GradientHeader.tsx

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { useTheme } from '../../../theme/ThemeContext';
import { HEADER_HEIGHT } from '../constants/marketplace.constants';

import { SearchBar } from './SearchBar';
import { CartButton } from './CartButton';
import { AddressDropdown } from './AddressDropdown';
import { useDeliveryLocation } from '../../../hooks/useDeliveryLocation';
import { useState } from 'react';

// ── Constants ────────────────────────────────────────────────

const GRADIENT_COLORS: [string, string] = ['#05015A', '#a291f8'];

// The white-on-dark logo — cureliwhitenew.png has the icon only,
// cureliwhitewithtext.png has icon + text if you prefer a single image.
// We use the icon-only asset here and render the wordmark ourselves
// so Amulya is guaranteed to match any future brand updates.
const LOGO = require('../../../../assets/images/cureliwhitenew.png');

// ── Props ─────────────────────────────────────────────────────

interface GradientHeaderProps {
  onPressSearch?: () => void;
  onPressCart?: () => void;
}

// ── Subcomponent: location pill ───────────────────────────────
// Extracted so it can be memoised independently from dropdown state.

interface LocationPillProps {
  isResolving: boolean;
  hasLocation: boolean;
  area: string;
  addressLine: string;
  source: string;
  dropdownVisible: boolean;
  onPress: () => void;
}

const LocationPill = React.memo(function LocationPill({
  isResolving,
  hasLocation,
  area,
  addressLine,
  source,
  dropdownVisible,
  onPress,
}: LocationPillProps) {
  const locationIcon =
    source === 'gps'
      ? 'navigate'
      : source === 'saved'
        ? 'location'
        : 'location-outline';

  // Use theme status colours instead of hardcoded hex
  const iconColor =
    source === 'gps'
      ? '#4ade80'                    // status.success — GPS active
      : source === 'saved'
        ? '#c9b7ff'                  // status.warning — saved address
        : 'rgba(255,255,255,0.60)';  // fallback / unset

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
    style={styles.locationPill}
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
          <ActivityIndicator size={11} color="rgba(255,255,255,0.75)" />
        ) : (
          <Ionicons name={locationIcon} size={14} color={iconColor} />
        )}

        <Text style={styles.locationAreaText} numberOfLines={1}>
          {areaLabel}
        </Text>

        <Ionicons
          name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
          size={11}
          color="rgba(255,255,255,0.55)"
        />
      </View>

      {/* Address line below */}
      <Text style={styles.locationLineText} numberOfLines={1}>
        {lineLabel}
      </Text>
    </View>
  </TouchableOpacity>
);

});

// ── Main component ────────────────────────────────────────────

function GradientHeaderBase({ onPressSearch, onPressCart }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
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

  return (
    <>
      <LinearGradient
        colors={GRADIENT_COLORS}
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
        {/* ── Top row: logo + wordmark | location pill ── */}
        <View style={styles.topRow}>

          {/* Left: logo image + Amulya wordmark */}
          <View style={styles.brand}>
            <Image
              source={LOGO}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Cureli logo"
            />
            <Text style={styles.wordmark}>Cureli</Text>
          </View>

          {/* Right: location pill */}
          <LocationPill
            isResolving={isResolving}
            hasLocation={hasLocation}
            area={location.area}
            addressLine={location.addressLine}
            source={location.source}
            dropdownVisible={dropdownVisible}
            onPress={toggleDropdown}
          />
        </View>

        {/* ── Bottom row: search + cart ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar onPress={onPressSearch} variant="header" />
          </View>
          <CartButton onPress={onPressCart} />
        </View>
      </LinearGradient>

      {/* Dropdown renders outside the gradient so it overlays page content */}
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

  // ── Top row ─────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },

  // ── Brand (left) ─────────────────────────────────────────────
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
    fontSize: 30,
  lineHeight: 34,
  letterSpacing: -0.3,
fontWeight: '800',

    color: '#ffffff',
  },

  // ── Location pill (right) ────────────────────────────────────
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '40%',             // never crowd the logo
  },
  locationIconWrap: {
    width: 22,
    alignItems: 'center',
    flexShrink: 0,
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
    color: 'rgba(255,255,255,0.95)',
    flexShrink: 1,
    textAlign: 'right',

    
  },
  locationLineText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',

  },

  // ── Search row ───────────────────────────────────────────────
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