// src/components/RemoteImage.tsx

import React, { useEffect, useState, useCallback } from "react";
import { View, ViewStyle, StyleProp, ImageStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { getPlaceholder } from "../utils/placeholderImage";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// ── Fix 1: use proper RN transform type instead of object[] ──
type RNTransform = ImageStyle["transform"];

interface RemoteImageProps {
  uri: string | null | undefined;
  style: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  mode?: "medicine" | "shop";
  fallbackIcon?: IoniconName;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
  fallbackBg?: string;
  imageTransform?: RNTransform;
}

export function RemoteImage({
  uri,
  style,
  resizeMode = "contain",
  mode = "shop",
  fallbackIcon = "storefront-outline",
  fallbackIconSize = 22,
  fallbackIconColor,
  fallbackBg,
  imageTransform,
}: RemoteImageProps) {
  const { isDark, colors } = useTheme();
  const placeholder = getPlaceholder(isDark);

  const imageOpacity = useSharedValue(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [uri]);

  // ── Fix 2: keep animated style as ImageStyle-compatible ──
  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    ...(imageTransform ? { transform: imageTransform } : {}),
  }));

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageReady || imageError;
  const iconColor = fallbackIconColor ?? colors.text.brand;

  return (
    <View style={style}>
      {/* ── Placeholder ── */}
      {showPlaceholder ? (
        mode === "medicine" ? (
          // ── Fix 3: fill 100% and let resizeMode="contain" handle sizing ──
          // Do NOT override width to 80% — that breaks the parent clip.
          // The placeholder image itself has natural padding/whitespace
          // that makes it look correctly sized inside the container.
          <Animated.Image
            source={placeholder}
            style={placeholderFillStyle}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              placeholderFillStyle,
              {
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: fallbackBg ?? "transparent",
              },
            ]}
          >
            <Ionicons
              name={fallbackIcon}
              size={fallbackIconSize}
              color={iconColor}
            />
          </View>
        )
      ) : null}

      {/* ── Real image ── */}
      {uri && !imageError ? (
        <Animated.Image
          source={{ uri }}
          // ── Fix 4: cast style array to ImageStyle to satisfy TS ──
          style={[realImageFillStyle, realImageAnimatedStyle] as any}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
    </View>
  );
}

const placeholderFillStyle: ImageStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
};

const realImageFillStyle: ImageStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
};