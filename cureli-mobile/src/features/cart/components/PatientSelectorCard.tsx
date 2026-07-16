// src/features/cart/components/PatientSelectorCard.tsx

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { CheckoutPatient, UserSex } from '../../../types/auth';

const SEX_LABEL: Record<UserSex, string> = {
  MALE:   'Male',
  FEMALE: 'Female',
  OTHER:  'Other',
};

interface PatientSelectorCardProps {
  patient: CheckoutPatient | null;
  onPress: () => void;
}

export function PatientSelectorCard({
  patient,
  onPress,
}: PatientSelectorCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const hasPatient = patient !== null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: hasPatient ? colors.border.subtle : colors.status.warning,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel="Select who this order is for"
    >
      {/* Icon */}
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: hasPatient
              ? colors.background.tint
              : colors.status.warningBg ?? colors.background.tint,
          },
        ]}
      >
        <MaterialIcons
          name={hasPatient ? 'people' : 'person-add'}
          size={20}
          color={hasPatient ? brandColor : colors.status.warning}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          Ordering for
        </Text>
        {hasPatient ? (
          <Text
            style={[styles.patientName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {patient!.name}
            {patient!.is_self ? (
              <Text style={[styles.selfTag, { color: colors.text.faint }]}>
                {' '}(You)
              </Text>
            ) : null}
          </Text>
        ) : (
          <Text style={[styles.placeholder, { color: colors.status.warning }]}>
            Select who this is for
          </Text>
        )}
        {hasPatient ? (
          <Text style={[styles.meta, { color: colors.text.muted }]}>
            {SEX_LABEL[patient!.sex]} · {patient!.age} yrs
          </Text>
        ) : null}
      </View>

      {/* Arrow */}
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={colors.text.faint}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  patientName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  selfTag: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  placeholder: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});