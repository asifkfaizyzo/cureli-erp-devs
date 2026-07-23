// src/features/prescription-request/components/PrescriptionFilesSection.tsx
//
// Collapsible accordion that shows prescription file thumbnails.
// Images open in the in-app ImageViewer.
// PDFs download to local cache then open with the OS PDF viewer.
//
// expo-file-system v19 API (confirmed from type definitions):
//   FileSystem.Paths.cache          → Directory instance for cache dir
//   new FileSystem.File(dir, name)  → File handle
//   FileSystem.downloadFileAsync(url, file) → downloads, returns file:// URI string

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { openURL, canOpenURL } from "expo-linking";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { prescriptionRequestApi } from "../api/prescriptionRequest.api";
import { ImageViewer } from "./ImageViewer";
import { Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
// ── Types ─────────────────────────────────────────────────────────────────────

export interface PrescriptionFile {
  file_id: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  sequence: number;
}

const THUMB_WIDTH = 96;
const THUMB_HEIGHT = 128;

// ── PrescriptionFileThumbnail ─────────────────────────────────────────────────

function PrescriptionFileThumbnail({
  file,
  requestId,
  onImagePress,
}: {
  file: PrescriptionFile;
  requestId: string;
  onImagePress: (url: string, name: string) => void;
}) {
  const { colors } = useTheme();

  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const isPdf = file.mime_type === "application/pdf";

  useEffect(() => {
    let alive = true;

    prescriptionRequestApi
      .getFileUrl(requestId, file.file_id)
      .then((res) => {
        if (alive) setUrl(res.data?.data?.url ?? null);
      })
      .catch(() => {
        if (alive) setErrored(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [requestId, file.file_id]);

  // ── PDF handler ─────────────────────────────────────────────────────────
  //
  // Confirmed v19 API from ExpoFileSystem.d.ts:
  //   downloadFileAsync(url: string, destination: File | Directory): Promise<string>
  //   Returns the local file:// URI string after download completes.
  //
  // On iOS: file:// URI opens in QuickLook natively.
  // On Android: file:// URI opens the system PDF viewer.
  // Falls back to opening the signed S3 URL in the browser if canOpenURL fails.

  const handlePdfPress = useCallback(async () => {
    if (!url) return;
    setPdfLoading(true);

    try {
      if (Platform.OS === "android") {
        // Android blocks file:// URIs shared across app boundaries (Android 7+).
        // expo-intent-launcher can open a content:// URI from cache,
        // but the simplest reliable approach is to open the signed S3 URL
        // directly — it works universally and requires zero native config.
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: url,
          type: "application/pdf",
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } else {
        // iOS: download to local cache, open with QuickLook via file:// URI
        const safeName = file.original_name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const localFile = new FileSystem.File(FileSystem.Paths.cache, safeName);
        const downloadedFile = await FileSystem.File.downloadFileAsync(
          url,
          localFile,
        );
        await openURL(downloadedFile.uri);
      }
    } catch (err) {
      console.warn("[PrescriptionFilesSection] PDF open error:", err);
      // Universal fallback — open the signed URL in the browser
      try {
        await openURL(url);
      } catch {
        Alert.alert(
          "Could not open PDF",
          "Please try again or open in your browser.",
        );
      }
    } finally {
      setPdfLoading(false);
    }
  }, [url, file.original_name]);

  // ── Image handler ───────────────────────────────────────────────────────

  const handleImagePress = useCallback(() => {
    if (url) onImagePress(url, file.original_name);
  }, [url, file.original_name, onImagePress]);

  const handlePress = isPdf ? handlePdfPress : handleImagePress;
  const isDisabled = loading || pdfLoading || !url;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.thumb,
        {
          width: THUMB_WIDTH,
          height: THUMB_HEIGHT,
          borderColor: colors.border.default,
          backgroundColor: colors.background.elevated,
        },
      ]}
    >
      {/* Loading */}
      {(loading || pdfLoading) && (
        <ActivityIndicator size="small" color={colors.brand.primary} />
      )}

      {/* Error */}
      {!loading && !pdfLoading && errored && (
        <View style={styles.thumbInner}>
          <Ionicons
            name="alert-circle-outline"
            size={28}
            color={colors.status.warning}
          />
          <Text style={[styles.thumbCaption, { color: colors.text.faint }]}>
            Unavailable
          </Text>
        </View>
      )}

      {/* PDF */}
      {!loading && !pdfLoading && !errored && isPdf && url && (
        <View style={styles.thumbInner}>
          <MaterialIcons name="picture-as-pdf" size={36} color="#E53935" />
          <Text
            style={[styles.thumbCaption, { color: colors.text.muted }]}
            numberOfLines={2}
          >
            {file.original_name}
          </Text>
          <View
            style={[
              styles.openBadge,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons name="open-outline" size={10} color={colors.text.brand} />
            <Text style={[styles.openBadgeText, { color: colors.text.brand }]}>
              Open
            </Text>
          </View>
        </View>
      )}

      {/* Image */}
      {!loading && !pdfLoading && !errored && !isPdf && url && (
        <>
          <Image
            source={{ uri: url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.thumbOverlay}>
            <Text style={styles.thumbOverlayText} numberOfLines={1}>
              {file.original_name}
            </Text>
          </View>
        </>
      )}

      {/* Deleted / expired */}
      {!loading && !pdfLoading && !errored && !url && (
        <View style={styles.thumbInner}>
          <Ionicons name="image-outline" size={28} color={colors.text.faint} />
          <Text style={[styles.thumbCaption, { color: colors.text.faint }]}>
            File expired
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── PrescriptionFilesSection ──────────────────────────────────────────────────

interface Props {
  files: PrescriptionFile[];
  requestId: string;
}

export function PrescriptionFilesSection({ files, requestId }: Props) {
  const { colors } = useTheme();

  const [open, setOpen] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerName, setViewerName] = useState("");

  const handleImagePress = useCallback((url: string, name: string) => {
    setViewerUrl(url);
    setViewerName(name);
    setViewerVisible(true);
  }, []);

  const handleViewerClose = useCallback(() => {
    setViewerVisible(false);
  }, []);

  if (files.length === 0) return null;

  return (
    <>
      <ImageViewer
        visible={viewerVisible}
        uri={viewerUrl}
        name={viewerName}
        onClose={handleViewerClose}
      />

      <View
        style={[
          styles.section,
          {
            borderColor: colors.border.default,
            backgroundColor: colors.background.card,
          },
        ]}
      >
        {/* Accordion trigger */}
        <TouchableOpacity
          onPress={() => setOpen((v) => !v)}
          activeOpacity={0.8}
          style={styles.trigger}
        >
          <View style={styles.triggerLeft}>
            <Ionicons
              name="document-attach-outline"
              size={18}
              color={colors.text.brand}
            />
            <Text style={[styles.triggerTitle, { color: colors.text.primary }]}>
              Your Prescription
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Text style={[styles.countText, { color: colors.text.brand }]}>
                {files.length}
              </Text>
            </View>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.text.faint}
          />
        </TouchableOpacity>

        {/* Grid — thumbnails only mount when open */}
        {open && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.border.subtle },
              ]}
            />
            <View style={styles.grid}>
              {files.map((f) => (
                <PrescriptionFileThumbnail
                  key={f.file_id}
                  file={f}
                  requestId={requestId}
                  onImagePress={handleImagePress}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  triggerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  divider: { height: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    padding: Spacing.base,
  },
  thumb: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbInner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  thumbCaption: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 13,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    marginTop: 2,
  },
  openBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  thumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  thumbOverlayText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
