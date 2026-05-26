// src/features/marketplace/components/PromoCard.tsx
//
// Single hero carousel slide.
//
// Layout:
//   LEFT  — title, subtitle, CTA button (flex:1)
//   RIGHT — image (if imageUrl) or branded icon placeholder
//
// Gradient background per slide, defined in HERO_BANNERS.
// Purely presentational — receives one HeroBannerSlide as prop.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { HeroBannerSlide } from "../constants/marketplace.constants";
import { HERO_CAROUSEL_HEIGHT } from "../constants/marketplace.constants";

// ── Props ─────────────────────────────────────────────────────

interface PromoCardProps {
  slide: HeroBannerSlide;
  /** Card width passed from carousel so it fills correctly. */
  width: number;
}

// ── Component ─────────────────────────────────────────────────

function PromoCardBase({ slide, width }: PromoCardProps) {
  const handleCta = () => {
    router.push(slide.ctaRoute as any);
  };

  return (
    <LinearGradient
      colors={slide.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { width, height: HERO_CAROUSEL_HEIGHT }]}
    >
      {/* Decorative circle — top right depth layer */}
      <View style={styles.circleTopRight} pointerEvents="none" />
      <View style={styles.circleBottomLeft} pointerEvents="none" />

      <View style={styles.content}>
        {/* ── Left: text + CTA ── */}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {slide.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {slide.subtitle}
          </Text>

          <TouchableOpacity
            onPress={handleCta}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={slide.ctaLabel}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{slide.ctaLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Right: image or placeholder icon ── */}
        <View style={styles.imageBlock}>
          {slide.imageUrl ? (
            // Real image — swap <View> for <Image> when URLs are ready.
            // Using View placeholder so no new dependency needed now.
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name={slide.placeholderIcon as any}
                size={44}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name={slide.placeholderIcon as any}
                size={44}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  // Decorative depth circles
  circleTopRight: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -40,
  },
  circleBottomLeft: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.base,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: "#ffffff",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
    color: "rgba(255,255,255,0.80)",
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  ctaText: {
    ...Typography.buttonSmall,
    color: "#ffffff",
  },
  imageBlock: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const PromoCard = React.memo(PromoCardBase);