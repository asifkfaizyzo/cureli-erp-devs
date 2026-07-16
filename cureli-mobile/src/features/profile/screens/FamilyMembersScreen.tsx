// src/features/profile/screens/FamilyMembersScreen.tsx

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { useDialog } from '../../../components/Dialog/DialogProvider';
import { MemberCard } from '../components/MemberCard';
import { MemberFormSheet } from '../components/MemberFormSheet';
import {
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
} from '../hooks/useMembers';
import type { FamilyMember } from '../../../types/members';

export function FamilyMembersScreen() {
  const { colors, isDark } = useTheme();
  const { confirm, alert } = useDialog();

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const { members, isLoading, isError, refetch } = useMembers();

  // ── Sheet state ───────────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Mutations ─────────────────────────────────────────────

  const { mutate: createMember, isPending: isCreating } = useCreateMember({
    onSuccess: () => {
      setSheetVisible(false);
      setEditingMember(null);
    },
    onError: async (message) => {
      await alert({
        title: 'Error',
        message,
        confirmLabel: 'OK',
        icon: 'error-outline',
      });
    },
  });

  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember({
    onSuccess: () => {
      setSheetVisible(false);
      setEditingMember(null);
    },
    onError: async (message) => {
      await alert({
        title: 'Error',
        message,
        confirmLabel: 'OK',
        icon: 'error-outline',
      });
    },
  });

  const { mutate: deleteMember } = useDeleteMember({
    onError: async (message) => {
      setDeletingId(null);
      await alert({
        title: 'Error',
        message,
        confirmLabel: 'OK',
        icon: 'error-outline',
      });
    },
    onSuccess: () => {
      setDeletingId(null);
    },
  });

  // ── Handlers ──────────────────────────────────────────────

  const handleAddPress = useCallback(() => {
    setEditingMember(null);
    setSheetVisible(true);
  }, []);

  const handleEditPress = useCallback((member: FamilyMember) => {
    setEditingMember(member);
    setSheetVisible(true);
  }, []);

  const handleDeletePress = useCallback(
    async (id: string) => {
      const member = members.find((m) => m.id === id);
      const confirmed = await confirm({
        title: 'Remove member',
        message: `Remove ${member?.name ?? 'this member'} from your family list?`,
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        destructive: true,
        icon: 'delete-outline',
      });

      if (!confirmed) return;

      setDeletingId(id);
      deleteMember(id);
    },
    [members, confirm, deleteMember],
  );

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
    setEditingMember(null);
  }, []);

  const handleSheetSubmit = useCallback(
    (payload: any) => {
      if (editingMember) {
        updateMember({ id: editingMember.id, payload });
      } else {
        createMember(payload);
      }
    },
    [editingMember, createMember, updateMember],
  );

  const isSubmitting = isCreating || isUpdating;

  // ── Loading ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <ScreenHeader onBack={() => router.back()} brandColor={brandColor} colors={colors} onAdd={handleAddPress} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <ScreenHeader onBack={() => router.back()} brandColor={brandColor} colors={colors} onAdd={handleAddPress} />
        <View style={styles.centered}>
          <MaterialIcons name="wifi-off" size={48} color={colors.text.disabled} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Couldn't load members
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: brandColor }]}
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
    <>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <ScreenHeader
          onBack={() => router.back()}
          brandColor={brandColor}
          colors={colors}
          onAdd={handleAddPress}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info banner */}
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <MaterialIcons
              name="info-outline"
              size={16}
              color={brandColor}
            />
            <Text
              style={[styles.infoBannerText, { color: colors.text.muted }]}
            >
              Add family members so you can quickly select who you're
              ordering medicines for at checkout.
            </Text>
          </View>

          {/* Empty state */}
          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconWrapper,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <MaterialIcons
                  name="group-add"
                  size={40}
                  color={brandColor}
                />
              </View>
              <Text
                style={[styles.emptyTitle, { color: colors.text.primary }]}
              >
                No family members yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.text.muted }]}
              >
                Add your family members to make ordering medicines faster
              </Text>
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: brandColor }]}
                onPress={handleAddPress}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add" size={18} color="#ffffff" />
                <Text style={styles.emptyAddBtnText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              <Text
                style={[styles.listCount, { color: colors.text.faint }]}
              >
                {members.length} member{members.length !== 1 ? 's' : ''}
              </Text>
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onEdit={handleEditPress}
                  onDelete={handleDeletePress}
                  isDeleting={deletingId === member.id}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Form sheet */}
      <MemberFormSheet
        visible={sheetVisible}
        member={editingMember}
        onClose={handleSheetClose}
        onSubmit={handleSheetSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

// ── Screen Header ─────────────────────────────────────────────

function ScreenHeader({
  onBack,
  onAdd,
  brandColor,
  colors,
}: {
  onBack: () => void;
  onAdd: () => void;
  brandColor: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.card,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerBackBtn}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={22} color={colors.text.primary} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
        Family Members
      </Text>

      <TouchableOpacity
        onPress={onAdd}
        style={styles.headerAddBtn}
        activeOpacity={0.7}
        accessibilityLabel="Add family member"
      >
        <MaterialIcons name="add" size={24} color={brandColor} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  list: {
    gap: 0,
  },
  listCount: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
});