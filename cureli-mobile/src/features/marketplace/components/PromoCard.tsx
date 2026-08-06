// src/features/marketplace/components/PromoCard.tsx

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { HeroBannerSlide } from "../constants/marketplace.constants";

// ── Props ─────────────────────────────────────────────────────

interface PromoCardProps {
  slide:  HeroBannerSlide;
  width:  number;
  height: number;
}

// ── Angle → LinearGradient vectors ────────────────────────────
// CSS / cadmin angle: 0° = bottom→top, 90° = left→right, 135° = diagonal
// expo-linear-gradient: start/end are {x,y} in 0..1 space

function angleToVectors(deg: number): {
  start: { x: number; y: number };
  end:   { x: number; y: number };
} {
  const rad = (deg * Math.PI) / 180;
  return {
    start: { x: 0.5 - Math.sin(rad) / 2, y: 0.5 + Math.cos(rad) / 2 },
    end:   { x: 0.5 + Math.sin(rad) / 2, y: 0.5 - Math.cos(rad) / 2 },
  };
}

// ── Component ─────────────────────────────────────────────────

function PromoCardBase({ slide, width, height }: PromoCardProps) {
  const { colors } = useTheme();
  const h = colors.hero;

  // Use cadmin custom colors when both are set, otherwise fall back to theme index
  const gradient: [string, string] =
    slide.gradientColor1 && slide.gradientColor2
      ? [slide.gradientColor1, slide.gradientColor2]
      : h.gradients[slide.gradientIndex] ?? h.gradients[0] ?? ["#333", "#666"];

  // Use cadmin angle when custom colors are active, otherwise default diagonal
  const { start: gradientStart, end: gradientEnd } = angleToVectors(
    slide.gradientColor1 && slide.gradientColor2 && slide.gradientAngle != null
      ? slide.gradientAngle
      : 135,
  );

  const isFullImage = slide.layoutMode === "FULL_IMAGE" && !!slide.imageUrl;

  const handleCta = useCallback(async () => {
    if (!slide.ctaRoute) return;

    if (
      slide.ctaRoute.startsWith("http://") ||
      slide.ctaRoute.startsWith("https://")
    ) {
      const canOpen = await Linking.canOpenURL(slide.ctaRoute);
      if (canOpen) {
        await Linking.openURL(slide.ctaRoute);
      } else {
        Alert.alert("Cannot open link");
      }
      return;
    }

    router.push(slide.ctaRoute as any);
  }, [slide.ctaRoute]);

  const hasText = !!slide.title || !!slide.subtitle;
  const hasCta  = !!slide.ctaLabel && !!slide.ctaRoute;

  // ── Full Image Mode ─────────────────────────────────────────
  if (isFullImage) {
    return (
      <TouchableOpacity
        onPress={hasCta ? handleCta : undefined}
        activeOpacity={hasCta ? 0.85 : 1}
        accessibilityRole={hasCta ? "button" : "image"}
        accessibilityLabel={slide.title || "Promotional banner"}
        style={[styles.card, { width, height }]}
      >
        <Image
          source={{ uri: slide.imageUrl! }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />

        {(hasText || hasCta) && (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={styles.fullImageOverlay}
          >
            <View style={styles.fullImageTextBlock}>
              {!!slide.title && (
                <Text style={styles.fullImageTitle} numberOfLines={1}>
                  {slide.title}
                </Text>
              )}
              {!!slide.subtitle && (
                <Text style={styles.fullImageSubtitle} numberOfLines={1}>
                  {slide.subtitle}
                </Text>
              )}
              {hasCta && (
                <View style={styles.fullImageCtaBadge}>
                  <Text style={styles.fullImageCtaText}>
                    {slide.ctaLabel}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  }

  // ── Text + Image Mode ───────────────────────────────────────
  return (
    <LinearGradient
      colors={gradient}
      start={gradientStart}
      end={gradientEnd}
      style={[styles.card, { width, height }]}
    >
      <View
        style={[styles.circleTopRight, { backgroundColor: h.decorCircle }]}
        pointerEvents="none"
      />
      <View
        style={[styles.circleBottomLeft, { backgroundColor: h.decorCircleSecondary }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.textBlock}>
          {!!slide.title && (
            <Text
              style={[styles.title, { color: h.onGradientText }]}
              numberOfLines={2}
            >
              {slide.title}
            </Text>
          )}
          {!!slide.subtitle && (
            <Text
              style={[styles.subtitle, { color: h.onGradientTextMuted }]}
              numberOfLines={2}
            >
              {slide.subtitle}
            </Text>
          )}

          {hasCta && (
            <TouchableOpacity
              onPress={handleCta}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={slide.ctaLabel}
              style={[
                styles.ctaButton,
                {
                  backgroundColor: h.ctaBg,
                  borderColor:     h.ctaBorder,
                },
              ]}
            >
              <Text style={[styles.ctaText, { color: h.ctaText }]}>
                {slide.ctaLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
                  borderColor:     h.placeholderBorder,
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
    borderRadius:      Radius.xl,
    overflow:          "hidden",
    justifyContent:    "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.lg,
  },

  // ── Full Image Mode ─────────────────────────────────────────
  fullImageOverlay: {
    position:          "absolute",
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.md,
    paddingTop:        Spacing["2xl"],
  },
  fullImageTextBlock: {
    gap: 2,
  },
  fullImageTitle: {
    ...Typography.h3,
    color: "#ffffff",
  },
  fullImageSubtitle: {
    ...Typography.small,
    color:      "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  fullImageCtaBadge: {
    alignSelf:         "flex-start",
    marginTop:         Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   4,
    backgroundColor:   "rgba(255,255,255,0.92)",
    borderRadius:      Radius.sm,
  },
  fullImageCtaText: {
    ...Typography.buttonSmall,
    color:    "#111111",
    fontSize: 11,
  },

  // ── Text + Image Mode ───────────────────────────────────────
  circleTopRight: {
    position:     "absolute",
    width:        160,
    height:       160,
    borderRadius: 80,
    top:          -50,
    right:        -40,
  },
  circleBottomLeft: {
    position:     "absolute",
    width:        110,
    height:       110,
    borderRadius: 55,
    bottom:       -30,
    left:         -20,
  },
  content: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            Spacing.base,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
    lineHeight:   18,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    alignSelf:         "flex-start",
    borderWidth:       1,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs + 2,
  },
  ctaText: {
    ...Typography.buttonSmall,
  },
  imageBlock: {
    width:          88,
    height:         88,
    alignItems:     "center",
    justifyContent: "center",
  },
  image: {
    width:        80,
    height:       80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    width:          80,
    height:         80,
    borderRadius:   40,
    borderWidth:    1,
    alignItems:     "center",
    justifyContent: "center",
  },
});

export const PromoCard = React.memo(PromoCardBase);