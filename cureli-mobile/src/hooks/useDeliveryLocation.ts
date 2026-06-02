// src/hooks/useDeliveryLocation.ts

import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useDeliveryLocationStore, FALLBACK_LOCATION } from '../store/deliveryLocationStore';
import { useAddresses } from '../features/profile/hooks/useAddresses';
import { placesApi } from '../features/profile/api/places.api';
import type { DeliveryLocation } from '../store/deliveryLocationStore';

/**
 * Resolves the delivery location once on mount:
 *
 * 0. If user has manually selected an address (isManualSelection) → skip everything
 * 1. Check if location permission is granted
 * 2. If YES → get GPS coords → reverse geocode → set as "gps" location
 * 3. If NO  → check saved addresses → use default address
 * 4. If neither → show fallback "Set delivery location"
 *
 * Only runs once per app session (guards with hasResolved).
 */
export function useDeliveryLocation() {
  const {
    location,
    isResolving,
    hasResolved,
    isManualSelection,
    setLocation,
    setResolving,
    setResolved,
  } = useDeliveryLocationStore();

  const { addresses } = useAddresses();

  const resolve = useCallback(async () => {
    // If user has manually picked an address, respect that choice
    if (isManualSelection && hasResolved) return;

    // Don't resolve again if already done
    if (hasResolved) return;

    setResolving(true);

    try {
      // ── Step 1: Check location permission (don't request, just check) ──
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        // ── Step 2: Try GPS ──
        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });

          const { latitude, longitude } = position.coords;

          // Reverse geocode to get area name
          try {
            const details = await placesApi.reverseGeocode(latitude, longitude);

            const area = details.city
              ?? details.address_line_2
              ?? details.address_line_1
              ?? 'Your Location';

            const addressParts = [
              details.city,
              details.state,
              details.pincode,
            ].filter(Boolean);

            const gpsLocation: DeliveryLocation = {
              source: 'gps',
              area,
              addressLine: details.formatted_address
                ?? addressParts.join(', ')
                ?? 'Current location',
              latitude,
              longitude,
            };

            setLocation(gpsLocation);
            setResolved();
            return;
          } catch {
            // Reverse geocode failed — still use coords with generic label
            const gpsLocation: DeliveryLocation = {
              source: 'gps',
              area: 'Current Location',
              addressLine: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude,
            };

            setLocation(gpsLocation);
            setResolved();
            return;
          }
        } catch {
          // GPS failed — fall through to saved addresses
          console.log('[DeliveryLocation] GPS failed, trying saved addresses');
        }
      }

      // ── Step 3: Location OFF — try default saved address ──
      const defaultAddress = addresses.find((a) => a.is_default);
      const anyAddress = addresses[0];
      const fallbackAddress = defaultAddress ?? anyAddress;

      if (fallbackAddress) {
        const savedLocation: DeliveryLocation = {
          source: 'saved',
          area: fallbackAddress.city ?? fallbackAddress.label ?? 'Saved Address',
          addressLine: [
            fallbackAddress.address_line_1,
            fallbackAddress.city,
            fallbackAddress.pincode,
          ].filter(Boolean).join(', '),
          latitude: fallbackAddress.latitude ? Number(fallbackAddress.latitude) : null,
          longitude: fallbackAddress.longitude ? Number(fallbackAddress.longitude) : null,
          addressId: fallbackAddress.id,
        };

        setLocation(savedLocation);
        setResolved();
        return;
      }

      // ── Step 4: Nothing available — show fallback ──
      setLocation(FALLBACK_LOCATION);
      setResolved();
    } catch {
      console.log('[DeliveryLocation] Resolution failed, using fallback');
      setLocation(FALLBACK_LOCATION);
      setResolved();
    }
  }, [hasResolved, isManualSelection, addresses, setLocation, setResolving, setResolved]);

  // Auto-resolve on mount
  useEffect(() => {
    resolve();
  }, [resolve]);

  return {
    location,
    isResolving,
    hasResolved,
    isManualSelection,
    refresh: () => {
      // Full reset including manual selection — re-runs GPS detection
      useDeliveryLocationStore.getState().hardReset();
    },
  };
}