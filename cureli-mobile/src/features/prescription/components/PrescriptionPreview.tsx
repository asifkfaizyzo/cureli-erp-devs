// src/features/prescription/components/PrescriptionPreview.tsx
//
// Shows the selected prescription image/document.
// User can confirm or pick again.

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

interface PrescriptionPreviewProps {
  uri: string;
  fileType: "image" | "document";
  fileName?: string;
  onConfirm: () => void;
  onPickAgain: () => void;
  isUploading: boolean;
}

function PrescriptionPreviewBase({
  uri,
  fileType,
  fileName,
  onConfirm,
  onPickAgain,
  isUploading,
}: PrescriptionPreviewProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Preview label */}
        <View style={styles.labelRow}>
          <Ionicons
            name="eye-outline"
            size={16}
            color={colors.text.brand}
          />
          <Text style={[styles.label, { color: colors.text.brand }]}>
            Prescription Preview
          </Text>
        </View>

        {/* Image or document preview */}
        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          {fileType === "image" ? (
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.documentPlaceholder}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.text.brand}
              />
              <Text
                style={[styles.docName, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {fileName ?? "Prescription Document"}
              </Text>
            </View>
          )}
        </View>

        {/* Checklist reminder */}
        <View
          style={[
            styles.reminderBox,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.brand,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={colors.text.brand}
          />
          <Text style={[styles.reminderText, { color: colors.text.secondary }]}>
            Make sure the prescription is clear, complete and within 6 months
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View
        style={[
          styles.actions,
          {
            borderTopColor: colors.border.subtle,
            backgroundColor: colors.background.page,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPickAgain}
          activeOpacity={0.8}
          disabled={isUploading}
          style={[
            styles.secondaryBtn,
            {
              borderColor: colors.border.default,
              backgroundColor: colors.background.card,
            },
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text
            style={[styles.secondaryBtnText, { color: colors.text.secondary }]}
          >
            Pick Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onConfirm}
          activeOpacity={0.8}
          disabled={isUploading}
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.brand.primary },
            isUploading && styles.btnDisabled,
          ]}
        >
          {isUploading ? (
            <>
              <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Uploading…</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Confirm & Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing["2xl"],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  label: {
    ...Typography.bodyMedium,
  },
  previewBox: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 380,
  },
  documentPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing["2xl"],
  },
  docName: {
    ...Typography.bodyMedium,
    textAlign: "center",
  },
  reminderBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  reminderText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  secondaryBtnText: {
    ...Typography.button,
  },
  primaryBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  primaryBtnText: {
    ...Typography.button,
    color: "#ffffff",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export const PrescriptionPreview = React.memo(PrescriptionPreviewBase);