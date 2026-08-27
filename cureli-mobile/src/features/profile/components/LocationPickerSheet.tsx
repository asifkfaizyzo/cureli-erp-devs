// src/features/profile/components/LocationPickerSheet.tsx

import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { useLocationSearch } from "../hooks/useLocationSearch";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { placesApi } from "../api/places.api";
import { LocationSearchBar } from "./LocationSearchBar";
import { LocationSuggestionList } from "./LocationSuggestionList";
import { LocationMapPicker } from "./LocationMapPicker";
import type { PlaceDetails, PlaceSuggestion } from "../api/places.api";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (details: PlaceDetails) => void;
}

export function LocationPickerSheet({
  visible,
  onClose,
  onConfirm,
}: LocationPickerSheetProps) {
  const { colors, isDark } = useTheme();

  const [selectedDetails, setSelectedDetails] = useState<PlaceDetails | null>(
    null,
  );
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const {
    query,
    setQuery,
    suggestions,
    isSearching,
    searchError,
    clearSearch,
  } = useLocationSearch();

  const {
    status: locationStatus,
    isLoading: isGettingLocation,
    error: locationError,
    getCurrentLocation,
  } = useCurrentLocation();

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  // ── Helpers ────────────────────────────────────────────────

  const applyDetails = useCallback((details: PlaceDetails) => {
    setSelectedDetails(details);
    if (details.latitude && details.longitude) {
      setCoordinate({
        latitude: details.latitude,
        longitude: details.longitude,
      });
    }
  }, []);

  // ── Handlers ───────────────────────────────────────────────

  const handleSuggestionSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setSelectedPlaceId(suggestion.place_id);
      setIsLoadingDetails(true);
      setDetailsError(null);

      try {
        const details = await placesApi.getPlaceDetails(suggestion.place_id);
        applyDetails(details);
        clearSearch();
      } catch {
        setDetailsError("Could not load place details. Please try again.");
      } finally {
        setIsLoadingDetails(false);
        setSelectedPlaceId(null);
      }
    },
    [applyDetails, clearSearch],
  );

  const handleCurrentLocation = useCallback(async () => {
    setDetailsError(null);
    const details = await getCurrentLocation();
    if (!details) return;
    applyDetails(details);
    clearSearch();
  }, [getCurrentLocation, applyDetails, clearSearch]);

  const handlePinDragEnd = useCallback(async (newCoord: Coordinate) => {
    setCoordinate(newCoord);
    setIsReverseGeocoding(true);

    try {
      const details = await placesApi.reverseGeocode(
        newCoord.latitude,
        newCoord.longitude,
      );
      setSelectedDetails(details);
    } catch {
      // Keep existing details, just update coordinates
      setSelectedDetails((prev) =>
        prev
          ? {
              ...prev,
              latitude: newCoord.latitude,
              longitude: newCoord.longitude,
            }
          : null,
      );
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedDetails) return;
    onConfirm(selectedDetails);
    handleClose();
  }, [selectedDetails, onConfirm]);

  const handleClose = useCallback(() => {
    setSelectedDetails(null);
    setCoordinate(null);
    setIsLoadingDetails(false);
    setSelectedPlaceId(null);
    setIsReverseGeocoding(false);
    setDetailsError(null);
    clearSearch();
    onClose();
  }, [clearSearch, onClose]);

  // ── Derived ────────────────────────────────────────────────

  const showSuggestions = suggestions.length > 0 || searchError !== null;
  const canConfirm =
    selectedDetails !== null && !isReverseGeocoding && !isLoadingDetails;

  // Human-readable status while getting location
  const locationStatusLabel: Record<string, string> = {
    "requesting-permission": "Requesting permission…",
    "getting-location": "Getting your location…",
    geocoding: "Resolving address…",
  };
  const currentLocationLabel =
    locationStatusLabel[locationStatus] ?? "Use current location";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        {/* ── Header ──────────────────────────────────────── */}
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
            onPress={handleClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            Set Location
          </Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Search bar ─────────────────────────────── */}
            <LocationSearchBar
              value={query}
              onChangeText={setQuery}
              onClear={clearSearch}
              isSearching={isSearching}
              autoFocus={false}
            />

            {/* ── Suggestions ────────────────────────────── */}
            {showSuggestions && (
              <LocationSuggestionList
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                isLoadingDetails={isLoadingDetails}
                selectedPlaceId={selectedPlaceId}
                searchError={searchError}
              />
            )}

            {/* ── Current location button ─────────────────── */}
            {!showSuggestions && (
              <TouchableOpacity
                style={[
                  styles.currentLocationButton,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: isGettingLocation
                      ? brandColor
                      : colors.border.default,
                  },
                  isGettingLocation && styles.buttonActive,
                ]}
                onPress={handleCurrentLocation}
                disabled={isGettingLocation}
                activeOpacity={0.7}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size={18} color={brandColor} />
                ) : (
                  <MaterialIcons
                    name="my-location"
                    size={20}
                    color={brandColor}
                  />
                )}
                <View style={styles.currentLocationTextBlock}>
                  <Text
                    style={[
                      styles.currentLocationText,
                      { color: brandColor, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    {currentLocationLabel}
                  </Text>
                  {isGettingLocation && (
                    <Text
                      style={[
                        styles.currentLocationSubtext,
                        {
                          color: colors.text.faint,
                          fontFamily: "Inter_400Regular",
                        },
                      ]}
                    >
                      This may take a few seconds
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* ── Error banner ────────────────────────────── */}
            {(locationError || detailsError) && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.status.errorBg,
                    borderColor: colors.status.errorBorder,
                  },
                ]}
              >
                <MaterialIcons
                  name="error-outline"
                  size={15}
                  color={colors.status.error}
                />
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.status.error,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  {locationError ?? detailsError}
                </Text>
              </View>
            )}

            {/* ── Selected address preview ─────────────────── */}
            {selectedDetails && !showSuggestions && (
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.brand,
                  },
                ]}
              >
                <MaterialIcons
                  name="location-on"
                  size={16}
                  color={brandColor}
                />
                <Text
                  style={[
                    styles.previewText,
                    {
                      color: colors.text.primary,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {selectedDetails.formatted_address ?? "Location selected"}
                </Text>
              </View>
            )}

            {/* ── Map ─────────────────────────────────────── */}
            {!showSuggestions && (
              <LocationMapPicker
                coordinate={coordinate}
                onDragEnd={handlePinDragEnd}
                isReverseGeocoding={isReverseGeocoding}
              />
            )}
          </ScrollView>

          {/* ── Confirm button ───────────────────────────── */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background.page,
                borderTopColor: colors.border.default,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: brandColor },
                !canConfirm && styles.confirmDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={18} color="#ffffff" />
              <Text
                style={[styles.confirmText, { fontFamily: "Inter_700Bold" }]}
              >
                Use this location
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  buttonActive: {
    opacity: 0.85,
  },
  currentLocationTextBlock: {
    flex: 1,
    gap: 2,
  },
  currentLocationText: {
    fontSize: 14,
  },
  currentLocationSubtext: {
    fontSize: 12,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmDisabled: { opacity: 0.45 },
  confirmText: {
    fontSize: 15,
    color: "#ffffff",
  },
});
