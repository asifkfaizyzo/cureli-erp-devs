// src/features/prescription-request/screens/PrescriptionRequestUploadScreen.tsx
// Step 1 — Upload prescription images + choose delivery address

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { router }          from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker    from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { useTheme }           from '../../../theme/ThemeContext';
import { Spacing }            from '../../../theme/spacing';
import { Radius }             from '../../../theme/radius';
import { usePrescriptionRequestStore } from '../../../store/prescriptionRequestStore';
import { prescriptionRequestApi }      from '../api/prescriptionRequest.api';
import { useAddresses }       from '../../profile/hooks/useAddresses';
import { AddressPickerSheet } from '../../cart/components/AddressPickerSheet';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';

export function PrescriptionRequestUploadScreen() {
  const { colors } = useTheme();

  const {
    uploadedFiles,
    isUploading,
    uploadError,
    selectedAddressId,
    addUploadedFile,
    removeUploadedFile,
    setUploading,
    setUploadError,
    setSelectedAddress,
  } = usePrescriptionRequestStore();

  const { addresses }   = useAddresses();

  // ── Read the delivery location store to know which address was selected ──
  // AddressPickerSheet writes to this store internally via selectAddress().
  // We sync from it into our prescription request store on each render.
  const deliveryLocation = useDeliveryLocationStore((s) => s.location);

  const [addressSheetVisible, setAddressSheetVisible] = useState(false);

  // Resolve which address to display:
  // Priority: our store's selectedAddressId → delivery location store → default → first
  const effectiveAddressId =
    selectedAddressId ??
    deliveryLocation.addressId ??
    null;

  const resolvedAddress = effectiveAddressId
    ? addresses.find((a) => a.id === effectiveAddressId)
    : addresses.find((a) => a.is_default) ?? addresses[0];

  // Auto-select on first render
  React.useEffect(() => {
    if (!selectedAddressId) {
      // Prefer delivery location store if already set
      if (deliveryLocation.addressId) {
        setSelectedAddress(deliveryLocation.addressId);
      } else if (resolvedAddress) {
        setSelectedAddress(resolvedAddress.id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When AddressPickerSheet closes, sync whatever was selected into our store
  const handleAddressSheetClose = useCallback(() => {
    setAddressSheetVisible(false);
    // The sheet already wrote to deliveryLocationStore via selectAddress()
    // Sync the selected address id into our prescription request store
    const newAddressId = useDeliveryLocationStore.getState().location.addressId;
    if (newAddressId) {
      setSelectedAddress(newAddressId);
    }
  }, [setSelectedAddress]);

  const remainingSlots = 5 - uploadedFiles.length;
  const canUploadMore  = remainingSlots > 0 && !isUploading;
  const canProceed     = uploadedFiles.length > 0 && !!resolvedAddress && !isUploading;

  // ── Upload handler ──────────────────────────────────────────────────────

  const handleUpload = useCallback(async (
    source: 'gallery' | 'camera' | 'document',
  ) => {
    if (!canUploadMore) return;

    // ── Normalised asset shape ─────────────────────────────────────────────
    // ImagePickerAsset.fileName is string | null | undefined.
    // We normalise to string | undefined so our local type is clean.
    let assets: Array<{ uri: string; fileName?: string; mimeType?: string }> = [];

    if (source === 'gallery') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow gallery access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.85,
      });
      if (!result.canceled) {
        // ── FIX: strip null from fileName ─────────────────────────────────
        assets = result.assets.map((a) => ({
          uri:      a.uri,
          fileName: a.fileName ?? undefined,   // null → undefined
          mimeType: a.mimeType ?? undefined,
        }));
      }

    } else if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!result.canceled) {
        // ── FIX: strip null from fileName ─────────────────────────────────
        assets = result.assets.map((a) => ({
          uri:      a.uri,
          fileName: a.fileName ?? undefined,   // null → undefined
          mimeType: a.mimeType ?? undefined,
        }));
      }

    } else {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: remainingSlots > 1,
      });
      if (!result.canceled) {
        assets = result.assets.map((a) => ({
          uri:      a.uri,
          fileName: a.name,
          mimeType: a.mimeType ?? 'application/pdf',
        }));
      }
    }

    if (assets.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      for (const asset of assets.slice(0, remainingSlots)) {
        const formData = new FormData();
        formData.append('files', {
          uri:  asset.uri,
          name: asset.fileName ?? `prescription_${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        } as any);

        const res = await prescriptionRequestApi.uploadFiles(formData);
        const uploaded = res.data?.data?.files ?? [];

        for (const file of uploaded) {
          addUploadedFile({ ...file, uri: asset.uri });
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }, [canUploadMore, remainingSlots, addUploadedFile, setUploading, setUploadError]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    if (resolvedAddress) {
      setSelectedAddress(resolvedAddress.id);
    }
    router.push('/prescription-request/pharmacies' as any);
  }, [canProceed, resolvedAddress, setSelectedAddress]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:  colors.background.card,
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
          <Text style={[styles.stepText, { color: colors.text.muted }]}>1 of 2</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Info card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.tint,
              borderColor:     colors.border.brand,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.text.brand} />
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            Upload your doctor's prescription and we'll send it to nearby pharmacies.
            They'll prepare a quote for you to review.
          </Text>
        </View>

        {/* Uploaded files */}
        {uploadedFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Uploaded ({uploadedFiles.length}/5)
            </Text>
            <View style={styles.fileGrid}>
              {uploadedFiles.map((file) => (
                <View
                  key={file.file_key}
                  style={[
                    styles.fileThumbnail,
                    {
                      backgroundColor: colors.background.card,
                      borderColor:     colors.border.default,
                    },
                  ]}
                >
                  {file.uri && file.mime_type !== 'application/pdf' ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons name="picture-as-pdf" size={28} color="#E53935" />
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
                    <Ionicons name="close-circle" size={18} color={colors.status.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Upload error */}
        {uploadError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.status.errorBg,
                borderColor:     colors.status.errorBorder,
              },
            ]}
          >
            <Ionicons name="warning-outline" size={14} color={colors.status.error} />
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {uploadError}
            </Text>
          </View>
        )}

        {/* Upload options */}
        {canUploadMore && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {uploadedFiles.length === 0
                ? 'Add prescription'
                : `Add more (${remainingSlots} left)`}
            </Text>
            <View style={styles.uploadOptions}>
              {(
                [
                  { icon: 'camera-outline'   as const, label: 'Camera',   source: 'camera'   as const },
                  { icon: 'images-outline'   as const, label: 'Gallery',  source: 'gallery'  as const },
                  { icon: 'document-outline' as const, label: 'Document', source: 'document' as const },
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
                      borderColor:     colors.border.default,
                    },
                  ]}
                >
                  {isUploading ? (
                    <ActivityIndicator size={22} color={colors.text.brand} />
                  ) : (
                    <Ionicons name={opt.icon} size={22} color={colors.text.brand} />
                  )}
                  <Text style={[styles.uploadOptionLabel, { color: colors.text.secondary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Delivery address */}
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
                borderColor:     resolvedAddress
                  ? colors.border.default
                  : colors.status.warning + '80',
              },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={resolvedAddress ? colors.text.brand : colors.status.warning}
            />
            <View style={styles.addressText}>
              {resolvedAddress ? (
                <>
                  <Text style={[styles.addressLabel, { color: colors.text.primary }]}>
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
                <Text style={[styles.addressLabel, { color: colors.status.warning }]}>
                  Select delivery address
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.faint} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Next button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background.card,
            borderTopColor:  colors.border.subtle,
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
              { color: canProceed ? '#fff' : colors.text.faint },
            ]}
          >
            Next — Select Pharmacies
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={canProceed ? '#fff' : colors.text.faint}
          />
        </TouchableOpacity>
      </View>

      {/* ── FIX: AddressPickerSheet only accepts visible + onClose ── */}
      {addressSheetVisible && (
        <AddressPickerSheet
          visible={addressSheetVisible}
          onClose={handleAddressSheetClose}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  header: {
    height:            56,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap:               Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex:       1,
    fontSize:   17,
    fontFamily: 'Inter_600SemiBold',
  },
  stepIndicator: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
  },
  stepText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  content:  { padding: Spacing.base, paddingBottom: 120, gap: Spacing.lg },
  infoCard: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    padding:       Spacing.md,
    borderRadius:  Radius.lg,
    borderWidth:   1,
    alignItems:    'flex-start',
  },
  infoText: {
    flex:       1,
    fontSize:   13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  section:      { gap: Spacing.sm },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  fileGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  fileThumbnail: {
    width:          88,
    height:         100,
    borderRadius:   Radius.md,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  thumbnailImage: { width: '100%', height: 64 },
  fileName: {
    fontSize:          9,
    textAlign:         'center',
    paddingHorizontal: 4,
    marginTop:         4,
  },
  removeBtn: { position: 'absolute', top: 2, right: 2 },
  errorBanner: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
    padding:       Spacing.md,
    borderRadius:  Radius.md,
    borderWidth:   1,
  },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  uploadOptions: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  uploadOption: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius:   Radius.lg,
    borderWidth:    1,
  },
  uploadOptionLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  addressCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    padding:       Spacing.md,
    borderRadius:  Radius.lg,
    borderWidth:   1,
  },
  addressText:  { flex: 1 },
  addressLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  addressLine:  { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  footer: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    padding:        Spacing.base,
    paddingBottom:  Spacing.xl,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.sm,
    height:         52,
    borderRadius:   Radius.md,
  },
  nextBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});