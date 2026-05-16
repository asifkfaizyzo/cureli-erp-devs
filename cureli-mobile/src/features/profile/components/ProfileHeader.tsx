// src/features/profile/components/ProfileHeader.tsx
//
// Displays user avatar (initials), name, phone, and edit button.
// Phone is display-only — no edit affordance near it.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { MobileUser } from '../../../types/auth';

interface ProfileHeaderProps {
  user: MobileUser | null;
  isFetching: boolean;
}

function getInitials(name: string | null, phone: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }
  // Fall back to last 2 digits of phone
  return phone.slice(-2);
}

export function ProfileHeader({ user, isFetching }: ProfileHeaderProps) {
  const hasName = user?.full_name && user.full_name.trim().length > 0;
  const hasEmail = user?.email && user.email.trim().length > 0;
  const initials = user ? getInitials(user.full_name, user.phone) : '??';

  const handleEditPress = () => {
    router.push('/profile/edit');
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        {/* Subtle fetching indicator on the avatar */}
        {isFetching && (
          <View style={styles.fetchingBadge}>
            <ActivityIndicator size={10} color="#ffffff" />
          </View>
        )}
      </View>

      {/* Name */}
      {hasName ? (
        <Text style={styles.name}>{user!.full_name}</Text>
      ) : (
        <Text style={styles.namePlaceholder}>Complete your profile</Text>
      )}

      {/* Email prompt */}
      {!hasEmail && (
        <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
          <Text style={styles.emailPrompt}>+ Add email address</Text>
        </TouchableOpacity>
      )}
      {hasEmail && (
        <Text style={styles.email}>{user!.email}</Text>
      )}

      {/* Phone — display only with verified badge */}
      <View style={styles.phoneRow}>
        <Text style={styles.phone}>{user?.phone ?? '—'}</Text>
        {user?.phone_verified && (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={12} color="#22c55e" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Edit button */}
      <TouchableOpacity
        style={[styles.editButton, !hasName && styles.editButtonProminent]}
        onPress={handleEditPress}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name="edit"
          size={15}
          color={!hasName ? '#ffffff' : '#05015A'}
        />
        <Text
          style={[
            styles.editButtonText,
            !hasName && styles.editButtonTextProminent,
          ]}
        >
          Edit Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#05015A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#05015A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  fetchingBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a0280',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  namePlaceholder: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  emailPrompt: {
    fontSize: 13,
    color: '#0a0280',
    fontWeight: '500',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  phone: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#05015A',
    backgroundColor: '#ffffff',
  },
  editButtonProminent: {
    backgroundColor: '#05015A',
    borderColor: '#05015A',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#05015A',
  },
  editButtonTextProminent: {
    color: '#ffffff',
  },
});