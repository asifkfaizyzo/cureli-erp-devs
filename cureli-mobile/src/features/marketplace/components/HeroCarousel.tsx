// src/features/marketplace/components/HeroCarousel.tsx
//
// Auto-sliding hero carousel using react-native-reanimated-carousel v4.
//
// Features:
//   — Auto-slides every HERO_AUTO_SLIDE_INTERVAL_MS ms.
//   — Infinite loop.
//   — Pagination dots synced to active index.
//   — Each slide is a PromoCard (gradient + text + icon/image + CTA).
//   — Horizontal margins so cards don't bleed to screen edges.
//   — Gap between cards via width padding trick.

import React, { useCallback, useState } from "react";
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

const SIDE_MARGIN = Spacing.base;
const CARD_GAP = Spacing.md; // 12pt gap between cards

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

  // Carousel width includes the gap — each "slot" is card + gap.
  // The visible card is smaller by the gap amount.
  const slotWidth = screenWidth - SIDE_MARGIN * 2;
  const cardWidth = slotWidth - CARD_GAP;

  const [activeIndex, setActiveIndex] = useState(0);

  const renderItem = useCallback(
    ({ item }: { item: HeroBannerSlide; index: number }) => (
      <View style={styles.slideContainer}>
        <PromoCard slide={item} width={cardWidth} />
      </View>
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
        width={slotWidth}
        height={HERO_CAROUSEL_HEIGHT}
        loop
        autoPlay
        autoPlayInterval={HERO_AUTO_SLIDE_INTERVAL_MS}
        onSnapToItem={onSnapToItem}
        scrollAnimationDuration={500}
      />

      <Dots count={HERO_BANNERS.length} activeIndex={activeIndex} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.lg,
    marginHorizontal: SIDE_MARGIN,
  },
  slideContainer: {
    flex: 1,
    paddingRight: CARD_GAP,
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