// src/features/marketplace/components/CategoryGridSkeleton.tsx
//
// Skeleton grid matching the exact 3-column layout.

import React, { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

interface CategoryGridSkeletonProps {
  columns?: number;
  count?: number;
}

const GAP = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base * 2;

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function SkeletonTile({
  cardWidth,
  index,
}: {
  cardWidth: number;
  index: number;
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.45);

  const boxSize = Math.min(100, cardWidth - 6);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, index * 40);

    return () => clearTimeout(timer);
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Animated.View
        style={[
          styles.imageBox,
          {
            width: boxSize,
            height: boxSize,
            backgroundColor: colors.border.default,
          },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.label,
          {
            width: Math.min(cardWidth * 0.72, 72),
            backgroundColor: colors.border.default,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

function CategoryGridSkeletonBase({
  columns = 3,
  count = 9,
}: CategoryGridSkeletonProps) {
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth =
    (screenWidth - HORIZONTAL_PADDING - GAP * (columns - 1)) / columns;

  const rows = chunkIntoRows(Array.from({ length: count }), columns);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`skeleton-row-${rowIndex}`} style={styles.row}>
          {row.map((_, colIndex) => {
            const index = rowIndex * columns + colIndex;
            return (
              <SkeletonTile
                key={index}
                index={index}
                cardWidth={cardWidth}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: GAP,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageBox: {
    borderRadius: Radius.lg,
  },
  label: {
    height: 12,
    borderRadius: Radius.sm,
  },
});

export const CategoryGridSkeleton = React.memo(CategoryGridSkeletonBase);