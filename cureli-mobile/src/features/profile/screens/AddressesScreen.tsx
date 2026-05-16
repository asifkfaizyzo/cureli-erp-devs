// src/features/profile/screens/AddressesScreen.tsx
//
// Full address list with edit, delete, and set-default actions.
// Add new address navigates to /profile/address/new.

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAddresses } from '../hooks/useAddresses';
import { useAddressMutations } from '../hooks/useAddressMutations';
import { AddressCard } from '../components/AddressCard';
import { EmptyAddressState } from '../components/EmptyAddressState';
import { extractErrorMessage } from '../api/profile.api';
import type { Address } from '../types/profile.types';

export function AddressesScreen() {
  const { addresses, isLoading, isError, refetch } = useAddresses();
  const { deleteAddress, setDefaultAddress } = useAddressMutations();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    router.push(`/profile/address/${id}`);
  };

  const handleDelete = (id: string) => {
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
              await deleteAddress(id);
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
      await setDefaultAddress(id);
    } catch (error) {
      Alert.alert('Error', extractErrorMessage(error));
    } finally {
      setSettingDefaultId(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#05015A" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="wifi-off" size={48} color="#cbd5e1" />
          <Text style={styles.errorTitle}>Couldn't load addresses</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/profile/address/new')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={22} color="#05015A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item: Address) => item.id}
        contentContainerStyle={
          addresses.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyAddressState
            onAddPress={() => router.push('/profile/address/new')}
          />
        }
        ListFooterComponent={
          addresses.length > 0 ? (
            <TouchableOpacity
              style={styles.addAddressRow}
              onPress={() => router.push('/profile/address/new')}
              activeOpacity={0.7}
            >
              <View style={styles.addAddressIcon}>
                <MaterialIcons name="add" size={20} color="#05015A" />
              </View>
              <Text style={styles.addAddressText}>Add new address</Text>
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
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerRight: {
    width: 36,
  },
  addButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
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
  },
  retryButton: {
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
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  addAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#05015A',
  },
});