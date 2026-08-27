// src/features/cart/components/CouponSection.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { couponsApi } from "../../marketplace/api/coupons.api"; // ◄ Updated path
import { useCheckoutStore } from "../../../store/checkoutStore";

export function CouponSection({ subtotal }: { subtotal: number }) {
  const { colors } = useTheme();
  const { couponCode, setCouponCode } = useCheckoutStore();
  
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await couponsApi.validateCoupon({
        code: inputCode.trim(),
        subtotal,
      });

      if (res.data?.data?.valid) {
        setCouponCode(res.data.data.coupon.code);
        setError(null);
      } else {
        setError(res.data?.data?.reason || "Invalid coupon code");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid coupon code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCouponCode(null);
    setInputCode("");
    setError(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Promo Codes</Text>

      {couponCode ? (
        <View style={[styles.appliedRow, { backgroundColor: colors.background.tint, borderColor: colors.status.successBg }]}>
          <View style={styles.appliedLeft}>
            <MaterialIcons name="local-offer" size={16} color={colors.status.success} />
            <Text style={[styles.appliedText, { color: colors.status.success }]}>
              {couponCode} APPLIED
            </Text>
          </View>
          <TouchableOpacity onPress={handleRemove} activeOpacity={0.7}>
            <MaterialIcons name="cancel" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Enter coupon code"
              placeholderTextColor={colors.text.faint}
              value={inputCode}
              onChangeText={(txt) => setInputCode(txt.toUpperCase())}
              autoCapitalize="characters"
              style={[styles.input, { borderColor: colors.border.default, color: colors.text.primary }]}
            />
            <TouchableOpacity
              onPress={handleApply}
              disabled={loading || !inputCode.trim()}
              style={[styles.applyBtn, { backgroundColor: colors.brand.primary }]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {error}
            </Text>
          )}
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
  title: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  applyBtn: {
    width: 80,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  appliedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appliedText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
});