// src/features/prescription-request/screens/PrescriptionRequestUploadScreen.tsx
// Step 1 — Upload prescription images + choose delivery address
//
// Changes in this version:
//   - Pending thumbnails: appear instantly when user picks files (before upload)
//   - Per-file progress: each pending card swaps to confirmed card as upload completes
//   - Active request banner (currentRequestId set) — Option B: show banner,
//     let user navigate manually or dismiss to start fresh
//   - Draft resume banner (files uploaded but not submitted)
//   - Both banners are mutually exclusive; active request takes priority

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { usePrescriptionRequestStore } from "../../../store/prescriptionRequestStore";
import { prescriptionRequestApi } from "../api/prescriptionRequest.api";
import { useAddresses } from "../../profile/hooks/useAddresses";
import { AddressPickerSheet } from "../../cart/components/AddressPickerSheet";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingAsset = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

// ── PendingThumbnail ──────────────────────────────────────────────────────────
// Shown immediately after the user picks a file, before the upload completes.
// Displays a dimmed preview with a spinner overlay.

function PendingThumbnail({
  asset,
  colors,
}: {
  asset: PendingAsset;
  colors: any;
}) {
  const isPdf = asset.mimeType === "application/pdf";

  return (
    <View
      style={[
        styles.fileThumbnail,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.brand,
          borderStyle: "dashed",
        },
      ]}
    >
      {/* Dimmed preview */}
      {!isPdf ? (
        <Image
          source={{ uri: asset.uri }}
          style={[styles.thumbnailImage, { opacity: 0.3 }]}
          resizeMode="cover"
        />
      ) : (
        <MaterialIcons
          name="picture-as-pdf"
          size={28}
          color="#E53935"
          style={{ opacity: 0.3 }}
        />
      )}

      {/* Spinner overlay — sits on top of the dimmed preview */}
      <View style={styles.pendingOverlay}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>

      {/* File name */}
      <Text
        style={[styles.fileName, { color: colors.text.faint }]}
        numberOfLines={1}
      >
        {asset.fileName ?? "Uploading…"}
      </Text>
    </View>
  );
}

// ── PrescriptionRequestUploadScreen ──────────────────────────────────────────

