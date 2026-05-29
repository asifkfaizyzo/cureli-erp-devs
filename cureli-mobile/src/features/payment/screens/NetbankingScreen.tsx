// src/features/payment/screens/NetbankingScreen.tsx
//
// Bank selection screen for netbanking.
// Tapping a bank selects it and goes back.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { usePaymentStore } from "../../../store/paymentStore";

const POPULAR_BANKS = [
  { id: "sbi", name: "State Bank of India", icon: "business-outline" },
  { id: "hdfc", name: "HDFC Bank", icon: "business-outline" },
  { id: "icici", name: "ICICI Bank", icon: "business-outline" },
  { id: "axis", name: "Axis Bank", icon: "business-outline" },
  { id: "kotak", name: "Kotak Mahindra Bank", icon: "business-outline" },
  { id: "bob", name: "Bank of Baroda", icon: "business-outline" },
  { id: "pnb", name: "Punjab National Bank", icon: "business-outline" },
  { id: "canara", name: "Canara Bank", icon: "business-outline" },
  { id: "union", name: "Union Bank of India", icon: "business-outline" },
  { id: "idbi", name: "IDBI Bank", icon: "business-outline" },
  { id: "federal", name: "Federal Bank", icon: "business-outline" },
  { id: "indusind", name: "IndusInd Bank", icon: "business-outline" },
];

export function NetbankingScreen() {
  const { colors } = useTheme();
  const setSelectedMethod = usePaymentStore((s) => s.setSelectedMethod);

  const [search, setSearch] = useState("");

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSelectBank = useCallback(
    (bank: (typeof POPULAR_BANKS)[0]) => {
      setSelectedMethod({
        id: `bank-${bank.id}`,
        label: `${bank.name} Netbanking`,
        type: "netbanking",
        icon: "business-outline",
      });

      router.back();
      setTimeout(() => router.back(), 100);
    },
    [setSelectedMethod],
  );

  const filtered = search.trim()
    ? POPULAR_BANKS.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      )
    : POPULAR_BANKS;

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
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Netbanking
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.input,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.text.faint} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search bank"
            placeholderTextColor={colors.text.faint}
          />
        </View>
      </View>

      {/* Bank list */}
      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.background.card },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>
          Popular Banks
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => handleSelectBank(item)}
              activeOpacity={0.75}
              style={[
                styles.bankRow,
                index < filtered.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
            >
              <View
                style={[
                  styles.bankIcon,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={colors.text.brand}
                />
              </View>

              <Text
                style={[styles.bankName, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text.faint}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 60,
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
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: { width: 36 },
  searchWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  listCard: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  bankRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  bankIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  bankName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});