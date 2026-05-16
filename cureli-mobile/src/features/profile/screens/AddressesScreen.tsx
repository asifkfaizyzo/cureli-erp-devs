// src/features/profile/screens/AddressesScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAddresses } from '../hooks/useAddresses';
import { useAddressMutations } from '../hooks/useAddressMutations';
import { AddressCard } from '../components/AddressCard';
import { EmptyAddressState } from '../components/EmptyAddressState';
import { extractErrorMessage } from '../api/profile.api';
import { useTheme } from '../../../theme/ThemeContext';
import { useDialog } from '../../../components/Dialog/DialogProvider';
import type { Address } from '../types/profile.types';

export function AddressesScreen() {
  const { colors, isDark } = useTheme();
  const { confirm, alert } = useDialog();
  const { addresses, isLoading, isError, refetch } = useAddresses();
  const { deleteAddress, setDefaultAddress } = useAddressMutations();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const handleEdit = (id: string) => router.push(`/profile/address/${id}`);

  const handleDelete = async (id: string) => {
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
      await deleteAddress(id);
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
      await setDefaultAddress(id);
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

  const Header = () => (
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
      <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
        Saved Addresses
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.background.tint }]}
        onPress={() => router.push('/profile/address/new')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={22} color={brandColor} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <MaterialIcons name="wifi-off" size={48} color={colors.text.disabled} />
          <Text style={[styles.errorTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
            Couldn't load addresses
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: brandColor }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { fontFamily: 'Inter_600SemiBold' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top']}>
      <Header />
      <FlatList
        data={addresses}
        keyExtractor={(item: Address) => item.id}
        contentContainerStyle={
          addresses.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyAddressState onAddPress={() => router.push('/profile/address/new')} />
        }
        ListFooterComponent={
          addresses.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.addAddressRow,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.default,
                },
              ]}
              onPress={() => router.push('/profile/address/new')}
              activeOpacity={0.7}
            >
              <View style={[styles.addAddressIcon, { backgroundColor: colors.background.tint }]}>
                <MaterialIcons name="add" size={20} color={brandColor} />
              </View>
              <Text style={[styles.addAddressText, { color: brandColor, fontFamily: 'Inter_600SemiBold' }]}>
                Add new address
              </Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }: { item: Address }) => (
          <AddressCard
            address={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
            isDeleting={deletingId === item.id}
            isSettingDefault={settingDefaultId === item.id}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  addButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  errorTitle: { fontSize: 17 },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryText: { fontSize: 14, color: '#ffffff' },
  listContent: { paddingTop: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  addAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: { fontSize: 14 },
});