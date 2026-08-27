// src/features/profile/screens/LoyaltyScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  loyaltyApi,
  LoyaltySummary,
  LoyaltyTransaction,
} from "../../marketplace/api/loyalty.api"; // ◄ Updated path
import { useTheme } from "../../../theme/ThemeContext";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function LoyaltyScreen() {
  const { colors, isDark } = useTheme();

  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [txns, setTxns] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const loadLoyaltyData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        loyaltyApi.getSummary(),
        loyaltyApi.getHistory(1, 100),
      ]);
      setSummary(sumRes.data.data);
      setTxns(histRes.data.data.transactions);
    } catch {
      // Quiet recovery
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const Header = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.card,
          borderBottomColor: colors.border.default,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="arrow-back"
          size={22}
          color={colors.text.primary}
        />
      </TouchableOpacity>
      <Text
        style={[
          styles.headerTitle,
          { color: colors.text.primary, fontFamily: "Inter_700Bold" },
        ]}
      >
        Loyalty Points & Rewards
      </Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      <Header />
      <FlatList
        data={txns}
        keyExtractor={(item) => item.transaction_id}
        refreshing={refreshing}
        onRefresh={() => loadLoyaltyData(true)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          summary ? (
            <View
              style={[styles.card, { backgroundColor: colors.background.card }]}
            >
              <Text
                style={[styles.cardLabel, { color: colors.text.secondary }]}
              >
                Current Balance
              </Text>
              <Text
                style={[styles.balanceText, { color: colors.text.primary }]}
              >
                {summary.balance}{" "}
                <Text style={{ fontSize: 16, color: colors.text.muted }}>
                  Points
                </Text>
              </Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border.subtle },
                ]}
              />
              <Text style={[styles.subValue, { color: colors.status.success }]}>
                Equivalent Cash Discount Value: ₹
                {(summary.balance * summary.config.redemptionValue).toFixed(2)}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="stars"
              size={48}
              color={colors.text.disabled}
            />
            <Text style={[styles.emptyText, { color: colors.text.primary }]}>
              No point transactions yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.text.muted }]}>
              Complete order checkouts to start earning rewards.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isAdd = item.type === "EARNED" || item.type === "ADMIN_ADJUST";
          return (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: colors.background.card,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isAdd
                        ? colors.status.successBg
                        : colors.status.errorBg,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={isAdd ? "arrow-upward" : "arrow-downward"}
                    size={16}
                    color={isAdd ? colors.status.success : colors.status.error}
                  />
                </View>
                <View>
                  <Text
                    style={[styles.rowTitle, { color: colors.text.primary }]}
                  >
                    {item.description}
                  </Text>
                  <Text style={[styles.rowDate, { color: colors.text.faint }]}>
                    {fmtDate(item.created_at)}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.rowPoints,
                  {
                    color: isAdd ? colors.status.success : colors.status.error,
                  },
                ]}
              >
                {isAdd ? "+" : "-"}
                {item.points} pts
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 32 },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceText: { fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 4 },
  divider: { height: 1, marginVertical: 14 },
  subValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyContainer: { padding: 48, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  }, // ◄ Fixed typo: justifyCenter -> justifyContent
  rowTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  rowDate: { fontSize: 11, fontFamily: "Inter_500Medium" },
  rowPoints: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
