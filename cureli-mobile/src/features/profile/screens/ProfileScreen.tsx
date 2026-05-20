// src/features/profile/screens/ProfileScreen.tsx

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileSection } from '../components/ProfileSection';
import { ProfileMenuItem } from '../components/ProfileMenuItem';
import { AddressCard } from '../components/AddressCard';
import { EmptyAddressState } from '../components/EmptyAddressState';
import { LogoutButton } from '../components/LogoutButton';

import { useProfile } from '../hooks/useProfile';
import { useAddresses } from '../hooks/useAddresses';
import { profileApi, extractErrorMessage } from '../api/profile.api';
import { QUERY_KEYS } from '../constants/profile.constants';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../theme/ThemeContext';
import { useDialog } from '../../../components/Dialog/DialogProvider';

export function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { confirm, alert } = useDialog();
  const queryClient = useQueryClient();
  const {
    user,
    isLoading: profileLoading,
    isFetching,
    isError: profileError,
    refetch,
  } = useProfile();
  const { addresses, isLoading: addressesLoading } = useAddresses();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const logout = useAuthStore((state) => state.logout);
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  // ── Address handlers ──────────────────────────────────────

  const handleEditAddress = (id: string) => {
    router.push(`/profile/address/${id}`);
  };

  const handleDeleteAddress = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remove address',
      message: 'Are you sure you want to remove this address?',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      destructive: true,
      icon: 'delete-outline',
    });

    if (!confirmed) return;

    setDeletingId(id);
    try {
      await profileApi.deleteAddress(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });
    } catch (error) {
      await alert({
        title: 'Error',
        message: extractErrorMessage(error),
        confirmLabel: 'OK',
        icon: 'error-outline',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await profileApi.setDefaultAddress(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });
    } catch (error) {
      await alert({
        title: 'Error',
        message: extractErrorMessage(error),
        confirmLabel: 'OK',
        icon: 'error-outline',
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = await confirm({
      title: 'Log out of all devices',
      message:
        'This will end all active sessions across every device. You will need to log in again on this device.',
      confirmLabel: 'Log out everywhere',
      cancelLabel: 'Cancel',
      destructive: true,
      icon: 'devices',
    });

    if (!confirmed) return;

    try {
      await profileApi.logoutAllDevices();
    } catch {
      // Clear locally even if API fails
    }
    await logout();
    router.replace('/(auth)/login');
  };

  // ── Loading ───────────────────────────────────────────────

  if (profileLoading && !user) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────

  if (profileError && !user) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View style={styles.centered}>
          <MaterialIcons name="wifi-off" size={48} color={colors.text.disabled} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Couldn't load profile
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.text.faint }]}>
            Check your connection and try again
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: brandColor }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main ──────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader user={user} isFetching={isFetching} />

        {/* Addresses section header */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.muted, fontFamily: 'Inter_700Bold' },
            ]}
          >
            SAVED ADDRESSES
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/profile/addresses')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.sectionAction,
                { color: brandColor, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              Manage all
            </Text>
          </TouchableOpacity>
        </View>

        {addressesLoading ? (
          <View style={styles.addressLoadingWrapper}>
            <ActivityIndicator size="small" color={brandColor} />
          </View>
        ) : addresses.length === 0 ? (
          <EmptyAddressState />
        ) : (
          <>
            {addresses.slice(0, 2).map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefault}
                isDeleting={deletingId === address.id}
                isSettingDefault={settingDefaultId === address.id}
              />
            ))}
            {addresses.length > 2 && (
              <TouchableOpacity
                style={styles.viewAllAddresses}
                onPress={() => router.push('/profile/addresses')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.viewAllText,
                    { color: brandColor, fontFamily: 'Inter_600SemiBold' },
                  ]}
                >
                  View all {addresses.length} addresses
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={brandColor} />
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.spacer} />

        {/* Account section */}
        <ProfileSection title="Account">
          <ProfileMenuItem
            icon="devices"
            label="Log out of all devices"
            onPress={handleLogoutAll}
            destructive
            showSeparator
          />
          <ProfileMenuItem
            icon="settings"
            label="App Settings"
            onPress={() => router.push('/profile/settings')}
            showSeparator
          />
          <ProfileMenuItem
            icon="privacy-tip"
            label="Privacy Policy"
            onPress={() => {}}
            showSeparator
          />
          <ProfileMenuItem
            icon="description"
            label="Terms of Service"
            onPress={() => {}}
            showSeparator
          />
          <ProfileMenuItem
            icon="support-agent"
            label="Contact Support"
            onPress={() => {}}
            showSeparator={false}
          />
        </ProfileSection>

        {/* Danger zone */}
        <ProfileSection title="Danger Zone">
          <ProfileMenuItem
            icon="delete-forever"
            label="Delete Account"
            onPress={() => router.push('/profile/delete-account')}
            destructive
            showSeparator={false}
          />
        </ProfileSection>

        <Text
          style={[
            styles.version,
            { color: colors.text.disabled, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Cureli v1.0.0
        </Text>

        <LogoutButton />
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  errorTitle: {
    fontSize: 17,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 13,
  },
  addressLoadingWrapper: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  viewAllAddresses: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  viewAllText: { fontSize: 13 },
  spacer: { height: 24 },
  version: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 16,
  },
  bottomPad: { height: 32 },
});