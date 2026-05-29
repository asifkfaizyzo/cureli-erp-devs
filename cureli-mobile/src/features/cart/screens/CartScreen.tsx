// src/features/cart/screens/CartScreen.tsx

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

import { DeliverySummaryCard } from "../components/DeliverySummaryCard";
import { BillDetailsCard } from "../components/BillDetailsCard";
import { CouponCard } from "../components/CouponCard";
import { DeliveryInstructionCard } from "../components/DeliveryInstructionCard";
import { StickyCheckoutBar } from "../components/StickyCheckoutBar";
import { RecommendationSection } from "../components/RecommendationSection";

import { useCartStore } from "../../../store/cartStore";

export function CartScreen() {
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handlePlaceOrder = useCallback(() => {
    router.push("/checkout" as any);
  }, []);

  const handleSeeAllProducts = useCallback(() => {
    router.push("/marketplace/categories" as any);
  }, []);

  // Empty cart state
  if (items.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: "#EEF5FC" }]}
        edges={["top"]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background.card,
              borderBottomColor: colors.border.subtle,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            My Cart
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Empty state */}
        <View style={styles.emptyState}>
          <Ionicons
            name="bag-outline"
            size={64}
            color={colors.text.faint}
          />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptySub, { color: colors.text.muted }]}>
            Add medicines to get started
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={[
              styles.emptyBtn,
              { backgroundColor: colors.brand.primary },
            ]}
          >
            <Text style={styles.emptyBtnText}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: "#EEF5FC" }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          My Cart
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Delivery + cart items */}
        <DeliverySummaryCard />

        {/* Recommendations */}
        <RecommendationSection />

        {/* See all products */}
        <TouchableOpacity
          onPress={handleSeeAllProducts}
          activeOpacity={0.8}
          style={styles.seeAllBtn}
          accessibilityRole="button"
          accessibilityLabel="See all products"
        >
          <Text style={styles.seeAllText}>See all Products →</Text>
        </TouchableOpacity>

        {/* Bill details */}
        <BillDetailsCard />

        {/* Coupon */}
        <CouponCard />

        {/* Delivery instructions */}
        <DeliveryInstructionCard />
      </ScrollView>

      {/* Sticky checkout bar */}
      <StickyCheckoutBar onPlaceOrder={handlePlaceOrder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h4,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  seeAllBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DDF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
  },
  seeAllText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#05015A",
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: "center",
  },
  emptySub: {
    ...Typography.body,
    textAlign: "center",
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    ...Typography.button,
    color: "#ffffff",
  },
});