// src/features/marketplace/components/shop/BranchSelector.tsx
//
// Tappable trigger row that opens a modal bottom-sheet branch picker.
// Shows selected branch name and open/closed status.
// Disabled branches are shown at 45% opacity with "Inactive" badge.

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { ShopProfileBranch } from "../../../../types/shop";

interface BranchSelectorProps {
  branches: ShopProfileBranch[];
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function BranchSelector({
  branches,
  selectedBranchId,
  onSelect,
  colors,
}: BranchSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = branches.find((b) => b.branchId === selectedBranchId);

  const handleSelect = useCallback(
    (branchId: string) => {
      onSelect(branchId);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <>
      {/* ── Trigger ── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        <View style={styles.triggerLeft}>
          <Ionicons
            name="git-branch-outline"
            size={16}
            color={colors.text.brand}
          />
          <View style={styles.triggerText}>
            <Text style={[styles.triggerLabel, { color: colors.text.faint }]}>
              Branch
            </Text>
            <Text
              style={[styles.triggerName, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {selected?.branchName ?? "Select branch"}
            </Text>
          </View>
        </View>

        <View style={styles.triggerRight}>
          {selected ? (
            <View
              style={[
                styles.openBadge,
                {
                  backgroundColor: selected.isOpen ? "#DCFCE7" : colors.background.tint,
                },
              ]}
            >
              <View
                style={[
                  styles.openDot,
                  { backgroundColor: selected.isOpen ? "#16A34A" : "#9E9E9E" },
                ]}
              />
              <Text
                style={[
                  styles.openBadgeText,
                  { color: selected.isOpen ? "#16A34A" : colors.text.muted },
                ]}
              >
                {selected.isOpen ? "Open" : "Closed"}
              </Text>
            </View>
          ) : null}
          <Ionicons name="chevron-down" size={16} color={colors.text.muted} />
        </View>
      </TouchableOpacity>

      {/* ── Picker modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background.page }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={[
                styles.sheetHeader,
                { borderBottomColor: colors.border.subtle },
              ]}
            >
              <Text
                style={[styles.sheetTitle, { color: colors.text.primary }]}
              >
                Select Branch
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Branch list */}
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {branches.map((branch) => {
                const isSelected = branch.branchId === selectedBranchId;
                const isInactive = !branch.marketplaceEnabled;

                return (
                  <TouchableOpacity
                    key={branch.branchId}
                    activeOpacity={isInactive ? 1 : 0.75}
                    onPress={() => {
                      if (!isInactive) handleSelect(branch.branchId);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? `${colors.brand.primary}10`
                          : "transparent",
                        borderColor: isSelected
                          ? colors.brand.primary
                          : colors.border.subtle,
                        opacity: isInactive ? 0.45 : 1,
                      },
                    ]}
                  >
                    {/* Left: radio + text */}
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? colors.brand.primary
                              : colors.border.default,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.brand.primary },
                            ]}
                          />
                        ) : null}
                      </View>

                      <View style={styles.optionText}>
                        <Text
                          style={[
                            styles.optionName,
                            { color: colors.text.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {branch.branchName ?? "Branch"}
                        </Text>

                        {branch.address ? (
                          <Text
                            style={[
                              styles.optionAddress,
                              { color: colors.text.muted },
                            ]}
                            numberOfLines={2}
                          >
                            {branch.address}
                          </Text>
                        ) : null}

                        {branch.distanceKm != null ? (
                          <Text
                            style={[
                              styles.optionMeta,
                              { color: colors.text.faint },
                            ]}
                          >
                            {branch.distanceKm} km away
                          </Text>
                        ) : null}

                        <Text
                          style={[
                            styles.optionMeta,
                            { color: colors.text.faint },
                          ]}
                        >
                          {branch.listedMedicineCount} medicines listed
                        </Text>
                      </View>
                    </View>

                    {/* Right: badges */}
                    <View style={styles.optionRight}>
                      {isInactive ? (
                        <View
                          style={[
                            styles.inactiveBadge,
                            { backgroundColor: colors.background.tint },
                          ]}
                        >
                          <Text
                            style={[
                              styles.inactiveBadgeText,
                              { color: colors.text.muted },
                            ]}
                          >
                            Inactive
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.openBadge,
                            {
                              backgroundColor: branch.isOpen
                                ? "#DCFCE7"
                                : colors.background.tint,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.openDot,
                              {
                                backgroundColor: branch.isOpen
                                  ? "#16A34A"
                                  : "#9E9E9E",
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.openBadgeText,
                              {
                                color: branch.isOpen
                                  ? "#16A34A"
                                  : colors.text.muted,
                              },
                            ]}
                          >
                            {branch.isOpen ? "Open" : "Closed"}
                          </Text>
                        </View>
                      )}

                      <View style={styles.capRow}>
                        {branch.pickupEnabled ? (
                          <View
                            style={[
                              styles.capPill,
                              { backgroundColor: colors.background.tint },
                            ]}
                          >
                            <Text
                              style={[
                                styles.capPillText,
                                { color: colors.text.brand },
                              ]}
                            >
                              Pickup
                            </Text>
                          </View>
                        ) : null}
                        {branch.deliveryEnabled ? (
                          <View
                            style={[
                              styles.capPill,
                              { backgroundColor: colors.background.tint },
                            ]}
                          >
                            <Text
                              style={[
                                styles.capPillText,
                                { color: colors.text.brand },
                              ]}
                            >
                              Delivery
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Trigger ─────────────────────────────────────────────────
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  triggerText: {
    flex: 1,
    gap: 2,
  },
  triggerLabel: {
    ...Typography.caption,
  },
  triggerName: {
    ...Typography.bodyMedium,
  },
  triggerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  // ── Modal ────────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "75%",
    paddingBottom: Spacing["3xl"],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    ...Typography.h4,
  },
  sheetScroll: {
    padding: Spacing.base,
  },
  // ── Options ──────────────────────────────────────────────────
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionName: {
    ...Typography.bodyMedium,
  },
  optionAddress: {
    ...Typography.small,
    lineHeight: 18,
  },
  optionMeta: {
    ...Typography.caption,
  },
  optionRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
    flexShrink: 0,
  },
  // ── Badges ───────────────────────────────────────────────────
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openBadgeText: {
    ...Typography.caption,
    fontFamily: "Inter_600SemiBold",
  },
  inactiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  inactiveBadgeText: {
    ...Typography.caption,
    fontFamily: "Inter_600SemiBold",
  },
  capRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  capPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  capPillText: {
    ...Typography.caption,
  },
});