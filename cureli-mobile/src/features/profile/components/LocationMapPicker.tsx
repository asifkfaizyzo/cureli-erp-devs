// src/features/profile/components/LocationMapPicker.tsx

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useTheme } from '../../../theme/ThemeContext';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface LocationMapPickerProps {
  coordinate: Coordinate | null;
  onDragEnd: (coordinate: Coordinate) => void;
  isReverseGeocoding?: boolean;
}

const DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function LocationMapPicker({
  coordinate,
  onDragEnd,
  isReverseGeocoding = false,
}: LocationMapPickerProps) {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  // Track the last coordinate we animated to — avoids redundant animates
  const lastAnimatedCoord = useRef<Coordinate | null>(null);

  // Animate to new coordinate whenever it changes AND map is ready
  useEffect(() => {
    if (!coordinate || !isMapReady) return;

    const last = lastAnimatedCoord.current;
    const latDiff = last
      ? Math.abs(coordinate.latitude - last.latitude)
      : Infinity;
    const lngDiff = last
      ? Math.abs(coordinate.longitude - last.longitude)
      : Infinity;

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      const newRegion: Region = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        ...DEFAULT_DELTA,
      };
      mapRef.current?.animateToRegion(newRegion, 400);
      lastAnimatedCoord.current = coordinate;
    }
  }, [coordinate?.latitude, coordinate?.longitude, isMapReady]);

  // ── Empty state ──────────────────────────────────────────────
  if (!coordinate) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: colors.background.elevated },
        ]}
      >
        <Text
          style={[
            styles.placeholderText,
            { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Search or use current location to see the map
        </Text>
      </View>
    );
  }

  // ── Map ──────────────────────────────────────────────────────
  // Always build initialRegion from the current coordinate.
  // This is only used once on first mount so it's safe.
  const initialRegion: Region = {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    ...DEFAULT_DELTA,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onMapReady={() => {
          setIsMapReady(true);
          // Animate immediately in case coordinate already changed
          // before the map finished loading
          if (coordinate) {
            mapRef.current?.animateToRegion(
              {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                ...DEFAULT_DELTA,
              },
              0, // no animation — just snap
            );
            lastAnimatedCoord.current = coordinate;
          }
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        loadingEnabled={true}
        loadingIndicatorColor={colors.brand.accent}
        loadingBackgroundColor={colors.background.elevated}
        // ✅ Removed cacheEnabled — it causes stall on Android
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        mapType="standard"
      >
        <Marker
          coordinate={{
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          }}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onDragEnd({ latitude, longitude });
          }}
        />
      </MapView>

      {/* Loading overlay — shown until map is ready */}
      {!isMapReady && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.background.elevated },
          ]}
        >
          <ActivityIndicator size="large" color={colors.brand.accent} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Loading map…
          </Text>
        </View>
      )}

      {/* Reverse geocoding badge */}
      {isMapReady && isReverseGeocoding && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.background.elevated },
          ]}
        >
          <ActivityIndicator size="small" color={colors.brand.accent} />
          <Text
            style={[
              styles.badgeText,
              { color: colors.text.muted, fontFamily: 'Inter_500Medium' },
            ]}
          >
            Resolving address…
          </Text>
        </View>
      )}

      {/* Drag hint */}
      {isMapReady && !isReverseGeocoding && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.background.elevated },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Drag pin to adjust
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: 12,
    backgroundColor: '#e5e3df', // neutral map-ish colour while loading
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    height: 240,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Full-cover loading overlay until onMapReady fires
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    opacity: 0.95,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 12,
  },
});