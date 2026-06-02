// src/features/profile/hooks/useCurrentLocation.ts

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { placesApi } from '../api/places.api';
import type { PlaceDetails } from '../api/places.api';

type LocationStatus =
  | 'idle'
  | 'requesting-permission'
  | 'getting-location'
  | 'geocoding'
  | 'success'
  | 'error';

interface UseCurrentLocationReturn {
  status: LocationStatus;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<PlaceDetails | null>;
}

export function useCurrentLocation(): UseCurrentLocationReturn {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const isLoading =
    status === 'requesting-permission' ||
    status === 'getting-location' ||
    status === 'geocoding';

  const getCurrentLocation = useCallback(async (): Promise<PlaceDetails | null> => {
    setError(null);

    // ── Step 1: Check existing permission first ──────────────
    // Avoids showing the dialog if already granted
    setStatus('requesting-permission');

    let permissionResult: Location.LocationPermissionResponse;
    try {
      // Check first — don't request if already granted
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status === 'granted') {
        permissionResult = existing;
      } else {
        permissionResult = await Location.requestForegroundPermissionsAsync();
      }
    } catch {
      setStatus('error');
      setError('Failed to request location permission.');
      return null;
    }

    if (permissionResult.status !== 'granted') {
      setStatus('error');
      setError(
        'Location permission denied. Please enable it in your device settings.',
      );
      return null;
    }

    // ── Step 2: Get GPS — use Low accuracy for speed ─────────
    // Low accuracy = network/cell tower based — returns in ~1-2s
    // Balanced = GPS + network — can take 5-10s
    // High = pure GPS — can take 10-30s outdoors, never indoors
    setStatus('getting-location');

    let coords: Location.LocationObjectCoords;
    try {
      // Try fast network-based location first (1-2 seconds)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        // Timeout after 5 seconds — don't make user wait forever
        timeInterval: 5000,
      });
      coords = location.coords;
    } catch {
      // If Low accuracy fails, try last known position
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 5, // Accept position up to 5 minutes old
          requiredAccuracy: 1000, // Within 1km is fine
        });
        if (lastKnown) {
          coords = lastKnown.coords;
        } else {
          setStatus('error');
          setError('Could not get your location. Please try again.');
          return null;
        }
      } catch {
        setStatus('error');
        setError('Could not get your location. Please try again.');
        return null;
      }
    }

    // ── Step 3: Reverse geocode ──────────────────────────────
    setStatus('geocoding');

    try {
      const details = await placesApi.reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
      setStatus('success');
      return details;
    } catch {
      setStatus('error');
      setError('Could not resolve your address. Please search manually.');
      return null;
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    getCurrentLocation,
  };
}