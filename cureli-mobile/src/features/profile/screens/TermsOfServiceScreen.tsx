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
    title: "1. Acceptance of Terms",
    body: "By downloading, installing, or using the Cureli mobile application, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you must not use the app.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years of age to create an account and place orders on Cureli. By using the app, you represent that you meet this age requirement and have the legal capacity to enter into binding contracts.",
  },
  {
    title: "3. Account Registration",
    body: "You are responsible for maintaining the confidentiality of your account credentials and OTP codes. You agree to provide accurate, current, and complete information during registration and to update this information as needed. You are liable for all activities performed under your account.",
  },
  {
    title: "4. Nature of Service",
    body: "Cureli is a technology platform that connects users with licensed pharmacies. We do not sell, dispense, or manufacture medicines. All orders are fulfilled by independent partner pharmacies who are solely responsible for the quality, authenticity, and legality of the products delivered.",
  },
  {
    title: "5. Prescription Requirements",
    body: "For medicines classified as prescription-only (Schedule H, H1, X, and controlled substances under Indian law), you must upload a valid prescription from a registered medical practitioner. Orders without valid prescriptions may be rejected by the pharmacy without notice.",
  },
  {
    title: "6. Orders, Pricing & Payments",
    body: "All prices displayed are inclusive of applicable taxes unless stated otherwise. Prices are set by individual pharmacies and may change without notice. Payment is collected via authorized payment gateways. In case of order rejection or cancellation, refunds are processed to the original payment method within 5-7 business days.",
  },
  {
    title: "7. Delivery",
    body: "Delivery timelines shown are estimates provided by partner pharmacies and delivery partners. Cureli is not liable for delays caused by weather, traffic, incorrect addresses, or unavailability of the recipient. Delivery is available only within serviceable pincodes.",
  },
  {
    title: "8. Cancellations & Refunds",
    body: "You may cancel an order before the pharmacy accepts it. After acceptance, cancellations are subject to the pharmacy's discretion. Refunds for prepaid orders are processed within 5-7 business days. Delivery fees and service charges may be non-refundable for cancelled orders.",
  },
  {
    title: "9. Prohibited Uses",
    body: "You agree not to: use the app for illegal purposes, upload false prescriptions, order controlled substances without valid authorization, resell medicines, interfere with the app's functionality, attempt to gain unauthorized access to our systems, or use automated tools/bots to interact with the app.",
  },
  {
    title: "10. Intellectual Property",
    body: "All content, trademarks, logos, and software in the Cureli app are the property of Cureli ORB Pvt. Ltd. or its licensors. You are granted a limited, non-exclusive, non-transferable license to use the app for personal, non-commercial purposes only.",
  },
  {
    title: "11. Limitation of Liability",
    body: "Cureli, its affiliates, and partners shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app. Our maximum liability is limited to the amount paid by you for the specific order giving rise to the claim.",
  },
  {
    title: "12. Health Disclaimer",
    body: "Cureli does not provide medical advice. Information available in the app is for informational purposes only and should not be considered a substitute for professional medical consultation. Always consult a qualified healthcare provider before taking any medication.",
  },
  {
    title: "13. User Content",
    body: "By submitting reviews, ratings, or feedback, you grant Cureli a non-exclusive, royalty-free, perpetual license to use, display, and distribute such content. You represent that all user-submitted content is accurate and does not violate any third-party rights.",
  },
  {
    title: "14. Termination",
    body: "We reserve the right to suspend or terminate your account at any time for violations of these terms, fraudulent activity, or misuse of the platform. You may terminate your account at any time via Profile → Delete Account.",
  },
  {
    title: "15. Governing Law",
    body: "These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms or your use of the app shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.",
  },
  {
    title: "16. Changes to Terms",
    body: "We may modify these Terms of Service at any time. Material changes will be notified via the app or email. Your continued use of the app following such changes constitutes your acceptance of the modified terms.",
  },
  {
    title: "17. Contact",
    body: "For questions about these terms, please contact us at info@cureliofficial.com or raise a ticket via Profile → Support & Tickets.",
  },
];

export function TermsOfServiceScreen() {
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
          Terms of Service
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
          <MaterialIcons name="description" size={28} color={brandColor} />
          <View style={styles.introText}>
            <Text
              style={[
                styles.introTitle,
                { color: colors.text.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              Terms & Conditions
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

        {/* Notice */}
        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.status.warningBg,
              borderColor: colors.status.warning,
            },
          ]}
        >
          <MaterialIcons
            name="info-outline"
            size={16}
            color={colors.status.warning}
          />
          <Text
            style={[
              styles.noticeText,
              {
                color: colors.status.warning,
                fontFamily: "Inter_500Medium",
              },
            ]}
          >
            Please read these terms carefully before using Cureli.
          </Text>
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
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: { fontSize: 12, flex: 1 },
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