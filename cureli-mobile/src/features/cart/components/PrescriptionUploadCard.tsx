// src/features/cart/components/PrescriptionUploadCard.tsx

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useCartStore } from '../../../store/cartStore';
import { usePrescriptionStore } from '../../../store/prescriptionStore';
import { api } from '../../../services/api'; // ← uses your axios instance with interceptors

// ── Upload helper ─────────────────────────────────────────────
// Uses the shared `api` axios instance.
// The request interceptor automatically attaches the current access token.
// The response interceptor automatically refreshes expired tokens and retries.
// No manual token handling needed here.

async function uploadPrescriptionFiles(
  assets: ImagePicker.ImagePickerAsset[],
): Promise<
  Array<{
    prescription_key: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    uri: string;
  }>
> {
  const formData = new FormData();

  for (const asset of assets) {
    const fileName = asset.fileName ?? `prescription_${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? 'image/jpeg';

    formData.append('files', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  const response = await api.post(
    '/mobile/prescriptions/upload',
    formData,
    {
      headers: {
        // Axios needs this cleared so it sets the multipart boundary correctly.
        // Without this, the boundary is missing and the backend rejects the body.
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  const files: Array<{
    prescription_key: string;
    original_name: string;
    mime_type: string;
    file_size: number;
  }> = response.data?.data?.files ?? [];

  // Attach local URI for thumbnail preview — not sent to backend
  return files.map((f, idx) => ({
    ...f,
    uri: assets[idx]?.uri ?? '',
  }));
}

// ── File thumbnail ────────────────────────────────────────────

function FileThumbnail({
  file,
  onRemove,
}: {
  file: {
    prescription_key: string;
    original_name: string;
    mime_type: string;
    uri?: string;
  };
  onRemove: (key: string) => void;
}) {
  const { colors } = useTheme();
  const isPdf = file.mime_type === 'application/pdf';

  return (
    <View
      style={[
        styles.thumbnail,
        {
          backgroundColor: colors.background.tint,
          borderColor: colors.border.default,
        },
      ]}
    >
      {!isPdf && file.uri ? (
        <Image
          source={{ uri: file.uri }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailPdf}>
          <MaterialIcons name="picture-as-pdf" size={24} color="#E53935" />
        </View>
      )}

      <Text
        style={[styles.thumbnailName, { color: colors.text.secondary }]}
        numberOfLines={1}
      >
        {file.original_name}
      </Text>

      <TouchableOpacity
        onPress={() => onRemove(file.prescription_key)}
        style={styles.thumbnailRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Remove prescription file"
      >
        <Ionicons name="close-circle" size={18} color={colors.status.error} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────

export function PrescriptionUploadCard() {
  const { colors } = useTheme();

  const items = useCartStore((s) => s.items);
  const {
    tempFiles,
    isUploading,
    uploadError,
    addFiles,
    removeFile,
    setUploading,
    setUploadError,
  } = usePrescriptionStore();

  const rxItems = items.filter((i) => i.requiresPrescription);
  const remainingSlots = 5 - tempFiles.length;
  const canUploadMore = remainingSlots > 0 && !isUploading;

  const handleUpload = useCallback(async () => {
    if (!canUploadMore) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library to upload prescriptions.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remainingSlots,
    });

    if (result.canceled || result.assets.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploaded = await uploadPrescriptionFiles(result.assets);
      addFiles(uploaded);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }, [canUploadMore, remainingSlots, addFiles, setUploading, setUploadError]);

  const warningBorderColor = colors.status.warning + '66';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: warningBorderColor,
        },
      ]}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            { backgroundColor: colors.status.warningBg },
          ]}
        >
          <MaterialIcons
            name="assignment"
            size={18}
            color={colors.status.warning}
          />
        </View>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Prescription Required
          </Text>
          <Text
            style={[
              styles.headerSub,
              { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Upload a valid prescription for the items below
          </Text>
        </View>
      </View>

      {/* ── Rx items list ─────────────────────────────────── */}
      <View
        style={[styles.rxList, { backgroundColor: colors.status.warningBg }]}
      >
        {rxItems.map((item) => (
          <View key={item.variantId} style={styles.rxRow}>
            <MaterialIcons
              name="fiber-manual-record"
              size={6}
              color={colors.status.warning}
              style={{ marginTop: 6 }}
            />
            <Text
              style={[
                styles.rxItemName,
                { color: colors.text.secondary, fontFamily: 'Inter_400Regular' },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Uploaded file thumbnails ──────────────────────── */}
      {tempFiles.length > 0 && (
        <View style={styles.fileList}>
          {tempFiles.map((file) => (
            <FileThumbnail
              key={file.prescription_key}
              file={file}
              onRemove={removeFile}
            />
          ))}
        </View>
      )}

      {/* ── Error banner ──────────────────────────────────── */}
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
          <Text
            style={[
              styles.errorText,
              { color: colors.status.error, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {uploadError}
          </Text>
        </View>
      )}

      {/* ── Upload button ─────────────────────────────────── */}
      {canUploadMore && (
        <TouchableOpacity
          onPress={handleUpload}
          disabled={isUploading}
          activeOpacity={0.75}
          style={[
            styles.uploadButton,
            {
              borderColor: colors.status.warning,
              backgroundColor: colors.background.page,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Upload prescription"
        >
          {isUploading ? (
            <ActivityIndicator size={16} color={colors.status.warning} />
          ) : (
            <MaterialIcons
              name="cloud-upload"
              size={18}
              color={colors.status.warning}
            />
          )}
          <View style={styles.uploadTextBlock}>
            <Text
              style={[
                styles.uploadLabel,
                { color: colors.status.warning, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              {isUploading
                ? 'Uploading…'
                : tempFiles.length === 0
                  ? 'Upload Prescription'
                  : `Upload More (${remainingSlots} left)`}
            </Text>
            <Text
              style={[
                styles.uploadHint,
                { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
              ]}
            >
              JPG, PNG or PDF · Max 5 files · 10 MB each
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Max files notice ──────────────────────────────── */}
      {tempFiles.length >= 5 && (
        <View style={styles.maxNotice}>
          <Ionicons
            name="checkmark-circle-outline"
            size={14}
            color={colors.status.success}
          />
          <Text
            style={[
              styles.maxNoticeText,
              { color: colors.status.success, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Maximum 5 files uploaded
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 14 },
  headerSub: { fontSize: 12, lineHeight: 17 },
  rxList: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rxItemName: { fontSize: 13, flex: 1 },
  fileList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  thumbnailImage: { width: '100%', height: 60 },
  thumbnailPdf: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailName: {
    fontSize: 9,
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    lineHeight: 12,
  },
  thumbnailRemove: { position: 'absolute', top: 2, right: 2 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { fontSize: 12, flex: 1, lineHeight: 17 },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginTop: 0,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  uploadTextBlock: { flex: 1, gap: 2 },
  uploadLabel: { fontSize: 14 },
  uploadHint: { fontSize: 11 },
  maxNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 16,
    marginTop: 0,
  },
  maxNoticeText: { fontSize: 12 },
});