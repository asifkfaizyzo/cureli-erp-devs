// src/features/profile/components/LogoutButton.tsx

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../theme/ThemeContext';
import { useDialog } from '../../../components/Dialog/DialogProvider';

export function LogoutButton() {
  const { colors } = useTheme();
  const { confirm } = useDialog();
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Log out',
      message: 'Are you sure you want to log out of this device?',
      confirmLabel: 'Log out',
      cancelLabel: 'Cancel',
      destructive: true,
      icon: 'logout',
    });

    if (!confirmed) return;

    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            borderColor: colors.status.errorBorder,
            backgroundColor: colors.status.errorBg,
          },
          isLoggingOut && styles.buttonDisabled,
        ]}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        {isLoggingOut ? (
          <ActivityIndicator size={18} color={colors.status.error} />
        ) : (
          <MaterialIcons name="logout" size={18} color={colors.status.error} />
        )}
        <Text
          style={[
            styles.text,
            { color: colors.status.error, fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
  },
});