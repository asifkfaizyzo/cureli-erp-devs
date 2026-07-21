// src/features/marketplace/components/shop/ShopIdentity.tsx

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import { RemoteImage } from "../../../../components/RemoteImage";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { ShopProfileResponse } from "../../../../types/shop";

interface ShopIdentityProps {
  profile: ShopProfileResponse;
  colors: ReturnType<typeof useTheme>["colors"];
}

const BANNER_HEIGHT = 200;
const LOGO_SIZE = 80;
const LOGO_OVERLAP = 40;

export function ShopIdentity({ profile, colors }: ShopIdentityProps) {
  return (
    <View>
      {/* ── Hero (banner + gradient + name + rating) ── */}
      <View style={styles.hero}>
        {/*
          Banner — shop asset, so storefront icon fallback is correct.
          resizeMode="cover" fills the full-width banner area.
          Load/error handled internally by RemoteImage.
        */}
        <RemoteImage
          uri={profile.bannerUrl ?? null}
          style={styles.banner}
          resizeMode="cover"
          mode="shop"
          fallbackIcon="storefront-outline"
          fallbackIconSize={56}
          fallbackIconColor="rgba(255,255,255,0.9)"
          fallbackBg={colors.brand.primary}
        />

        {/* Dark gradient for text legibility */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.75)"]}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* Rating pill */}
        <View style={styles.ratingPill}>
          <Ionicons
            name="star"
            size={12}
            color={profile.rating != null ? "#FBBF24" : "#E5E7EB"}
          />
          <Text style={styles.ratingPillText}>
            {profile.rating != null
              ? profile.rating.toFixed(1)
              : "No rating yet"}
          </Text>
        </View>

        {/* Shop name */}
        <View style={styles.nameOverlay}>
          <Text style={styles.shopName} numberOfLines={2}>
            {profile.name}
          </Text>
        </View>
      </View>

      {/* ── Floating logo card ── */}
      <View style={styles.logoContainer}>
        {/*
          Logo — shop asset, storefront icon fallback is correct.
          resizeMode="contain" preserves logo aspect ratio.
        */}
        <RemoteImage
          uri={profile.logoUrl ?? null}
          style={[
            styles.logoCard,
            {
              
              borderColor: colors.border.subtle,
            },
          ]}
          resizeMode="contain"
          mode="shop"
          fallbackIcon="storefront-outline"
          fallbackIconSize={32}
          fallbackIconColor={colors.text.brand}
          fallbackBg={colors.background.tint}
        />
      </View>

      {/* ── Content block ── */}
      <View style={styles.content}>
        {profile.description ? (
          <Text
            style={[styles.description, { color: colors.text.secondary }]}
          >
            {profile.description}
          </Text>
        ) : null}

        {profile.supportPhone ? (
          <View
            style={[
              styles.phoneChip,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
              },
            ]}
          >
            <Ionicons name="call-outline" size={14} color={colors.text.brand} />
            <Text style={[styles.phoneText, { color: colors.text.brand }]}>
              {profile.supportPhone}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: BANNER_HEIGHT,
    position: "relative",
  },
  // RemoteImage fills this absolutely
  banner: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BANNER_HEIGHT * 0.7,
  },
  ratingPill: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  ratingPillText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  nameOverlay: {
    position: "absolute",
    left: Spacing.base + LOGO_SIZE + Spacing.md,
    right: Spacing.base,
    bottom: Spacing.md,
  },
  shopName: {
    ...Typography.h3,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: -LOGO_OVERLAP,
  },
  // RemoteImage receives this as its style prop
  logoCard: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: Radius.sm,
    borderWidth: 0,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  description: {
    ...Typography.body,
    lineHeight: 22,
  },
  phoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  phoneText: {
    ...Typography.smallMedium,
  },
});