export function PrescriptionRequestUploadScreen() {
  const { colors } = useTheme();

  const {
    uploadedFiles,
    isUploading,
    uploadError,
    selectedAddressId,
    currentRequestId,
    addUploadedFile,
    removeUploadedFile,
    setUploading,
    setUploadError,
    setSelectedAddress,
    reset,
  } = usePrescriptionRequestStore();

  const { addresses } = useAddresses();
  const deliveryLocation = useDeliveryLocationStore((s) => s.location);

  const [addressSheetVisible, setAddressSheetVisible] = useState(false);

  // Tracks files that have been picked but not yet confirmed by the server.
  // Rendered as skeleton cards with spinners in the grid.
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);

  // ── Address resolution ──────────────────────────────────────────────────

  const effectiveAddressId =
    selectedAddressId ?? deliveryLocation.addressId ?? null;

  const resolvedAddress = effectiveAddressId
    ? addresses.find((a) => a.id === effectiveAddressId)
    : (addresses.find((a) => a.is_default) ?? addresses[0]);

  React.useEffect(() => {
    if (!selectedAddressId) {
      if (deliveryLocation.addressId) {
        setSelectedAddress(deliveryLocation.addressId);
      } else if (resolvedAddress) {
        setSelectedAddress(resolvedAddress.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSheetClose = useCallback(() => {
    setAddressSheetVisible(false);
    const newAddressId = useDeliveryLocationStore.getState().location.addressId;
    if (newAddressId) {
      setSelectedAddress(newAddressId);
    }
  }, [setSelectedAddress]);

  // ── Upload ──────────────────────────────────────────────────────────────

  const remainingSlots = 5 - uploadedFiles.length;
  const canUploadMore = remainingSlots > 0 && !isUploading;
  const canProceed =
    uploadedFiles.length > 0 && !!resolvedAddress && !isUploading;

  const handleUpload = useCallback(
    async (source: "gallery" | "camera" | "document") => {
      if (!canUploadMore) return;

      let assets: PendingAsset[] = [];

      // ── Picker phase ──────────────────────────────────────────────
      if (source === "gallery") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow gallery access.");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: remainingSlots,
          quality: 0.85,
        });
        if (!result.canceled) {
          assets = result.assets.map((a) => ({
            uri: a.uri,
            fileName: a.fileName ?? undefined,
            mimeType: a.mimeType ?? undefined,
          }));
        }
      } else if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow camera access.");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
        if (!result.canceled) {
          assets = result.assets.map((a) => ({
            uri: a.uri,
            fileName: a.fileName ?? undefined,
            mimeType: a.mimeType ?? undefined,
          }));
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
          multiple: remainingSlots > 1,
        });
        if (!result.canceled) {
          assets = result.assets.map((a) => ({
            uri: a.uri,
            fileName: a.name,
            mimeType: a.mimeType ?? "application/pdf",
          }));
        }
      }

      if (assets.length === 0) return;

      // ── Show pending thumbnails immediately after picker closes ───
      // The user sees skeleton cards with spinners before any network call.
      const slicedAssets = assets.slice(0, remainingSlots);
      setPendingAssets(slicedAssets);
      setUploading(true);
      setUploadError(null);

      // ── Upload phase — one file at a time ─────────────────────────
      try {
        for (const asset of slicedAssets) {
          const formData = new FormData();
          formData.append("files", {
            uri: asset.uri,
            name: asset.fileName ?? `prescription_${Date.now()}.jpg`,
            type: asset.mimeType ?? "image/jpeg",
          } as any);

          const res = await prescriptionRequestApi.uploadFiles(formData);
          const uploaded = res.data?.data?.files ?? [];

          for (const file of uploaded) {
            addUploadedFile({ ...file, uri: asset.uri });
          }

          // Remove this specific asset from pending once its upload finishes.
          // The confirmed thumbnail takes its visual place in the grid.
          setPendingAssets((prev) =>
            prev.filter((p) => p.uri !== asset.uri),
          );
        }
      } catch (err: any) {
        console.error("[PrescriptionUpload] Upload error:", {
          message: err?.message,
          response: err?.response?.data,
          status: err?.response?.status,
          config: err?.config,
        });
        // Clear all pending cards on failure — they won't become real files.
        setPendingAssets([]);
        const msg =
          err?.response?.data?.message ?? "Upload failed. Please try again.";
        setUploadError(msg);
      } finally {
        setUploading(false);
        // Safety net in case a pending asset slipped through.
        setPendingAssets([]);
      }
    },
    [
      canUploadMore,
      remainingSlots,
      addUploadedFile,
      setUploading,
      setUploadError,
    ],
  );

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    if (resolvedAddress) setSelectedAddress(resolvedAddress.id);
    router.push("/prescription-request/pharmacies" as any);
  }, [canProceed, resolvedAddress, setSelectedAddress]);

  // ── Derived display values ──────────────────────────────────────────────

  const totalInFlight = uploadedFiles.length + pendingAssets.length;
  const showGrid = uploadedFiles.length > 0 || pendingAssets.length > 0;

  const gridSectionTitle = isUploading
    ? `Uploading… (${uploadedFiles.length} of ${totalInFlight})`
    : `Uploaded (${uploadedFiles.length}/5)`;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
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
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Upload Prescription
        </Text>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            1 of 2
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Active request banner ────────────────────────────────── */}
        {currentRequestId !== null && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.status.successBg },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={colors.status.success}
            />
            <Text
              style={[
                styles.bannerText,
                { color: colors.text.primary, fontFamily: "Inter_400Regular" },
              ]}
            >
              You have an active request in progress.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/prescription-request/${currentRequestId}` as any)
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.bannerCta,
                  { color: colors.brand.primary, fontFamily: "Inter_700Bold" },
                ]}
              >
                View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={reset}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text.faint}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Draft resume banner ──────────────────────────────────── */}
        {uploadedFiles.length > 0 && currentRequestId === null && (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.text.brand}
            />
            <Text
              style={[
                styles.bannerText,
                { color: colors.text.primary, fontFamily: "Inter_400Regular" },
              ]}
            >
              Draft resumed from your last visit.
            </Text>
            <TouchableOpacity onPress={reset} activeOpacity={0.7}>
              <Text
                style={[
                  styles.bannerCta,
                  {
                    color: colors.status.error,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Info card ────────────────────────────────────────────── */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.brand,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.text.brand}
          />
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            Upload your doctor's prescription and we'll send it to nearby
            pharmacies. They'll prepare a quote for you to review.
          </Text>
        </View>

        {/* ── File grid (confirmed + pending) ──────────────────────── */}
        {showGrid && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {gridSectionTitle}
            </Text>
            <View style={styles.fileGrid}>
              {/* Confirmed uploads — solid border, remove button visible */}
              {uploadedFiles.map((file) => (
                <View
                  key={file.file_key}
                  style={[
                    styles.fileThumbnail,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.default,
                    },
                  ]}
                >
                  {file.uri && file.mime_type !== "application/pdf" ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons
                      name="picture-as-pdf"
                      size={28}
                      color="#E53935"
                    />
                  )}
                  <Text
                    style={[styles.fileName, { color: colors.text.faint }]}
                    numberOfLines={1}
                  >
                    {file.original_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeUploadedFile(file.file_key)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.status.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Pending uploads — dashed border, spinner overlay */}
              {pendingAssets.map((asset) => (
                <PendingThumbnail
                  key={asset.uri}
                  asset={asset}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Upload error ─────────────────────────────────────────── */}
        {uploadError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.status.errorBg,
                borderColor: colors.status.errorBorder,
              },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={14}
              color={colors.status.error}
            />
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {uploadError}
            </Text>
          </View>
        )}

        {/* ── Upload options ───────────────────────────────────────── */}
        {canUploadMore && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {uploadedFiles.length === 0
                ? "Add prescription"
                : `Add more (${remainingSlots} left)`}
            </Text>
            <View style={styles.uploadOptions}>
              {(
                [
                  {
                    icon: "camera-outline" as const,
                    label: "Camera",
                    source: "camera" as const,
                  },
                  {
                    icon: "images-outline" as const,
                    label: "Gallery",
                    source: "gallery" as const,
                  },
                  {
                    icon: "document-outline" as const,
                    label: "Document",
                    source: "document" as const,
                  },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.source}
                  onPress={() => handleUpload(opt.source)}
                  disabled={isUploading}
                  activeOpacity={0.75}
                  style={[
                    styles.uploadOption,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: isUploading
                        ? colors.border.subtle
                        : colors.border.default,
                      opacity: isUploading ? 0.5 : 1,
                    },
                  ]}
                >
                  {isUploading ? (
                    <ActivityIndicator size={22} color={colors.text.brand} />
                  ) : (
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={colors.text.brand}
                    />
                  )}
                  <Text
                    style={[
                      styles.uploadOptionLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {isUploading ? "Uploading…" : opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Delivery address ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Delivery address
          </Text>
          <TouchableOpacity
            onPress={() => setAddressSheetVisible(true)}
            activeOpacity={0.8}
            style={[
              styles.addressCard,
              {
                backgroundColor: colors.background.card,
                borderColor: resolvedAddress
                  ? colors.border.default
                  : colors.status.warning + "80",
              },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={
                resolvedAddress ? colors.text.brand : colors.status.warning
              }
            />
            <View style={styles.addressText}>
              {resolvedAddress ? (
                <>
                  <Text
                    style={[
                      styles.addressLabel,
                      { color: colors.text.primary },
                    ]}
                  >
                    {resolvedAddress.label}
                  </Text>
                  <Text
                    style={[styles.addressLine, { color: colors.text.muted }]}
                    numberOfLines={1}
                  >
                    {resolvedAddress.address_line_1}, {resolvedAddress.city}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.addressLabel,
                    { color: colors.status.warning },
                  ]}
                >
                  Select delivery address
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.faint}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Next button ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          activeOpacity={0.85}
          style={[
            styles.nextBtn,
            {
              backgroundColor: canProceed
                ? colors.brand.primary
                : colors.background.tint,
            },
          ]}
        >
          <Text
            style={[
              styles.nextBtnText,
              { color: canProceed ? "#fff" : colors.text.faint },
            ]}
          >
            Next — Select Pharmacies
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={canProceed ? "#fff" : colors.text.faint}
          />
        </TouchableOpacity>
      </View>

      {/* ── Address picker sheet ─────────────────────────────────────── */}
      {addressSheetVisible && (
        <AddressPickerSheet
          visible={addressSheetVisible}
          onClose={handleAddressSheetClose}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  stepIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stepText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  content: { padding: Spacing.base, paddingBottom: 120, gap: Spacing.lg },

  // Banners
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  bannerText: { flex: 1, fontSize: 13 },
  bannerCta: { fontSize: 13 },

  // Info card
  infoCard: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  // Section
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // File grid
  fileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  fileThumbnail: {
    width: 88,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnailImage: { width: "100%", height: 64 },
  fileName: {
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  removeBtn: { position: "absolute", top: 2, right: 2 },

  // Pending thumbnail overlay — sits on top of the dimmed preview
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    // semi-transparent white so the preview is visible but clearly "in progress"
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

  // Upload options
  uploadOptions: { flexDirection: "row", gap: Spacing.sm },
  uploadOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  uploadOptionLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },

  // Address
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  addressText: { flex: 1 },
  addressLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addressLine: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});