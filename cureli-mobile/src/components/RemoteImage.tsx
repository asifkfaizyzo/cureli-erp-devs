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

  // ── LOG ──────────────────────────────────────────────────────
  // console.log('[RemoteImage] uri:', uri, '| mode:', mode);
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [uri]);

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
      {showPlaceholder ? (
        mode === "medicine" ? (
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

      {uri && !imageError ? (
        <Animated.Image
          source={{ uri }}
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