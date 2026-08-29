import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { useDialog } from "../../../components/Dialog/DialogProvider";
import { TicketStatusBadge } from "../components/TicketStatusBadge";
import { supportApi } from "../api/support.api";
import type { CustomerTicketDetail } from "../../../types/support";

interface TicketDetailScreenProps {
  ticketId: string;
}

export function TicketDetailScreen({ ticketId }: TicketDetailScreenProps) {
  const { colors, isDark } = useTheme();
  const { alert: showAlert } = useDialog();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const [ticket, setTicket] = useState<CustomerTicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await supportApi.getTicketDetail(ticketId);
      setTicket(res.data.data.ticket);
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await supportApi.replyTicket(ticketId, replyText.trim());
      setReplyText("");
      if (res.data.data.reopened) {
        await showAlert({
          title: "Ticket Reopened",
          message: "Your reply has reopened this ticket for further review.",
          confirmLabel: "OK",
        });
      }
      fetchTicket();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Could not send reply";
      await showAlert({
        title: "Reply Failed",
        message: msg,
        confirmLabel: "OK",
      });
    } finally {
      setIsSendingReply(false);
    }
  }, [ticketId, replyText, showAlert, fetchTicket]);

  if (isLoading || !ticket) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  const isClosed = ticket.status === "CLOSED";
  const isResolved = ticket.status === "RESOLVED";

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
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
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            #{ticket.ticket_number}
          </Text>
          <TicketStatusBadge status={ticket.status} size="small" />
        </View>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flexOne}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Order Snapshot Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="receipt-outline"
                size={16}
                color={colors.text.muted}
              />
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Order Information
              </Text>
            </View>
            <View style={styles.orderMetaRow}>
              <Text
                style={[styles.orderMetaLabel, { color: colors.text.faint }]}
              >
                Order Number
              </Text>
              <Text
                style={[styles.orderMetaVal, { color: colors.text.primary }]}
              >
                {ticket.order.order_number}
              </Text>
            </View>
            {ticket.order.shop_name && (
              <View style={styles.orderMetaRow}>
                <Text
                  style={[styles.orderMetaLabel, { color: colors.text.faint }]}
                >
                  Pharmacy
                </Text>
                <Text
                  style={[styles.orderMetaVal, { color: colors.text.primary }]}
                >
                  {ticket.order.shop_name}
                </Text>
              </View>
            )}
            <View style={styles.orderMetaRow}>
              <Text
                style={[styles.orderMetaLabel, { color: colors.text.faint }]}
              >
                Amount
              </Text>
              <Text
                style={[styles.orderMetaVal, { color: colors.text.primary }]}
              >
                ₹{ticket.order.total_amount}
              </Text>
            </View>
          </View>

          {/* Issue Summary */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Text style={[styles.issueSubject, { color: colors.text.primary }]}>
              {ticket.subject}
            </Text>
            <Text style={[styles.issueDesc, { color: colors.text.secondary }]}>
              {ticket.description}
            </Text>

            {/* Photos */}
            {ticket.attachments.length > 0 && (
              <View style={styles.photoSection}>
                <Text style={[styles.photoLabel, { color: colors.text.faint }]}>
                  Uploaded Photos
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosRow}
                >
                  {ticket.attachments.map((att) => (
                    <TouchableOpacity
                      key={att.attachment_id}
                      onPress={() => att.url && setPreviewImage(att.url)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: att.url || "" }}
                        style={styles.photoThumb}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Conversation Timeline */}
          <View style={styles.timelineSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Conversation & Activity
            </Text>
            {ticket.activities.map((act) => {
              const isCustomer = act.actor_type === "CUSTOMER";
              const isStatusChange = act.type === "STATUS_CHANGED";

              if (isStatusChange) {
                return (
                  <View key={act.activity_id} style={styles.statusChangeRow}>
                    <View
                      style={[
                        styles.statusDivider,
                        { backgroundColor: colors.border.subtle },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusChangeText,
                        { color: colors.text.faint },
                      ]}
                    >
                      {act.message || `Status changed to ${act.to_status}`}
                    </Text>
                    <View
                      style={[
                        styles.statusDivider,
                        { backgroundColor: colors.border.subtle },
                      ]}
                    />
                  </View>
                );
              }

              return (
                <View
                  key={act.activity_id}
                  style={[
                    styles.msgBubble,
                    isCustomer ? styles.msgCustomer : styles.msgSupport,
                    {
                      backgroundColor: isCustomer
                        ? colors.background.tint
                        : colors.background.card,
                      borderColor: colors.border.default,
                    },
                  ]}
                >
                  <View style={styles.msgHeader}>
                    <Text
                      style={[
                        styles.msgAuthor,
                        {
                          color: isCustomer ? brandColor : colors.text.primary,
                        },
                      ]}
                    >
                      {isCustomer ? "You" : "Support Team"}
                    </Text>
                    <Text
                      style={[styles.msgTime, { color: colors.text.faint }]}
                    >
                      {new Date(act.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[styles.msgText, { color: colors.text.primary }]}
                  >
                    {act.message}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Reply Input Bar */}
        {!isClosed ? (
          <View
            style={[
              styles.replyBar,
              {
                backgroundColor: colors.background.card,
                borderTopColor: colors.border.default,
              },
            ]}
          >
            {isResolved && (
              <View
                style={[
                  styles.reopenWarning,
                  { backgroundColor: colors.status.warningBg },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={colors.status.warning}
                />
                <Text
                  style={[
                    styles.reopenWarningText,
                    { color: colors.status.warning },
                  ]}
                >
                  Replying will reopen this ticket.
                </Text>
              </View>
            )}
            <View style={styles.replyInputRow}>
              <TextInput
                style={[
                  styles.replyInput,
                  {
                    backgroundColor: colors.background.elevated,
                    color: colors.text.primary,
                    borderColor: colors.border.default,
                  },
                ]}
                placeholder="Type a reply..."
                placeholderTextColor={colors.text.faint}
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: replyText.trim()
                      ? brandColor
                      : colors.background.elevated,
                  },
                ]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || isSendingReply}
                activeOpacity={0.8}
              >
                {isSendingReply ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={replyText.trim() ? "#ffffff" : colors.text.disabled}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.closedBar,
              {
                backgroundColor: colors.background.card,
                borderTopColor: colors.border.default,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors.text.muted}
            />
            <Text style={[styles.closedText, { color: colors.text.muted }]}>
              This ticket has been closed.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Image Zoom Modal */}
      {previewImage && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flexOne: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  },
  headerCenter: { alignItems: "center", gap: 4 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 24 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderMetaLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  orderMetaVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  issueSubject: { fontSize: 15, fontFamily: "Inter_700Bold" },
  issueDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  photoSection: { marginTop: 6, gap: 8 },
  photoLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  photosRow: { gap: 10 },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timelineSection: { gap: 12, marginTop: 6 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  statusDivider: { flex: 1, height: 1 },
  statusChangeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  msgBubble: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 4 },
  msgCustomer: { alignSelf: "flex-end", maxWidth: "85%" },
  msgSupport: { alignSelf: "flex-start", maxWidth: "85%" },
  msgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  msgAuthor: { fontSize: 12, fontFamily: "Inter_700Bold" },
  msgTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  msgText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  replyBar: { padding: 12, borderTopWidth: 1, gap: 8 },
  reopenWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  reopenWarningText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  replyInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  replyInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
    borderTopWidth: 1,
  },
  closedText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  modalImage: { width, height: height * 0.8 },
});
