// src/features/marketplace/components/HeaderFadeStrip.tsx
//
// Soft visual transition between the GradientHeader (purple gradient)
// and the page content below (typically white / off-white).
//
// Renders a short LinearGradient strip that fades from the header's
// bottom color (#a291f8) into the current theme page background,
// eliminating the hard color cut where the header ends.
//
// Usage:
//   Place as the first child inside a screen's ScrollView (or as the
//   ListHeaderComponent of a FlatList), before any other content.
//   It scrolls with the content — when the user scrolls up, the fade
//   naturally moves out of view.
//
// Height is tuned to feel like a soft handoff, not a second header.
// Adjust STRIP_HEIGHT if you want a longer/shorter transition.

import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../theme/ThemeContext";

// Matches the bottom color of GradientHeader's LinearGradient.
// If you change GRADIENT_COLORS in GradientHeader.tsx, update this too.
const HEADER_BOTTOM_COLOR = "#a291f8";

const STRIP_HEIGHT = 32;

function HeaderFadeStripBase() {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <LinearGradient
        colors={[HEADER_BOTTOM_COLOR, colors.background.page]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: STRIP_HEIGHT,
  },
  gradient: {
    flex: 1,
  },
});

export const HeaderFadeStrip = React.memo(HeaderFadeStripBase);