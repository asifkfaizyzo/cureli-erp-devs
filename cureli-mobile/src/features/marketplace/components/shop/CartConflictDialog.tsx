// src/features/marketplace/components/shop/CartConflictDialog.tsx
//
// Modal dialog shown when the user tries to add a medicine from a different
// branch than the one already in their cart.
//
// Options:
//   "Keep cart"   — dismisses without action
//   "Clear & add" — clears cart then adds the new item

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";

interface CartConflictDialogProps {
  visible: boolean;
  existingShopName: string;
  existingBranchName: string;
  onConfirm: () => void;
  onCancel: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function CartConflictDialog({
  visible,
  existingShopName,
  existingBranchName,
  onConfirm,
  onCancel,
  colors,
}: CartConflictDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.background.page }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.status.warningBg },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={26}
              color={colors.status.warning}
            />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            Replace cart?
          </Text>

          <Text style={[styles.body, { color: colors.text.secondary }]}>
            Your cart has items from{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              {existingShopName}
            </Text>
            {existingBranchName ? ` (${existingBranchName})` : ""}. Adding
            from a different branch will clear your current cart.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              style={[
                styles.btn,
                styles.btnCancel,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Text
                style={[styles.btnText, { color: colors.text.secondary }]}
              >
                Keep cart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              style={[
                styles.btn,
                { backgroundColor: colors.status.warning },
              ]}
            >
              <Text style={[styles.btnText, { color: "#FFFFFF" }]}>
                Clear & add
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Typography.h3,
    textAlign: "center",
  },
  body: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
    marginTop: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnText: {
    ...Typography.bodyMedium,
  },
});