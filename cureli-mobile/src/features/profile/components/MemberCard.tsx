// src/features/profile/components/MemberCard.tsx

import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { FamilyMember } from '../../../types/members';
import type { UserSex } from '../../../types/auth';

// ── Helpers ───────────────────────────────────────────────────

const SEX_LABEL: Record<UserSex, string> = {
  MALE:   'Male',
  FEMALE: 'Female',
  OTHER:  'Other',
};

const SEX_ICON: Record<UserSex, string> = {
  MALE:   'male',
  FEMALE: 'female',
  OTHER:  'transgender',
};

interface MemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function MemberCard({
  member,
  onEdit,
  onDelete,
  isDeleting,
}: MemberCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* Left: avatar + info */}
      <View style={styles.left}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <MaterialIcons
            name={SEX_ICON[member.sex] as any}
            size={22}
            color={brandColor}
          />
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.name, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {member.name}
          </Text>
          <Text style={[styles.meta, { color: colors.text.muted }]}>
            {SEX_LABEL[member.sex]} · {member.age} yrs
          </Text>
          {member.phone ? (
            <Text style={[styles.phone, { color: colors.text.faint }]}>
              {member.phone}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Right: actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.background.tint }]}
          onPress={() => onEdit(member)}
          disabled={isDeleting}
          activeOpacity={0.7}
          accessibilityLabel={`Edit ${member.name}`}
        >
          <MaterialIcons name="edit" size={16} color={brandColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: colors.status.errorBg },
          ]}
          onPress={() => onDelete(member.id)}
          disabled={isDeleting}
          activeOpacity={0.7}
          accessibilityLabel={`Delete ${member.name}`}
        >
          {isDeleting ? (
            <ActivityIndicator size={14} color={colors.status.error} />
          ) : (
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={colors.status.error}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  phone: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});