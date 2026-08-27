// cureli-mobile/src/features/cart/components/LoyaltyPointsSection.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Radius } from "../../../theme/radius";
import { loyaltyApi, LoyaltySummary } from "../../marketplace/api/loyalty.api";
import { useCheckoutStore } from "../../../store/checkoutStore";

export function LoyaltyPointsSection({ subtotal }: { subtotal: number }) {
  const { colors } = useTheme();
  const { loyaltyPointsToRedeem, setLoyaltyPointsToRedeem, breakdown } =
    useCheckoutStore();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await loyaltyApi.getSummary();
        setSummary(res.data.data);
      } catch (err) {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.card, alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>
    );
  }

  // If program is disabled in CAdmin, hide the card completely
  if (!summary || !summary.config.isEnabled) {
    return null;
  }

  // ── 1. Calculate Estimated Points Earned ────────────────────
  const earnRate = summary.config.earnRateAmount || 100;
  const isTotalPayableBasis = (summary.config as any)?.earnBasis !== "SUBTOTAL";

  const couponDiscount = breakdown?.coupon_discount ?? 0;
  const effectiveSubtotal = Math.max(0, subtotal - couponDiscount);

  // If basis is TOTAL_PAYABLE, use grand_total (final payable amount).
  // If quote hasn't loaded yet, fallback to subtotal.
  const earningAmount = isTotalPayableBasis
    ? (breakdown ? breakdown.grand_total : subtotal)
    : effectiveSubtotal;

  const estimatedPointsEarned = Math.floor(earningAmount / earnRate);

  // ── 2. Redemption Eligibility ──────────────────────────────
  const minRedeemPoints = summary.config.minRedeemPoints;
  const minOrderAmount = summary.config.minOrderAmount;
  const hasEnoughPointsToRedeem = summary.balance >= minRedeemPoints;
  const isOrderValueEligible = subtotal >= minOrderAmount;

  const handleToggle = (value: boolean) => {
    if (value) {
      let pointsToRedeem = summary.balance;

      if (summary.config.maxRedeemPoints) {
        pointsToRedeem = Math.min(
          pointsToRedeem,
          summary.config.maxRedeemPoints,
        );
      }

      if (summary.config.maxRedeemPercent) {
        const maxPercentVal =
          (subtotal * summary.config.maxRedeemPercent) / 100;
        const maxPointsPercent = Math.floor(
          maxPercentVal / summary.config.redemptionValue,
        );
        pointsToRedeem = Math.min(pointsToRedeem, maxPointsPercent);
      }

      setLoyaltyPointsToRedeem(pointsToRedeem);
    } else {
      setLoyaltyPointsToRedeem(0);
    }
  };

  const isApplied = loyaltyPointsToRedeem > 0;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.card }]}
    >
      {/* ── Top Header: Title & Redemption Switch (if eligible) ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="stars" size={20} color={colors.brand.primary} />
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {hasEnoughPointsToRedeem ? "Use Loyalty Points" : "Cureli Rewards"}
          </Text>
        </View>

        {hasEnoughPointsToRedeem && (
          <Switch
            value={isApplied}
            onValueChange={handleToggle}
            disabled={!isOrderValueEligible}
            trackColor={{
              false: colors.border.default,
              true: colors.brand.primary,
            }}
          />
        )}
      </View>

      {/* ── Redemption Info / Balances ── */}
      {hasEnoughPointsToRedeem ? (
        <>
          <Text style={[styles.desc, { color: colors.text.secondary }]}>
            Available:{" "}
            <Text style={{ fontWeight: "bold", color: colors.text.primary }}>
              {summary.balance} points
            </Text>{" "}
            (₹{(summary.balance * summary.config.redemptionValue).toFixed(2)}{" "}
            value)
          </Text>

          {isApplied && breakdown && breakdown.loyalty_discount > 0 && (
            <View
              style={[
                styles.discountTag,
                { backgroundColor: colors.status.successBg },
              ]}
            >
              <Text
                style={[styles.discountText, { color: colors.status.success }]}
              >
                Saving ₹{breakdown.loyalty_discount.toFixed(2)} with{" "}
                {breakdown.loyalty_points_redeemed} points
              </Text>
            </View>
          )}

          {!isOrderValueEligible && (
            <Text style={[styles.warningText, { color: colors.status.error }]}>
              Min. item spend of ₹{minOrderAmount} required to redeem points.
            </Text>
          )}
        </>
      ) : (
        <Text style={[styles.desc, { color: colors.text.secondary }]}>
          Current Balance:{" "}
          <Text style={{ fontWeight: "bold", color: colors.text.primary }}>
            {summary.balance} points
          </Text>{" "}
          (Redemption unlocks at {minRedeemPoints} pts)
        </Text>
      )}

      {/* ── Estimated Points Earned Badge ── */}
      {estimatedPointsEarned > 0 && (
        <View
          style={[
            styles.earnRewardRow,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.earnLeft}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.status.successBg },
              ]}
            >
              <MaterialIcons
                name="add"
                size={14}
                color={colors.status.success}
              />
            </View>
            <View>
              <Text style={[styles.earnTitle, { color: colors.text.primary }]}>
                Earn{" "}
                <Text
                  style={{ color: colors.status.success, fontWeight: "bold" }}
                >
                  +{estimatedPointsEarned} Points
                </Text>{" "}
                with this order
              </Text>
              <Text style={[styles.earnSub, { color: colors.text.muted }]}>
                Credited automatically upon delivery completion
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: Radius.md,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  discountTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  discountText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  warningText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
  earnRewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  earnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  earnTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  earnSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});