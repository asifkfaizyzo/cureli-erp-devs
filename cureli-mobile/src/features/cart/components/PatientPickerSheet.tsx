// src/features/cart/components/PatientPickerSheet.tsx

import { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../store/authStore';
import { useMembers } from '../../profile/hooks/useMembers';
import type { CheckoutPatient, UserSex } from '../../../types/auth';
import type { FamilyMember } from '../../../types/members';

// ── Types ─────────────────────────────────────────────────────

interface PatientPickerSheetProps {
  visible: boolean;
  selectedPatient: CheckoutPatient | null;
  onSelect: (patient: CheckoutPatient) => void;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────

const SEX_LABEL: Record<UserSex, string> = {
  MALE:   'Male',
  FEMALE: 'Female',
  OTHER:  'Other',
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

function computeAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

// ── Patient Row ───────────────────────────────────────────────

interface PatientRowProps {
  name: string;
  subtitle: string;
  isSelected: boolean;
  onPress: () => void;
  brandColor: string;
  colors: any;
  isSelf?: boolean;
}

function PatientRow({
  name,
  subtitle,
  isSelected,
  onPress,
  brandColor,
  colors,
  isSelf,
}: PatientRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.patientRow,
        {
          backgroundColor: isSelected
            ? colors.background.tint
            : colors.background.card,
          borderColor: isSelected ? brandColor : colors.border.subtle,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View
        style={[
          styles.patientAvatar,
          {
            backgroundColor: isSelected
              ? brandColor
              : colors.background.elevated,
          },
        ]}
      >
        <MaterialIcons
          name={isSelf ? 'person' : 'people'}
          size={20}
          color={isSelected ? '#ffffff' : colors.text.muted}
        />
      </View>

      {/* Info */}
      <View style={styles.patientInfo}>
        <Text
          style={[
            styles.patientName,
            {
              color: colors.text.primary,
              fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
            },
          ]}
          numberOfLines={1}
        >
          {name}
          {isSelf ? (
            <Text
              style={[
                styles.selfBadge,
                { color: colors.text.faint },
              ]}
            >
              {' '}(You)
            </Text>
          ) : null}
        </Text>
        <Text style={[styles.patientSubtitle, { color: colors.text.muted }]}>
          {subtitle}
        </Text>
      </View>

      {/* Selection indicator */}
      {isSelected ? (
        <MaterialIcons
          name="check-circle"
          size={22}
          color={brandColor}
        />
      ) : (
        <View
          style={[
            styles.unselectedCircle,
            { borderColor: colors.border.input },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

// ── Main Sheet ────────────────────────────────────────────────

export function PatientPickerSheet({
  visible,
  selectedPatient,
  onSelect,
  onClose,
}: PatientPickerSheetProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const user = useAuthStore((s) => s.user);
  const { members, isLoading } = useMembers();

  // ── Animation ─────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Build "Myself" patient from user ─────────────────────
  const myselfPatient: CheckoutPatient | null = (() => {
    if (!user?.full_name || !user?.date_of_birth || !user?.sex) return null;
    return {
      is_self: true,
      name: user.full_name,
      age: computeAge(user.date_of_birth),
      sex: user.sex,
    };
  })();

  // ── Build patient from family member ─────────────────────
  function memberToPatient(member: FamilyMember): CheckoutPatient {
    return {
      is_self: false,
      name: member.name,
      age: member.age,
      sex: member.sex,
    };
  }

  // ── Check if a patient matches the selected one ───────────
  function isPatientSelected(patient: CheckoutPatient): boolean {
    if (!selectedPatient) return false;
    return (
      patient.is_self === selectedPatient.is_self &&
      patient.name === selectedPatient.name
    );
  }

  const handleSelectMyself = useCallback(() => {
    if (!myselfPatient) return;
    onSelect(myselfPatient);
    onClose();
  }, [myselfPatient, onSelect, onClose]);

  const handleSelectMember = useCallback(
    (member: FamilyMember) => {
      onSelect(memberToPatient(member));
      onClose();
    },
    [onSelect, onClose],
  );

  const handleAddMember = useCallback(() => {
    onClose();
    // Small delay so sheet closes before navigating
    setTimeout(() => {
      router.push('/profile/members' as any);
    }, 250);
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background.card,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View
          style={[styles.handle, { backgroundColor: colors.border.subtle }]}
        />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>
            Who is this for?
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons
              name="close"
              size={22}
              color={colors.text.muted}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sheetSubtitle, { color: colors.text.muted }]}>
          Select the person you're ordering medicines for
        </Text>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Myself */}
          {myselfPatient ? (
            <PatientRow
              name={myselfPatient.name}
              subtitle={`${SEX_LABEL[myselfPatient.sex]} · ${myselfPatient.age} yrs`}
              isSelected={isPatientSelected(myselfPatient)}
              onPress={handleSelectMyself}
              brandColor={brandColor}
              colors={colors}
              isSelf
            />
          ) : null}

          {/* Loading members */}
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={brandColor} />
              <Text style={[styles.loadingText, { color: colors.text.muted }]}>
                Loading members…
              </Text>
            </View>
          ) : null}

          {/* Family members */}
          {!isLoading &&
            members.map((member) => (
              <PatientRow
                key={member.id}
                name={member.name}
                subtitle={`${SEX_LABEL[member.sex]} · ${member.age} yrs`}
                isSelected={isPatientSelected(memberToPatient(member))}
                onPress={() => handleSelectMember(member)}
                brandColor={brandColor}
                colors={colors}
              />
            ))}

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.border.subtle },
            ]}
          />

          {/* Add member */}
          <TouchableOpacity
            style={[
              styles.addMemberBtn,
              { borderColor: brandColor },
            ]}
            onPress={handleAddMember}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.addMemberIcon,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons name="person-add" size={18} color={brandColor} />
            </View>
            <Text style={[styles.addMemberText, { color: brandColor }]}>
              Add a family member
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={brandColor}
            />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 15,
  },
  selfBadge: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  patientSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  unselectedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addMemberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});