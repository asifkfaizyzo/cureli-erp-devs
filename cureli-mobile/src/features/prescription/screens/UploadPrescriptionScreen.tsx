// src/features/prescription/screens/UploadPrescriptionScreen.tsx
//
// Full prescription upload flow:
//   Step 1 — Guide card + 3 upload options (Gallery / Camera / Document)
//   Step 2 — Preview selected file
//   Step 3 — Success
//
// No backend yet — confirm simulates a 1.5s upload delay.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";

import { PrescriptionGuideCard } from "../components/PrescriptionGuideCard";
import { UploadOptionCard } from "../components/UploadOptionCard";
import { PrescriptionPreview } from "../components/PrescriptionPreview";
import { PrescriptionSuccess } from "../components/PrescriptionSuccess";

// ── Types ─────────────────────────────────────────────────────

type Step = "upload" | "preview" | "success";

interface SelectedFile {
  uri: string;
  fileType: "image" | "document";
  fileName?: string;
}

// ── Screen ────────────────────────────────────────────────────

export function UploadPrescriptionScreen() {
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Permission helpers ────────────────────────────────────────

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission",
        "Please allow camera access to capture your prescription.",
        [{ text: "OK" }],
      );
      return false;
    }
    return true;
  }, []);

  const requestMediaPermission = useCallback(async (): Promise<boolean> => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery Permission",
        "Please allow gallery access to select your prescription.",
        [{ text: "OK" }],
      );
      return false;
    }
    return true;
  }, []);

  // ── Upload option handlers ────────────────────────────────────

  const handleGallery = useCallback(async () => {
    const allowed = await requestMediaPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        fileType: "image",
        fileName: asset.fileName ?? "prescription.jpg",
      });
      setStep("preview");
    }
  }, [requestMediaPermission]);

  const handleCamera = useCallback(async () => {
    const allowed = await requestCameraPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        fileType: "image",
        fileName: "prescription_camera.jpg",
      });
      setStep("preview");
    }
  }, [requestCameraPermission]);

  const handleDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const isImage = asset.mimeType?.startsWith("image/") ?? false;

      setSelectedFile({
        uri: asset.uri,
        fileType: isImage ? "image" : "document",
        fileName: asset.name,
      });
      setStep("preview");
    }
  }, []);

  // ── Confirm handler — simulates upload ───────────────────────

  const handleConfirm = useCallback(async () => {
    setIsUploading(true);
    // Simulate upload delay — replace with real API call later.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsUploading(false);
    setStep("success");
  }, []);

  const handlePickAgain = useCallback(() => {
    setSelectedFile(null);
    setStep("upload");
  }, []);

  const handleGoHome = useCallback(() => {
    router.replace("/(tabs)" as any);
  }, []);

  const handleUploadAnother = useCallback(() => {
    setSelectedFile(null);
    setStep("upload");
  }, []);

  const handleBack = useCallback(() => {
    if (step === "preview") {
      setSelectedFile(null);
      setStep("upload");
      return;
    }
    if (step === "success") {
      router.replace("/(tabs)" as any);
      return;
    }
    router.back();
  }, [step]);

  // ── Step titles ───────────────────────────────────────────────

  const stepTitle = {
    upload: "Upload Prescription To Order",
    preview: "Review Prescription",
    success: "Upload Successful",
  }[step];

  // ── Render ────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header (hidden on success) ── */}
      {step !== "success" && (
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
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>

          <Text
            style={[styles.headerTitle, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {stepTitle}
          </Text>
        </View>
      )}

      {/* ── Step 1: Upload options ── */}
      {step === "upload" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Guide card */}
          <PrescriptionGuideCard />

          {/* Upload options row */}
          <View style={styles.optionsRow}>
            <UploadOptionCard
              icon="images-outline"
              title="Upload via Gallery"
              onPress={handleGallery}
            />

            <UploadOptionCard
              icon="camera-outline"
              title="Capture via Camera"
              onPress={handleCamera}
            />

            <UploadOptionCard
              icon="document-outline"
              title="Upload Document"
              onPress={handleDocument}
            />
          </View>
        </ScrollView>
      )}

      {/* ── Step 2: Preview ── */}
      {step === "preview" && selectedFile && (
        <PrescriptionPreview
          uri={selectedFile.uri}
          fileType={selectedFile.fileType}
          fileName={selectedFile.fileName}
          onConfirm={handleConfirm}
          onPickAgain={handlePickAgain}
          isUploading={isUploading}
        />
      )}

      {/* ── Step 3: Success ── */}
      {step === "success" && (
        <PrescriptionSuccess
          onGoHome={handleGoHome}
          onUploadAnother={handleUploadAnother}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  // ── Header ──
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  // ── Scroll content ──
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  // ── Upload options ──
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});