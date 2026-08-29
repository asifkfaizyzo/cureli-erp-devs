import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../theme/ThemeContext';
import { useDialog } from '../../../components/Dialog/DialogProvider';
import { CategoryPicker } from '../components/CategoryPicker';
import { supportApi } from '../api/support.api';
import type { CustomerTicketCategory, SelectedTicketImage } from '../../../types/support';

interface RaiseTicketScreenProps {
  orderId: string;
  orderNumber?: string;
}

export function RaiseTicketScreen({ orderId, orderNumber }: RaiseTicketScreenProps) {
  const { colors, isDark } = useTheme();
  const { alert: showAlert } = useDialog();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const [category, setCategory] = useState<CustomerTicketCategory | null>(null);
  const [otherCategoryText, setOtherCategoryText] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<SelectedTicketImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Image Pickers ──────────────────────────────────────────────────────────
  const pickFromGallery = useCallback(async () => {
    if (images.length >= 5) {
      await showAlert({ title: 'Limit Reached', message: 'You can upload up to 5 photos.', confirmLabel: 'OK' });
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      await showAlert({ title: 'Permission required', message: 'Please allow gallery access to upload photos.', confirmLabel: 'OK' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newItems: SelectedTicketImage[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `ticket_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setImages((prev) => [...prev, ...newItems].slice(0, 5));
    }
  }, [images.length, showAlert]);

  const captureWithCamera = useCallback(async () => {
    if (images.length >= 5) {
      await showAlert({ title: 'Limit Reached', message: 'You can upload up to 5 photos.', confirmLabel: 'OK' });
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      await showAlert({ title: 'Permission required', message: 'Please allow camera access.', confirmLabel: 'OK' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImages((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        },
      ]);
    }
  }, [images.length, showAlert]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Submit Ticket ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!category) {
      await showAlert({ title: 'Missing Info', message: 'Please choose an issue category.', confirmLabel: 'OK' });
      return;
    }
    if (category === 'OTHER' && !otherCategoryText.trim()) {
      await showAlert({ title: 'Missing Info', message: 'Please specify the category detail.', confirmLabel: 'OK' });
      return;
    }
    if (subject.trim().length < 3) {
      await showAlert({ title: 'Missing Info', message: 'Please provide a brief subject.', confirmLabel: 'OK' });
      return;
    }
    if (description.trim().length < 10) {
      await showAlert({ title: 'Missing Info', message: 'Please describe the issue in at least 10 characters.', confirmLabel: 'OK' });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('category', category);
      if (category === 'OTHER' && otherCategoryText.trim()) {
        formData.append('other_category_text', otherCategoryText.trim());
      }
      formData.append('subject', subject.trim());
      formData.append('description', description.trim());

      images.forEach((img) => {
        formData.append('files', {
          uri: img.uri,
          name: img.name,
          type: img.type,
        } as any);
      });

      const res = await supportApi.createTicket(formData);

      if (res.data.success) {
        await showAlert({
          title: 'Ticket Raised',
          message: `Your support ticket #${res.data.data.ticket.ticket_number} has been created. Our team will review it shortly.`,
          confirmLabel: 'View Ticket',
        });
        router.replace(`/support/${res.data.data.ticket.ticket_id}` as any);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit support ticket. Please try again.';
      await showAlert({ title: 'Submission Failed', message: msg, confirmLabel: 'OK' });
    } finally {
      setIsSubmitting(false);
    }
  }, [category, otherCategoryText, subject, description, images, orderId, showAlert]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Accounts for Statusbar + Custom Header Height (60)
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.default }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Need Help with Order</Text>
            {orderNumber ? (
              <Text style={[styles.headerSubtitle, { color: colors.text.faint }]}>#{orderNumber}</Text>
            ) : null}
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true} // Dynamic viewport updates when inputs focus
        >
          {/* Step 1: Category */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>1. What went wrong?</Text>
            <CategoryPicker selectedCategory={category} onSelect={setCategory} />
            {category === 'OTHER' && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="Specify the issue..."
                placeholderTextColor={colors.text.faint}
                value={otherCategoryText}
                onChangeText={setOtherCategoryText}
              />
            )}
          </View>

          {/* Step 2: Subject & Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>2. Details</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.default,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Brief summary (e.g., Wrong strip of Dolo..)"
              placeholderTextColor={colors.text.faint}
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.default,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={colors.text.faint}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Step 3: Photos */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>3. Add Photos</Text>
              <Text style={[styles.counter, { color: colors.text.faint }]}>{images.length}/5</Text>
            </View>
            <Text style={[styles.sectionHint, { color: colors.text.faint }]}>
              Upload photos of the received items, medicine box, or damaged packaging.
            </Text>

            <View style={styles.imageGrid}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageThumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    style={[styles.uploadBox, { borderColor: colors.border.default, backgroundColor: colors.background.card }]}
                    onPress={pickFromGallery}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images-outline" size={20} color={brandColor} />
                    <Text style={[styles.uploadBoxText, { color: brandColor }]}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadBox, { borderColor: colors.border.default, backgroundColor: colors.background.card }]}
                    onPress={captureWithCamera}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={20} color={brandColor} />
                    <Text style={[styles.uploadBoxText, { color: brandColor }]}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View style={[styles.footer, { backgroundColor: colors.background.card, borderTopColor: colors.border.default }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: brandColor, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  scrollContent: { padding: 16, gap: 24, paddingBottom: 60 },
  section: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  counter: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4 },
  input: {
    height: 60,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  imageThumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerActions: { flexDirection: 'row', gap: 10 },
  uploadBox: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadBoxText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  footer: { padding: 16, borderTopWidth: 1 },
  submitButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});