// src/features/prescription/components/PrescriptionSuccess.tsx
//
// Success state after prescription is submitted.
// Shows confirmation + "Back to Home" button.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { useEffect } from "react";

interface PrescriptionSuccessProps {
  onGoHome: () => void;
  onUploadAnother: () => void;
}

function PrescriptionSuccessBase({
  onGoHome,
  onUploadAnother,
}: PrescriptionSuccessProps) {
  const { colors } = useTheme();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, [scale, opacity]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Success badge */}
      <Animated.View style={badgeStyle}>
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.status.successBg },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={72}
            color={colors.status.success}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textBlock, contentStyle]}>
        <Text style={[styles.heading, { color: colors.text.primary }]}>
          Prescription Uploaded!
        </Text>

        <Text style={[styles.subheading, { color: colors.text.muted }]}>
          Our pharmacist will review your prescription and get back to you
          shortly.
        </Text>

        {/* Info chips */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.brand,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.text.brand}
            />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Review usually takes 5–10 minutes
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="notifications-outline"
              size={16}
              color={colors.text.brand}
            />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              You'll be notified once it's approved
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.text.brand}
            />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Your prescription is safe and secure
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actions, contentStyle]}>
        <TouchableOpacity
          onPress={onUploadAnother}
          activeOpacity={0.8}
          style={[
            styles.secondaryBtn,
            {
              borderColor: colors.border.default,
              backgroundColor: colors.background.card,
            },
          ]}
        >
          <Ionicons
            name="add-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text
            style={[styles.secondaryBtnText, { color: colors.text.secondary }]}
          >
            Upload Another
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onGoHome}
          activeOpacity={0.8}
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.brand.primary },
          ]}
        >
          <Ionicons name="home-outline" size={16} color="#ffffff" />
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: Spacing.md,
    width: "100%",
  },
  heading: {
    ...Typography.h2,
    textAlign: "center",
  },
  subheading: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  infoBox: {
    width: "100%",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
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
});

export const PrescriptionSuccess = React.memo(PrescriptionSuccessBase);