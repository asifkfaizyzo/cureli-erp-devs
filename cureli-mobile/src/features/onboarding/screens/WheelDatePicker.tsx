// src/features/onboarding/screens/WheelDatePicker.tsx
//
// Renamed to DatePickerSheet internally but keeping the same
// export name so no other file needs to change.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

// ── Constants ─────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function buildYears(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current - 1; y >= 1920; y--) years.push(y);
  return years;
}

const ALL_YEARS = buildYears();

// ── Dropdown list ─────────────────────────────────────────────

interface DropdownProps {
  label: string;
  displayValue: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Dropdown({ label, displayValue, open, onToggle, children }: DropdownProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.dropdownWrapper}>
      <Text style={[styles.dropdownLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          {
            backgroundColor: colors.background.input,
            borderColor: open ? colors.brand.accent : colors.border.input,
            borderWidth: open ? 1.5 : 1,
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownValue, { color: colors.text.primary }]}>
          {displayValue}
        </Text>
        <MaterialIcons
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={20}
          color={colors.text.muted}
        />
      </TouchableOpacity>

      {open && (
        <View
          style={[
            styles.dropdownList,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
              shadowColor: '#000',
            },
          ]}
        >
          <ScrollView
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {children}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

interface DropdownItemProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function DropdownItem({ label, selected, onPress }: DropdownItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selected && { backgroundColor: colors.background.tint },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text
        style={[
          styles.dropdownItemText,
          {
            color: selected ? colors.brand.accent : colors.text.primary,
            fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
          },
        ]}
      >
        {label}
      </Text>
      {selected && (
        <MaterialIcons name="check" size={16} color={colors.brand.accent} />
      )}
    </TouchableOpacity>
  );
}

// ── Main export ───────────────────────────────────────────────

interface WheelDatePickerProps {
  visible: boolean;
  value: string | null; // "YYYY-MM-DD" or null
  onConfirm: (dateStr: string) => void;
  onClose: () => void;
}

export function WheelDatePicker({
  visible,
  value,
  onConfirm,
  onClose,
}: WheelDatePickerProps) {
  const { colors, isDark } = useTheme();

  const parseInitial = () => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m, day: d };
    }
    return { year: 1990, month: 1, day: 1 };
  };

  const [selectedDay,   setSelectedDay]   = useState(parseInitial().day);
  const [selectedMonth, setSelectedMonth] = useState(parseInitial().month); // 1-based
  const [selectedYear,  setSelectedYear]  = useState(parseInitial().year);

  // Which dropdown is open — only one at a time
  const [openField, setOpenField] = useState<'day' | 'month' | 'year' | null>(null);

  // Re-sync state when picker opens
  useEffect(() => {
    if (visible) {
      const p = parseInitial();
      setSelectedDay(p.day);
      setSelectedMonth(p.month);
      setSelectedYear(p.year);
      setOpenField(null);
    }
  }, [visible]);

  // Clamp day when month/year changes
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  useEffect(() => {
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [daysInMonth]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function toggle(field: 'day' | 'month' | 'year') {
    setOpenField((prev) => (prev === field ? null : field));
  }

  function handleConfirm() {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    onConfirm(`${selectedYear}-${mm}-${dd}`);
  }

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const previewText =
    `${String(selectedDay).padStart(2, '0')} ${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop — closes all dropdowns / sheet */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.background.page }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border.subtle }]} />

        {/* Title row */}
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={onClose} style={styles.titleBtn}>
            <Text style={[styles.titleBtnText, { color: colors.text.muted }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.titleText, { color: colors.text.primary }]}>
            Date of Birth
          </Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.titleBtn}>
            <Text style={[styles.titleBtnText, { color: brandColor }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={[styles.previewBadge, { backgroundColor: colors.background.tint }]}>
          <MaterialIcons name="cake" size={14} color={colors.text.muted} />
          <Text style={[styles.previewText, { color: colors.text.muted }]}>
            {previewText}
          </Text>
        </View>

        {/* Dropdowns */}
        <View style={styles.dropdownsRow}>
          {/* Day */}
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Day"
              displayValue={String(selectedDay).padStart(2, '0')}
              open={openField === 'day'}
              onToggle={() => toggle('day')}
            >
              {days.map((d) => (
                <DropdownItem
                  key={d}
                  label={String(d).padStart(2, '0')}
                  selected={d === selectedDay}
                  onPress={() => {
                    setSelectedDay(d);
                    setOpenField(null);
                  }}
                />
              ))}
            </Dropdown>
          </View>

          <View style={styles.dropdownGap} />

          {/* Month */}
          <View style={{ flex: 2 }}>
            <Dropdown
              label="Month"
              displayValue={MONTHS[selectedMonth - 1]}
              open={openField === 'month'}
              onToggle={() => toggle('month')}
            >
              {MONTHS.map((m, i) => (
                <DropdownItem
                  key={m}
                  label={m}
                  selected={i + 1 === selectedMonth}
                  onPress={() => {
                    setSelectedMonth(i + 1);
                    setOpenField(null);
                  }}
                />
              ))}
            </Dropdown>
          </View>

          <View style={styles.dropdownGap} />

          {/* Year */}
          <View style={{ flex: 1.5 }}>
            <Dropdown
              label="Year"
              displayValue={String(selectedYear)}
              open={openField === 'year'}
              onToggle={() => toggle('year')}
            >
              {ALL_YEARS.map((y) => (
                <DropdownItem
                  key={y}
                  label={String(y)}
                  selected={y === selectedYear}
                  onPress={() => {
                    setSelectedYear(y);
                    setOpenField(null);
                  }}
                />
              ))}
            </Dropdown>
          </View>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: brandColor }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm date</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    // tall enough for open dropdowns
    minHeight: 340,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  titleBtn: {
    minWidth: 64,
    paddingVertical: 4,
  },
  titleBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  titleText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  previewText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  dropdownsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Extra bottom space so open lists don't get clipped
    paddingBottom: 180,
  },
  dropdownGap: { width: 8 },

  // ── Dropdown ──
  dropdownWrapper: {
    gap: 6,
  },
  dropdownLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dropdownValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 99,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
  },

  // ── Confirm ──
  confirmBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
});