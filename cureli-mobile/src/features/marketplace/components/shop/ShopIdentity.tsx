// src/features/marketplace/components/shop/ShopIdentity.tsx
//
// Banner image, logo, shop name, rating, description, and support phone.
// Rendered as the top of the shop profile FlatList header.

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { ShopProfileResponse } from "../../../../types/shop";

interface ShopIdentityProps {
  profile: ShopProfileResponse;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function ShopIdentity({ profile, colors }: ShopIdentityProps) {
  return (
    <>
      {/* ── Banner ── */}
      {profile.bannerUrl ? (
        <Image
          source={{ uri: profile.bannerUrl }}
          style={styles.banner}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.bannerPlaceholder,
            { backgroundColor: colors.brand.primary },
          ]}
        >
          <Ionicons name="storefront-outline" size={48} color="#FFFFFF" />
        </View>
      )}

      {/* ── Logo + name + rating ── */}
      <View style={styles.identityRow}>
        {profile.logoUrl ? (
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: colors.background.page,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Image
              source={{ uri: profile.logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View
            style={[
              styles.logoWrap,
              styles.logoPlaceholder,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={28}
              color={colors.text.brand}
            />
          </View>
        )}

        <View style={styles.nameBlock}>
          <Text
            style={[styles.shopName, { color: colors.text.primary }]}
            numberOfLines={2}
          >
            {profile.name}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons
              name="star"
              size={14}
              color={profile.rating != null ? "#FBBF24" : colors.text.faint}
            />
            <Text
              style={[
                styles.ratingText,
                {
                  color:
                    profile.rating != null
                      ? colors.text.secondary
                      : colors.text.faint,
                },
              ]}
            >
              {profile.rating != null
                ? profile.rating.toFixed(1)
                : "No rating yet"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Description ── */}
      {profile.description ? (
        <Text
          style={[styles.description, { color: colors.text.secondary }]}
        >
          {profile.description}
        </Text>
      ) : null}

      {/* ── Support phone ── */}
      {profile.supportPhone ? (
        <View style={styles.phoneRow}>
          <Ionicons name="call-outline" size={14} color={colors.text.brand} />
          <Text style={[styles.phoneText, { color: colors.text.brand }]}>
            {profile.supportPhone}
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    height: 160,
  },
  bannerPlaceholder: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.base,
    marginTop: -28,
    gap: Spacing.md,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 2,
    overflow: "hidden",
    flexShrink: 0,
  },
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  nameBlock: {
    flex: 1,
    paddingBottom: 4,
    gap: 4,
  },
  shopName: {
    ...Typography.h3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    ...Typography.small,
  },
  description: {
    ...Typography.body,
    lineHeight: 22,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },
  phoneText: {
    ...Typography.smallMedium,
  },
});