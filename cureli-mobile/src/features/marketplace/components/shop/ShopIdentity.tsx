// src/features/marketplace/components/shop/ShopIdentity.tsx
//
// Banner image, logo, shop name, rating, description, and support phone.
// Rendered as the top of the shop profile FlatList header.
//
// ── DESIGN ─────────────────────────────────────────────────────
// Hero layout:
//   [ Banner image (200h) ]
//   [   dark gradient overlay at bottom half                  ]
//   [   ★ rating pill (top-right on banner)                   ]
//   [   Shop name (white, bold, bottom-left, offset for logo) ]
//   [ Floating logo card overlaps bottom edge of banner       ]
//   [ Description on page background                          ]
//   [ Support phone chip                                      ]
//
// Fallbacks:
//   - No banner → brand-color block with centered storefront icon
//   - No logo   → tinted circle with storefront icon
//   - No description / phone → section hidden

import React from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { ShopProfileResponse } from "../../../../types/shop";

interface ShopIdentityProps {
  profile: ShopProfileResponse;
  colors: ReturnType<typeof useTheme>["colors"];
}

const BANNER_HEIGHT = 200;
const LOGO_SIZE = 80;
const LOGO_OVERLAP = 40; // how much the logo hangs below the banner

export function ShopIdentity({ profile, colors }: ShopIdentityProps) {
  return (
    <View>
      {/* ── Hero (banner + gradient + name + rating) ────────── */}
      <View style={styles.hero}>
        {/* Banner or fallback */}
        {profile.bannerUrl ? (
          <Image
            source={{ uri: profile.bannerUrl }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.banner,
              styles.bannerFallback,
              { backgroundColor: colors.brand.primary },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={56}
              color="rgba(255,255,255,0.9)"
            />
          </View>
        )}

        {/* Dark gradient at bottom half — always applied for readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.75)"]}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* Rating pill — top-right of banner */}
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

        {/* Shop name — bottom-left of banner, offset from logo */}
        <View style={styles.nameOverlay}>
          <Text style={styles.shopName} numberOfLines={2}>
            {profile.name}
          </Text>
        </View>
      </View>

      {/* ── Floating logo card ──────────────────────────────── */}
      <View style={styles.logoContainer}>
        {profile.logoUrl ? (
          <View
            style={[
              styles.logoCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Image
              source={{ uri: profile.logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View
            style={[
              styles.logoCard,
              styles.logoPlaceholder,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={32}
              color={colors.text.brand}
            />
          </View>
        )}
      </View>

      {/* ── Content block (description + phone) ─────────────── */}
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
            <Ionicons
              name="call-outline"
              size={14}
              color={colors.text.brand}
            />
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
  // ── Hero ────────────────────────────────────────────────
  hero: {
    width: "100%",
    height: BANNER_HEIGHT,
    position: "relative",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  bannerFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BANNER_HEIGHT * 0.7,
  },

  // ── Rating pill ─────────────────────────────────────────
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

  // ── Name overlay ────────────────────────────────────────
  nameOverlay: {
    position: "absolute",
    left: Spacing.base + LOGO_SIZE + Spacing.md, // offset past logo
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

  // ── Floating logo ───────────────────────────────────────
  logoContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: -LOGO_OVERLAP,
  },
  logoCard: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: Radius.lg,
    borderWidth: 1,
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
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },

  // ── Content ─────────────────────────────────────────────
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