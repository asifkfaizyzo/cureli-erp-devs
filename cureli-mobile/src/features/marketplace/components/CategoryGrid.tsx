// src/features/marketplace/components/CategoryGrid.tsx
//
// Home grid:
// 3 columns × 3 rows = 9 slots
// 8 category cards + 1 navigation card
//
// Exact row layout:
// 1 2 3
// 4 5 6
// 7 8 More

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { Spacing } from "../../../theme/spacing";
import { CategoryCard, type GridItem } from "./CategoryCard";
import { CategoryGridSkeleton } from "./CategoryGridSkeleton";
import type { MedicineCategory } from "../types/marketplace.types";

const COLUMNS = 3;
const SLOTS_PER_PAGE = 8;
const GAP = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base * 2;

interface CategoryGridProps {
  categories: MedicineCategory[];
  isLoading: boolean;
  selectedKey: string | null;
  onSelectCategory: (key: string | null) => void;
}

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function CategoryGridBase({
  categories,
  isLoading,
  selectedKey,
  onSelectCategory,
}: CategoryGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [page, setPage] = useState(0);

  const cardWidth =
    (screenWidth - HORIZONTAL_PADDING - GAP * (COLUMNS - 1)) / COLUMNS;

  const totalPages = Math.max(1, Math.ceil(categories.length / SLOTS_PER_PAGE));
  const isMultiPage = totalPages > 1;
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  // If selected from "View all", jump to its page on Home.
  useEffect(() => {
    if (!selectedKey) return;

    const index = categories.findIndex((c) => c.key === selectedKey);
    if (index === -1) return;

    const selectedPage = Math.floor(index / SLOTS_PER_PAGE);
    if (selectedPage !== page) {
      setPage(selectedPage);
    }
  }, [selectedKey, categories, page]);

  const gridItems = useMemo<GridItem[]>(() => {
    const start = page * SLOTS_PER_PAGE;
    const current = categories.slice(start, start + SLOTS_PER_PAGE);

    const items: GridItem[] = current.map((cat) => ({
      type: "category",
      data: cat,
    }));

    while (items.length < SLOTS_PER_PAGE) {
      items.push({ type: "empty" });
    }

    if (!isMultiPage) {
      items.push({ type: "empty" });
    } else if (isLastPage) {
      items.push({ type: "back" });
    } else {
      items.push({ type: "next" });
    }

    return items;
  }, [categories, page, isMultiPage, isLastPage]);

  const rows = useMemo(() => chunkIntoRows(gridItems, COLUMNS), [gridItems]);

  const handlePressCategory = useCallback(
    (key: string) => {
      onSelectCategory(selectedKey === key ? null : key);
    },
    [onSelectCategory, selectedKey],
  );

  const handleNext = useCallback(() => {
    if (!isLastPage) {
      setPage((prev) => prev + 1);
    }
  }, [isLastPage]);

  const handleBack = useCallback(() => {
    if (!isFirstPage) {
      setPage((prev) => prev - 1);
    }
  }, [isFirstPage]);

  if (isLoading) {
    return <CategoryGridSkeleton columns={3} count={9} />;
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item, colIndex) => (
            <CategoryCard
              key={
                item.type === "category"
                  ? item.data.key
                  : `${item.type}-${rowIndex}-${colIndex}`
              }
              item={item}
              cardWidth={cardWidth}
              selected={item.type === "category" && item.data.key === selectedKey}
              onPressCategory={handlePressCategory}
              onPressNext={handleNext}
              onPressBack={handleBack}
            />
          ))}
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
});

export const CategoryGrid = React.memo(CategoryGridBase);