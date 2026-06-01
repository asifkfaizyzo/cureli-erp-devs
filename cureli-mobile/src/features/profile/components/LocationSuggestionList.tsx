// src/features/profile/components/LocationSuggestionList.tsx
//
// Scrollable list of place suggestions below the search bar.
// Each row shows main_text (bold) + secondary_text (muted).

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { PlaceSuggestion } from '../api/places.api';

interface LocationSuggestionListProps {
  suggestions: PlaceSuggestion[];
  onSelect: (suggestion: PlaceSuggestion) => void;
  isLoadingDetails: boolean;
  selectedPlaceId: string | null;
  searchError: string | null;
}

export function LocationSuggestionList({
  suggestions,
  onSelect,
  isLoadingDetails,
  selectedPlaceId,
  searchError,
}: LocationSuggestionListProps) {
  const { colors } = useTheme();

  if (searchError) {
    return (
      <View style={styles.messageRow}>
        <MaterialIcons
          name="error-outline"
          size={16}
          color={colors.status.error}
        />
        <Text
          style={[
            styles.messageText,
            { color: colors.status.error, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {searchError}
        </Text>
      </View>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      style={[
        styles.list,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {suggestions.map((suggestion, index) => {
        const isSelected = suggestion.place_id === selectedPlaceId;
        const isLoadingThis = isSelected && isLoadingDetails;

        return (
          <React.Fragment key={suggestion.place_id}>
            <TouchableOpacity
              style={[
                styles.row,
                isSelected && {
                  backgroundColor: colors.background.tint,
                },
              ]}
              onPress={() => onSelect(suggestion)}
              activeOpacity={0.7}
              disabled={isLoadingDetails}
            >
              {/* Pin icon */}
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <MaterialIcons
                  name="location-on"
                  size={18}
                  color={colors.brand.accent}
                />
              </View>

              {/* Text */}
              <View style={styles.textBlock}>
                <Text
                  style={[
                    styles.mainText,
                    {
                      color: colors.text.primary,
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {suggestion.main_text}
                </Text>
                {suggestion.secondary_text ? (
                  <Text
                    style={[
                      styles.secondaryText,
                      {
                        color: colors.text.muted,
                        fontFamily: 'Inter_400Regular',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {suggestion.secondary_text}
                  </Text>
                ) : null}
              </View>

              {/* Loader if fetching details for this row */}
              {isLoadingThis && (
                <ActivityIndicator
                  size={14}
                  color={colors.brand.accent}
                  style={styles.rowLoader}
                />
              )}
            </TouchableOpacity>

            {/* Separator — skip after last item */}
            {index < suggestions.length - 1 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.border.subtle },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 240,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontSize: 14,
  },
  secondaryText: {
    fontSize: 12,
  },
  rowLoader: {
    marginLeft: 4,
  },
  separator: {
    height: 1,
    marginLeft: 54,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  messageText: {
    fontSize: 13,
    flex: 1,
  },
});