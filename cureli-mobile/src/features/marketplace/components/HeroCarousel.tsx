// src/features/marketplace/components/HeroCarousel.tsx
//
// Auto-sliding hero carousel using react-native-reanimated-carousel v4.
//
// Features:
//   — Auto-slides every HERO_AUTO_SLIDE_INTERVAL_MS ms.
//   — Infinite loop.
//   — Pagination dots synced to active index via Reanimated shared value.
//   — Each slide is a PromoCard (gradient + text + icon + CTA).
//   — Horizontal margins so cards don't bleed to screen edges.
//
// v4 API notes (differs from v3):
//   — Default export is `Carousel`.
//   — `width` is required and must be the full render width of the item.
//   — `onProgressChange` gives a fine-grained progress value; we derive
//     the active index from it for the dots.

import React, { useCallback, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { Spacing } from "../../../theme/spacing";
import { PromoCard } from "./PromoCard";
import {
  HERO_BANNERS,
  HERO_CAROUSEL_HEIGHT,
  HERO_AUTO_SLIDE_INTERVAL_MS,
  type HeroBannerSlide,
} from "../constants/marketplace.constants";
import { useTheme } from "../../../theme/ThemeContext";

// ── Constants ─────────────────────────────────────────────────

// Horizontal margin on each side so the card doesn't bleed to edges.
const SIDE_MARGIN = Spacing.base;

// ── Dot indicator ─────────────────────────────────────────────

interface DotsProps {
  count: number;
  activeIndex: number;
}

function Dots({ count, activeIndex }: DotsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex
              ? [styles.dotActive, { backgroundColor: colors.brand.primary }]
              : [styles.dotInactive, { backgroundColor: colors.border.brand }],
          ]}
        />
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────

function HeroCarouselBase() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - SIDE_MARGIN * 2;

  const [activeIndex, setActiveIndex] = useState(0);

  const renderItem = useCallback(
    ({ item, index }: { item: HeroBannerSlide; index: number }) => (
      <PromoCard slide={item} width={cardWidth} />
    ),
    [cardWidth],
  );

  const onSnapToItem = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <View style={styles.wrapper}>
      <Carousel
        data={HERO_BANNERS}
        renderItem={renderItem}
        width={cardWidth}
        height={HERO_CAROUSEL_HEIGHT}
        loop
        autoPlay
        autoPlayInterval={HERO_AUTO_SLIDE_INTERVAL_MS}
        onSnapToItem={onSnapToItem}
        style={styles.carousel}
        // v4: scrollAnimationDuration controls snap animation speed
        scrollAnimationDuration={400}
      />

      <Dots count={HERO_BANNERS.length} activeIndex={activeIndex} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.lg,
    // Left margin so carousel aligns with page content.
    marginLeft: SIDE_MARGIN,
  },
  carousel: {
    // Carousel itself needs no extra horizontal styling —
    // cardWidth already accounts for margins.
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: 6,
  },
  dot: {
    borderRadius: 4,
    height: 6,
  },
  dotActive: {
    width: 20,
  },
  dotInactive: {
    width: 6,
  },
});

export const HeroCarousel = React.memo(HeroCarouselBase);