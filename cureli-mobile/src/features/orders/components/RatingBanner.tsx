// src/features/orders/components/RatingBanner.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';

interface RatingBannerProps {
  submitted: boolean;
  ratingValue: number | null;
  onEdit?: () => void;
  /** compact = single line (used inside OrderHistoryCard) */
  compact?: boolean;
}

export function RatingBanner({
  submitted,
  ratingValue,
  onEdit,
  compact = false,
}: RatingBannerProps) {
  const { colors } = useTheme();

  if (submitted) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.status.successBg, borderColor: colors.status.successBorder },
          compact && styles.compact,
        ]}
      >
        <View style={styles.left}>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < (ratingValue ?? 0) ? 'star' : 'star-outline'}
                size={compact ? 12 : 14}
                color="#f59e0b"
              />
            ))}
          </View>
          <Text
            style={[
              styles.label,
              { color: colors.status.success, fontFamily: 'Inter_500Medium' },
              compact && styles.labelCompact,
            ]}
          >
            Rating submitted. Thank you!
          </Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
            <Text
              style={[
                styles.editLabel,
                { color: colors.brand.primary, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.tint, borderColor: colors.border.default },
        compact && styles.compact,
      ]}
    >
      <View style={styles.left}>
        <Ionicons name="star-outline" size={compact ? 12 : 14} color={colors.text.muted} />
        <Text
          style={[
            styles.label,
            { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            compact && styles.labelCompact,
          ]}
        >
          Rate this order
        </Text>
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
          <Text
            style={[
              styles.editLabel,
              { color: colors.brand.primary, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Rate
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compact: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  label: {
    fontSize: 13,
  },
  labelCompact: {
    fontSize: 12,
  },
  editLabel: {
    fontSize: 13,
  },
});