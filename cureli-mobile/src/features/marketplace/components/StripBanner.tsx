// src/features/marketplace/components/StripBanner.tsx

import React, { useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { RemoteStripBanner } from "../api/banners.api";

interface StripBannerProps {
  strip: RemoteStripBanner;
}

function StripBannerBase({ strip }: StripBannerProps) {
  const handlePress = useCallback(async () => {
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
  }, [strip]);

  if (!strip.imageUrl) return null;

  const isTappable = strip.ctaAction && strip.ctaAction !== "NONE";

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={isTappable ? handlePress : undefined}
        activeOpacity={isTappable ? 0.85 : 1}
        accessibilityRole={isTappable ? "button" : "image"}
        accessibilityLabel="Promotional banner"
      >
        <Image
          source={{ uri: strip.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 80,    // short strip — adjust to taste
    borderRadius: Radius.lg,
  },
});

export const StripBanner = React.memo(StripBannerBase);