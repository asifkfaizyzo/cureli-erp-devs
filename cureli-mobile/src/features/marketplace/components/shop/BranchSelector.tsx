// src/features/marketplace/components/shop/BranchSelector.tsx
//
// Tappable trigger row that opens a modal bottom-sheet branch picker.
//
// ── PICKER REDESIGN ───────────────────────────────────────────
// The picker now has a large preview of the branch image at the TOP of
// the sheet (full-width, ~170px) with the branch name + open/closed
// status overlaid on a gradient scrim. Below it is the list of branch
// rows (no per-row thumbnails — the big preview carries the visual).
//
// Browse-with-confirm interaction:
//   - Opening the sheet pre-highlights the currently-active branch.
//   - Tapping a row HIGHLIGHTS it and updates the top preview live; it
//     does NOT immediately confirm/close.
//   - A "Select this branch" button at the bottom confirms the
//     highlighted branch and closes the sheet.
//   - Closing the sheet without confirming discards the in-sheet
//     highlight (the active branch is unchanged).
// Inactive (marketplace-disabled) branches cannot be highlighted.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

  // In-sheet highlight — the branch being previewed/browsed inside the
  // picker. Separate from the confirmed selection (selectedBranchId) so
  // the user can browse without committing until they tap "Select".
  const [draftBranchId, setDraftBranchId] = useState<string>(selectedBranchId);

  // The branch shown in the collapsed trigger (confirmed selection).
  const selected = useMemo(
    () => branches.find((b) => b.branchId === selectedBranchId),
    [branches, selectedBranchId],
  );

  // The branch shown in the big top preview (in-sheet draft).
  const draft = useMemo(
    () => branches.find((b) => b.branchId === draftBranchId) ?? selected ?? null,
    [branches, draftBranchId, selected],
  );

  // When opening the sheet, start the draft on the currently-active branch.
  const handleOpen = useCallback(() => {
    setDraftBranchId(selectedBranchId);
    setOpen(true);
  }, [selectedBranchId]);

  // Tapping a row only highlights + previews — does not confirm.
  const handleHighlight = useCallback((branchId: string) => {
    setDraftBranchId(branchId);
  }, []);

  // Confirm the draft and close.
  const handleConfirm = useCallback(() => {
    if (draftBranchId) onSelect(draftBranchId);
    setOpen(false);
  }, [draftBranchId, onSelect]);

  const draftIsInactive = draft ? !draft.marketplaceEnabled : true;

  return (
    <>
      {/* ── Trigger ── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpen}
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
                  backgroundColor: selected.isOpen
                    ? "#DCFCE7"
                    : colors.background.tint,
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
            {/* ── Top: large preview of the draft branch ── */}
            <View style={styles.previewWrap}>
              {draft?.shopImageUrl ? (
                <Image
                  source={{ uri: draft.shopImageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.previewImage,
                    styles.previewPlaceholder,
                    { backgroundColor: colors.brand.primary },
                  ]}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={44}
                    color="#FFFFFF"
                  />
                </View>
              )}

              {/* Gradient scrim for text legibility */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.65)"]}
                style={styles.previewScrim}
              />

              {/* Close button (floats over the image) */}
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.previewClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Name + status overlaid at the bottom of the image */}
              <View style={styles.previewMeta}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {draft?.branchName ?? "Select a branch"}
                </Text>
                {draft ? (
                  <View style={styles.previewBadges}>
                    <View
                      style={[
                        styles.previewBadge,
                        {
                          backgroundColor: draft.isOpen
                            ? "rgba(22,163,74,0.9)"
                            : "rgba(0,0,0,0.45)",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.openDot,
                          { backgroundColor: "#FFFFFF" },
                        ]}
                      />
                      <Text style={styles.previewBadgeText}>
                        {draft.isOpen ? "Open now" : "Closed"}
                      </Text>
                    </View>
                    {draft.distanceKm != null ? (
                      <View
                        style={[
                          styles.previewBadge,
                          { backgroundColor: "rgba(0,0,0,0.45)" },
                        ]}
                      >
                        <Ionicons
                          name="navigate-outline"
                          size={11}
                          color="#FFFFFF"
                        />
                        <Text style={styles.previewBadgeText}>
                          {draft.distanceKm} km
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Draft branch details (address + capabilities) ── */}
            {draft ? (
              <View style={styles.previewDetails}>
                {draft.address ? (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.text.secondary },
                      ]}
                      numberOfLines={2}
                    >
                      {draft.address}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Ionicons
                    name="medkit-outline"
                    size={14}
                    color={colors.text.muted}
                  />
                  <Text
                    style={[styles.detailText, { color: colors.text.muted }]}
                  >
                    {draft.listedMedicineCount} medicines listed
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ── Section label ── */}
            <Text
              style={[styles.listLabel, { color: colors.text.secondary }]}
            >
              {branches.length === 1
                ? "Branch"
                : `All branches (${branches.length})`}
            </Text>

            {/* ── Branch list (no thumbnails) ── */}
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {branches.map((branch) => {
                const isDraft = branch.branchId === draftBranchId;
                const isInactive = !branch.marketplaceEnabled;

                return (
                  <TouchableOpacity
                    key={branch.branchId}
                    activeOpacity={isInactive ? 1 : 0.75}
                    onPress={() => {
                      if (!isInactive) handleHighlight(branch.branchId);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isDraft
                          ? `${colors.brand.primary}10`
                          : "transparent",
                        borderColor: isDraft
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
                            borderColor: isDraft
                              ? colors.brand.primary
                              : colors.border.default,
                          },
                        ]}
                      >
                        {isDraft ? (
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
                            numberOfLines={1}
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

            {/* ── Confirm button ── */}
            <View
              style={[
                styles.confirmBar,
                { borderTopColor: colors.border.subtle },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={draftIsInactive}
                onPress={handleConfirm}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: draftIsInactive
                      ? colors.background.tint
                      : colors.brand.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.confirmBtnText,
                    {
                      color: draftIsInactive ? colors.text.muted : "#FFFFFF",
                    },
                  ]}
                >
                  {draft
                    ? `Select ${draft.branchName ?? "this branch"}`
                    : "Select this branch"}
                </Text>
              </TouchableOpacity>
            </View>
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
  // ── Modal shell ──────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "88%",
    overflow: "hidden",
  },
  // ── Top preview ──────────────────────────────────────────────
  previewWrap: {
    width: "100%",
    height: 170,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  previewClose: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewMeta: {
    position: "absolute",
    left: Spacing.base,
    right: Spacing.base,
    bottom: Spacing.md,
    gap: Spacing.xs,
  },
  previewName: {
    ...Typography.h3,
    color: "#FFFFFF",
  },
  previewBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  previewBadgeText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  // ── Draft details ────────────────────────────────────────────
  previewDetails: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  // ── List ─────────────────────────────────────────────────────
  listLabel: {
    ...Typography.smallMedium,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sheetScroll: {
    paddingHorizontal: Spacing.base,
  },
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
  // ── Confirm bar ──────────────────────────────────────────────
  confirmBar: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing["2xl"],
    borderTopWidth: 1,
  },
  confirmBtn: {
    height: 50,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    ...Typography.bodyMedium,
  },
});