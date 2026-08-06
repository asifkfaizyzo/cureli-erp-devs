// src/features/marketplace/components/StripBannerCarousel.tsx

import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  FlatList,
  Dimensions,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { RemoteStripBanner } from "../api/banners.api";

const SCREEN_WIDTH     = Dimensions.get("window").width;
const STRIP_H          = 80;
const HORIZONTAL_MARGIN = Spacing.base;
const ITEM_WIDTH       = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
const AUTO_SCROLL_MS   = 4000;

interface Props {
  strips: RemoteStripBanner[];
}

function StripBannerCarouselBase({ strips }: Props) {
  // Filter to strips that actually have an image
  const visible = strips.filter((s) => !!s.imageUrl);

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<RemoteStripBanner>>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (visible.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % visible.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible.length]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handlePress = useCallback(async (strip: RemoteStripBanner) => {
    if (!strip.ctaAction || strip.ctaAction === "NONE") return;

    switch (strip.ctaAction) {
      case "ROUTE":
        if (strip.ctaActionValue) {
          router.push(strip.ctaActionValue as any);
        }
        break;

      case "CATEGORY":
        if (strip.ctaActionValue) {
          router.push(
            `/marketplace/category?key=${encodeURIComponent(strip.ctaActionValue)}` as any
          );
        }
        break;

      case "EXTERNAL_URL":
        if (strip.ctaActionValue) {
          const canOpen = await Linking.canOpenURL(strip.ctaActionValue);
          if (canOpen) {
            await Linking.openURL(strip.ctaActionValue);
          } else {
            Alert.alert("Cannot open link");
          }
        }
        break;
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: RemoteStripBanner }) => {
      const isTappable = item.ctaAction && item.ctaAction !== "NONE";
      return (
        <TouchableOpacity
          style={styles.item}
          onPress={isTappable ? () => handlePress(item) : undefined}
          activeOpacity={isTappable ? 0.85 : 1}
          accessibilityRole={isTappable ? "button" : "image"}
          accessibilityLabel="Promotional strip banner"
        >
          <Image
            source={{ uri: item.imageUrl! }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        </TouchableOpacity>
      );
    },
    [handlePress]
  );

  if (visible.length === 0) return null;

  // Single strip — no carousel chrome needed
  if (visible.length === 1) {
    return (
      <View style={styles.wrapper}>
        {renderItem({ item: visible[0] })}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={visible}
        keyExtractor={(item) => item.stripId}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {visible.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: HORIZONTAL_MARGIN,
    marginTop:        Spacing.md,
  },
  item: {
    width:        ITEM_WIDTH,
    height:       STRIP_H,
    borderRadius: Radius.lg,
    overflow:     "hidden",
  },
  image: {
    width:        "100%",
    height:       "100%",
    borderRadius: Radius.lg,
  },
  dots: {
    flexDirection:  "row",
    justifyContent: "center",
    alignItems:     "center",
    gap:            5,
    marginTop:      6,
  },
  dot: {
    height:       4,
    borderRadius: 2,
  },
  dotActive: {
    width:           20,
    backgroundColor: "#05015A",
  },
  dotInactive: {
    width:           6,
    backgroundColor: "#05015A40",
  },
});

export const StripBannerCarousel = React.memo(StripBannerCarouselBase);