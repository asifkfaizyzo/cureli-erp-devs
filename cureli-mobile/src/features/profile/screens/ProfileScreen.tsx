// src/features/profile/screens/ProfileScreen.tsx
//
// Phase 1A — main profile screen.
// Assembles ProfileHeader, address section, account section, and logout.

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
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

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const { user, isLoading: profileLoading, isFetching, isError: profileError, refetch } = useProfile();
  const { addresses, isLoading: addressesLoading } = useAddresses();

  // Track which address action is in-flight
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // ── Address handlers ─────────────────────────────────────

  const handleEditAddress = (id: string) => {
    router.push(`/profile/address/${id}`);
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Remove address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await profileApi.deleteAddress(id);
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });
            } catch (error) {
              Alert.alert('Error', extractErrorMessage(error));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await profileApi.setDefaultAddress(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });
    } catch (error) {
      Alert.alert('Error', extractErrorMessage(error));
    } finally {
      setSettingDefaultId(null);
    }
  };

  // ── Logout all devices handler ────────────────────────────

  const logout = useAuthStore((state) => state.logout);

  const handleLogoutAll = () => {
    Alert.alert(
      'Log out of all devices',
      'This will end all active sessions across every device. You will need to log in again on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileApi.logoutAllDevices();
            } catch {
              // Even if the API call fails, we clear locally
            }
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true },
    );
  };

  // ── Loading state ─────────────────────────────────────────

  if (profileLoading && !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#05015A" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ───────────────────────────────────────────

  if (profileError && !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <MaterialIcons name="wifi-off" size={48} color="#cbd5e1" />
          <Text style={styles.errorTitle}>Couldn't load profile</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <ProfileHeader user={user} isFetching={isFetching} />

        {/* Saved Addresses section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
          <TouchableOpacity
            onPress={() => router.push('/profile/addresses')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionAction}>Manage all</Text>
          </TouchableOpacity>
        </View>

        {addressesLoading ? (
          <View style={styles.addressLoadingWrapper}>
            <ActivityIndicator size="small" color="#05015A" />
          </View>
        ) : addresses.length === 0 ? (
          <EmptyAddressState />
        ) : (
          <>
            {/* Show up to 2 addresses on the profile screen */}
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
                <Text style={styles.viewAllText}>
                  View all {addresses.length} addresses
                </Text>
                <MaterialIcons name="chevron-right" size={16} color="#05015A" />
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

        {/* App version */}
        <Text style={styles.version}>Cureli v1.0.0</Text>

        {/* Logout button */}
        <LogoutButton />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 11,
    backgroundColor: '#05015A',
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
    letterSpacing: 1,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#05015A',
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
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#05015A',
  },
  spacer: {
    height: 24,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  bottomPad: {
    height: 32,
  },
});