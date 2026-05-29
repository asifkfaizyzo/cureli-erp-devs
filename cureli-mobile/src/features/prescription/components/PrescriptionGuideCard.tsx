// src/features/prescription/components/PrescriptionGuideCard.tsx
//
// Continuous dashed line from box edge to number circle.
// Left 60% has blue background via absolute layer.
// Right 40% stays card-colored.
// Labels align consistently because the connector stretches with flex: 1.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";

const GUIDE_ITEMS = [
  {
    boxWidth: 90,
    boxHeight: 42,
    boxLabel: "Dr. Abc\nMBBS, MD",
    num: "1",
    text: "Doctor's details",
  },
  {
    boxWidth: 100,
    boxHeight: 28,
    boxLabel: "08/01/2026",
    num: "2",
    text: "Date of prescription",
  },
  {
    boxWidth: 120,
    boxHeight: 42,
    boxLabel: "Patient Name\n56 M",
    num: "3",
    text: "Patient's details",
  },
  {
    boxWidth: 145,
    boxHeight: 62,
    boxLabel: "Medicine details\nabcdef 650 mg - 2",
    num: "4",
    text: "Medicine details",
  },
];

const RULES = [
  "File size should be less than 25MB",
  "Can be PDF / JPG / JPEG / PNG formats",
  "Prescription should be less than 1 week old",
];

// ── Single continuous dashed line ─────────────────────────────
// This stretches automatically, so it always touches both ends.

function DashedLine() {
  return <View style={styles.dashedLine} />;
}

// ── Main component ────────────────────────────────────────────

function PrescriptionGuideCardBase() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Make sure your prescription contains the following elements as shown:
      </Text>

      <View style={styles.guideFrame}>
        {/* Left 60% blue background */}
        <View style={styles.blueBg} />

        {/* Rows */}
        <View style={styles.rows}>
          {GUIDE_ITEMS.map((item, index) => (
            <View key={index} style={styles.row}>
              {/* Box */}
              <View
                style={[
                  styles.dashedBox,
                  {
                    width: item.boxWidth,
                    height: item.boxHeight,
                  },
                ]}
              >
                <Text style={styles.boxLabel}>{item.boxLabel}</Text>
              </View>

              {/* Continuous line touching box and circle */}
              <DashedLine />

              {/* Number */}
              <View style={styles.circle}>
                <Text style={styles.circleText}>{item.num}</Text>
              </View>

              {/* Label */}
              <Text
                style={[styles.labelText, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rules */}
      <View style={styles.rules}>
        {RULES.map((rule, index) => (
          <View key={index} style={styles.ruleRow}>
            <View style={styles.ruleDot} />
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
    marginBottom: 18,
  },

  // Guide frame
  guideFrame: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 18,
    minHeight: 230,
  },

  // Left blue part only
  blueBg: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "60%",
    backgroundColor: "#EEF5FC",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },

  rows: {
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 14,
  },

  // One full-width row
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Dotted prescription field box
  dashedBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B7C2D3",
    borderRadius: 8,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  boxLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#8899AA",
  },

  // THIS is the important fix:
  // A real stretched dashed border, not a fixed set of segments.
  dashedLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B7C2D3",
    marginHorizontal: 0, // touches both box and circle
  },

  // Number circle
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#444444",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  circleText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    lineHeight: 12,
  },

  // Label text starts consistently after circle
  labelText: {
    width: 86,
    marginLeft: 5,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    lineHeight: 14,
  },

  // Rules
  rules: {
    gap: 10,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ruleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#707070",
    marginRight: 10,
  },
  ruleText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#707070",
    flex: 1,
  },
});

export const PrescriptionGuideCard = React.memo(PrescriptionGuideCardBase);