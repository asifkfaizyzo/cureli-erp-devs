// src/features/profile/components/LocationSearchBar.tsx
//
// Search input for location picker.
// Shows spinner while searching, clear button when text is present.

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';

interface LocationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  isSearching: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function LocationSearchBar({
  value,
  onChangeText,
  onClear,
  isSearching,
  placeholder = 'Search for an area, street name...',
  autoFocus = true,
}: LocationSearchBarProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.input,
          borderColor: colors.border.input,
        },
      ]}
    >
      {/* Search icon */}
      <MaterialIcons
        name="search"
        size={20}
        color={colors.text.muted}
        style={styles.searchIcon}
      />

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            color: colors.text.primary,
            fontFamily: 'Inter_400Regular',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.faint}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never" // we handle this manually
      />

      {/* Right side — spinner or clear */}
      <View style={styles.rightSlot}>
        {isSearching ? (
          <ActivityIndicator size={16} color={colors.text.muted} />
        ) : value.length > 0 ? (
          <TouchableOpacity onPress={onClear} activeOpacity={0.7} hitSlop={8}>
            <MaterialIcons
              name="close"
              size={18}
              color={colors.text.muted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0, // remove default Android padding
  },
  rightSlot: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});