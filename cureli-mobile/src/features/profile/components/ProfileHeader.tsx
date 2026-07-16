// src/features/profile/components/ProfileHeader.tsx

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
import { useTheme } from '../../../theme/ThemeContext';
import type { MobileUser, UserSex } from '../../../types/auth';

interface ProfileHeaderProps {
  user: MobileUser | null;
  isFetching: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

function getInitials(name: string | null, phone: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }
  return phone.slice(-2);
}

const SEX_LABEL: Record<UserSex, string> = {
  MALE:   'Male',
  FEMALE: 'Female',
  OTHER:  'Other',
};

function computeAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

// ── Component ─────────────────────────────────────────────────

export function ProfileHeader({ user, isFetching }: ProfileHeaderProps) {
  const { colors, isDark } = useTheme();

  const hasName  = user?.full_name && user.full_name.trim().length > 0;
  const hasEmail = user?.email && user.email.trim().length > 0;
  const initials = user ? getInitials(user.full_name, user.phone) : '??';

  // Build the age + sex summary line
  const ageSexParts: string[] = [];
  if (user?.sex)           ageSexParts.push(SEX_LABEL[user.sex]);
  if (user?.date_of_birth) ageSexParts.push(`${computeAge(user.date_of_birth)} yrs`);
  const ageSexLine = ageSexParts.join(' · ');

  const avatarBg       = isDark ? colors.brand.accent : colors.brand.primary;
  const avatarRingColor = isDark ? colors.brand.soft   : colors.brand.primary;
  const editBtnBg      = !hasName ? avatarBg : colors.background.card;
  const editBtnBorder  = avatarRingColor;
  const editIconColor  = !hasName ? '#ffffff' : avatarBg;
  const editTextColor  = !hasName ? '#ffffff' : avatarBg;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.page }]}
    >
      {/* Avatar */}
      <View style={[styles.avatarRing, { borderColor: avatarRingColor }]}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        {isFetching && (
          <View
            style={[
              styles.fetchingBadge,
              {
                backgroundColor: colors.brand.secondary,
                borderColor:     colors.background.page,
              },
            ]}
          >
            <ActivityIndicator size={10} color="#ffffff" />
          </View>
        )}
      </View>

      {/* Name */}
      {hasName ? (
        <Text style={[styles.name, { color: colors.text.primary }]}>
          {user!.full_name}
        </Text>
      ) : (
        <Text style={[styles.namePlaceholder, { color: colors.text.faint }]}>
          Complete your profile
        </Text>
      )}

      {/* Age + Sex pill — only shown when both exist */}
      {ageSexLine ? (
        <View
          style={[
            styles.ageSexPill,
            {
              backgroundColor: colors.background.tint,
              borderColor:     colors.border.subtle,
            },
          ]}
        >
          <MaterialIcons name="person" size={12} color={colors.text.faint} />
          <Text style={[styles.ageSexText, { color: colors.text.muted }]}>
            {ageSexLine}
          </Text>
        </View>
      ) : null}

      {/* Email */}
      {!hasEmail ? (
        <TouchableOpacity
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.7}
        >
          <Text style={[styles.emailPrompt, { color: colors.brand.accent }]}>
            + Add email address
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.email, { color: colors.text.muted }]}>
          {user!.email}
        </Text>
      )}

      {/* Phone */}
      <View style={styles.phoneRow}>
        <Text style={[styles.phone, { color: colors.text.muted }]}>
          {user?.phone ?? '—'}
        </Text>
        {user?.phone_verified && (
          <View
            style={[
              styles.verifiedBadge,
              {
                backgroundColor: colors.status.successBg,
                borderColor:     colors.status.successBorder,
              },
            ]}
          >
            <MaterialIcons name="verified" size={12} color={colors.status.success} />
            <Text style={[styles.verifiedText, { color: colors.status.success }]}>
              Verified
            </Text>
          </View>
        )}
      </View>

      {/* Edit button */}
      <TouchableOpacity
        style={[
          styles.editButton,
          {
            backgroundColor: editBtnBg,
            borderColor:     editBtnBorder,
          },
        ]}
        onPress={() => router.push('/profile/edit')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="edit" size={15} color={editIconColor} />
        <Text style={[styles.editButtonText, { color: editTextColor }]}>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  namePlaceholder: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  // ── Age + Sex pill ────────────────────────────────────────
  ageSexPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: 2,
  },
  ageSexText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  // ─────────────────────────────────────────────────────────
  email: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  emailPrompt: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
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
    fontFamily: 'Inter_500Medium',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  editButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});