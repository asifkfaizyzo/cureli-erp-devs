// src/features/marketplace/components/PromoCard.tsx
//
// Single hero carousel slide.
//
// Layout:
//   LEFT  — title, subtitle, CTA button (flex:1)
//   RIGHT — image (if imageUrl) or branded icon placeholder
//
// All colors are now theme-driven via colors.hero tokens.
// Gradient pair is selected by gradientIndex from the slide data.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { HeroBannerSlide } from "../constants/marketplace.constants";
import { HERO_CAROUSEL_HEIGHT } from "../constants/marketplace.constants";

// ── Props ─────────────────────────────────────────────────────

interface PromoCardProps {
  slide: HeroBannerSlide;
  width: number;
}

// ── Component ─────────────────────────────────────────────────

function PromoCardBase({ slide, width }: PromoCardProps) {
  const { colors } = useTheme();
  const h = colors.hero;

  // Pick gradient pair — fallback to first if index is out of range
  const gradient =
    h.gradients[slide.gradientIndex] ?? h.gradients[0] ?? ["#333", "#666"];

  const handleCta = () => {
    router.push(slide.ctaRoute as any);
  };

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { width, height: HERO_CAROUSEL_HEIGHT }]}
    >
      {/* Decorative circles */}
      <View
        style={[styles.circleTopRight, { backgroundColor: h.decorCircle }]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.circleBottomLeft,
          { backgroundColor: h.decorCircleSecondary },
        ]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {/* ── Left: text + CTA ── */}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: h.onGradientText }]} numberOfLines={2}>
            {slide.title}
          </Text>
          <Text
            style={[styles.subtitle, { color: h.onGradientTextMuted }]}
            numberOfLines={2}
          >
            {slide.subtitle}
          </Text>

          <TouchableOpacity
            onPress={handleCta}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={slide.ctaLabel}
            style={[
              styles.ctaButton,
              {
                backgroundColor: h.ctaBg,
                borderColor: h.ctaBorder,
              },
            ]}
          >
            <Text style={[styles.ctaText, { color: h.ctaText }]}>
              {slide.ctaLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Right: image or placeholder icon ── */}
        <View style={styles.imageBlock}>
          {slide.imageUrl ? (
            <Image
              source={{ uri: slide.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor: h.placeholderBg,
                  borderColor: h.placeholderBorder,
                },
              ]}
            >
              <Ionicons
                name={slide.placeholderIcon as any}
                size={44}
                color={h.placeholderIcon}
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
  circleTopRight: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -50,
    right: -40,
  },
  circleBottomLeft: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
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
    marginBottom: Spacing.xs,
    // color set inline
  },
  subtitle: {
    ...Typography.small,
    lineHeight: 18,
    marginBottom: Spacing.md,
    // color set inline
  },
  ctaButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    // backgroundColor + borderColor set inline
  },
  ctaText: {
    ...Typography.buttonSmall,
    // color set inline
  },
  imageBlock: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor + borderColor set inline
  },
});

export const PromoCard = React.memo(PromoCardBase);