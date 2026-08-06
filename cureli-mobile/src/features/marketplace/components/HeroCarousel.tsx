// src/features/marketplace/components/HeroCarousel.tsx

import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { Spacing } from "../../../theme/spacing";
import { PromoCard } from "./PromoCard";
import {
  HERO_BANNER_ASPECT_RATIO,
  HERO_AUTO_SLIDE_INTERVAL_MS,
  type HeroBannerSlide,
} from "../constants/marketplace.constants";
import { useTheme } from "../../../theme/ThemeContext";

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

// ── Props ─────────────────────────────────────────────────────

interface HeroCarouselProps {
  slides: HeroBannerSlide[];
}

// ── Component ─────────────────────────────────────────────────

function HeroCarouselBase({ slides }: HeroCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();

  const slotWidth = screenWidth - SIDE_MARGIN * 2;
  const cardWidth = slotWidth - CARD_GAP;

  const cardHeight = useMemo(
    () => Math.round(cardWidth / HERO_BANNER_ASPECT_RATIO),
    [cardWidth],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const renderItem = useCallback(
    ({ item }: { item: HeroBannerSlide }) => (
      <View style={styles.slideContainer}>
        <PromoCard slide={item} width={cardWidth} height={cardHeight} />
      </View>
    ),
    [cardWidth, cardHeight],
  );

  const onSnapToItem = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  if (slides.length === 0) return null;

  // Single slide — no carousel chrome, no autoplay, no dots
  if (slides.length === 1) {
    return (
      <View style={styles.wrapper}>
        <PromoCard slide={slides[0]} width={cardWidth} height={cardHeight} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Carousel
        data={slides}
        renderItem={renderItem}
        width={slotWidth}
        height={cardHeight}
        loop
        autoPlay
        autoPlayInterval={HERO_AUTO_SLIDE_INTERVAL_MS}
        onSnapToItem={onSnapToItem}
        scrollAnimationDuration={500}
      />

      <Dots count={slides.length} activeIndex={activeIndex} />
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
