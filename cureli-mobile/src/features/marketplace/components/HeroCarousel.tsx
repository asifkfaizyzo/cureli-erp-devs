// src/features/marketplace/components/HeroCarousel.tsx
//
// Auto-sliding hero carousel using react-native-reanimated-carousel v4.

import React, { useCallback, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
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
const CARD_GAP = Spacing.md;

// ── Dot indicator ─────────────────────────────────────────────

interface DotsProps {
  count: number;
  activeIndex: number;
}

function Dots({ count, activeIndex }: DotsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
              {
                backgroundColor: isActive
                  ? colors.brand.primary
                  : colors.text.disabled,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────

function HeroCarouselBase() {
  const { width: screenWidth } = useWindowDimensions();

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
    marginTop: Spacing["2xl"],
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