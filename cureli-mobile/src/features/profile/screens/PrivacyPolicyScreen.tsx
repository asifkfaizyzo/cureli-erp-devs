import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";

const LAST_UPDATED = "October 2026";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: "Cureli ('we', 'our', or 'us') is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services. By using Cureli, you consent to the practices described in this policy.",
  },
  {
    title: "2. Information We Collect",
    body: "We collect information you provide directly (name, phone number, email, date of birth, gender, delivery addresses, prescription images, and payment details). We also collect information automatically such as device identifiers, IP address, app usage data, order history, and location data when you grant permission.",
  },
  {
    title: "3. How We Use Your Information",
    body: "Your data is used to: process orders and deliveries, verify prescriptions with partner pharmacies, personalize your experience, send order status updates and promotional communications, prevent fraud, comply with regulatory requirements, and improve our services.",
  },
  {
    title: "4. Prescription Data",
    body: "Prescription images uploaded to the app are treated as sensitive health information. They are shared only with the pharmacy fulfilling your order. Prescription files are automatically deleted after your order is completed, cancelled, or rejected in accordance with data minimization practices.",
  },
  {
    title: "5. Sharing With Third Parties",
    body: "We share your information with: partner pharmacies (to fulfill orders), delivery riders (contact & address), payment processors (for transactions), SMS/email service providers (for OTPs and notifications), and law enforcement when required by law. We do not sell your personal data to third parties.",
  },
  {
    title: "6. Data Security",
    body: "We use industry-standard encryption (TLS in transit, AES at rest), secure OTP-based authentication, and access controls to protect your data. However, no system is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    title: "7. Your Rights",
    body: "You may access, correct, or delete your personal information at any time from your profile. You can request account deletion via Profile → Delete Account. You may opt out of promotional communications via Notification Preferences.",
  },
  {
    title: "8. Location Data",
    body: "With your permission, we access your device location to show nearby pharmacies, calculate delivery times, and validate delivery addresses. You may revoke this permission at any time in your device settings.",
  },
  {
    title: "9. Children's Privacy",
    body: "Cureli is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. Family members added to your account remain your responsibility.",
  },
  {
    title: "10. Data Retention",
    body: "Order history is retained as required by pharmaceutical and tax regulations (typically 8 years). Account data is retained until you request deletion. Some information may be retained in anonymized form for analytics.",
  },
  {
    title: "11. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Material changes will be communicated via in-app notification or email. Continued use of the app after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "12. Contact Us",
    body: "For questions or concerns about this policy or your data, please contact us at info@cureliofficial.com or raise a ticket via Profile → Support & Tickets.",
  },
];

export function PrivacyPolicyScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Header */}
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
          Privacy Policy
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <View
          style={[
            styles.introCard,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <MaterialIcons name="privacy-tip" size={28} color={brandColor} />
          <View style={styles.introText}>
            <Text
              style={[
                styles.introTitle,
                { color: colors.text.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              Your Privacy Matters
            </Text>
            <Text
              style={[
                styles.introSubtitle,
                { color: colors.text.muted, fontFamily: "Inter_400Regular" },
              ]}
            >
              Last updated: {LAST_UPDATED}
            </Text>
          </View>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              {section.title}
            </Text>
            <Text
              style={[
                styles.sectionBody,
                { color: colors.text.secondary, fontFamily: "Inter_400Regular" },
              ]}
            >
              {section.body}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              { color: colors.text.muted, fontFamily: "Inter_400Regular" },
            ]}
          >
            © 2026 Cureli ORB Pvt. Ltd. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerTitle: { fontSize: 16 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  introText: { flex: 1, gap: 2 },
  introTitle: { fontSize: 15 },
  introSubtitle: { fontSize: 12 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 14 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  footer: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 12,
  },
  footerText: { fontSize: 11, textAlign: "center" },
});