// src/hooks/useDeliveryETA.ts
//
// Fetches driving time estimate from Google Distance Matrix API.
// Called from DeliverySummaryCard when cart has items with a known
// branch location and the user has a delivery location set.
//
// API used: Distance Matrix API (requires separate enablement from Maps SDK)
// Key: EXPO_PUBLIC_GOOGLE_MAPS_KEY (same key, different service)
//
// Result is memoised by coordinate pair — does not re-fetch unless
// coordinates change. Uses a 5 minute stale time.
//
// Returns:
//   { durationText, distanceText, distanceKm, isLoading, error }
//
// durationText includes DELIVERY_BUFFER_MINS on top of the raw driving time.
// This covers: order acceptance + pharmacy packing + dispatch delay.
//
// distanceKm is the raw numeric km value (2 decimal places).
// Used by the checkout flow to calculate per-km surcharge server-side.
//
// Falls back gracefully: if coordinates missing or API fails,
// all text/numeric fields are null and the UI shows nothing (no fake value).

import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { DELIVERY_BUFFER_MINS } from '../constants/config';

// ── Types ─────────────────────────────────────────────────────

interface ETAResult {
  durationText: string | null;
  distanceText: string | null;
  distanceKm:   number | null;  // raw numeric km — used for pricing calculation
  isLoading:    boolean;
  error:        string | null;
}

// Cache shape also includes distanceKm now
interface CacheEntry {
  durationText: string;
  distanceText: string;
  distanceKm:   number;
  fetchedAt:    number;
}

// ── Helpers ───────────────────────────────────────────────────

function getApiKey(): string {
  return (
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ??
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ??
    ''
  );
}

const etaCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function makeCacheKey(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): string {
  const r = (n: number | string) => Number(n).toFixed(4);
  return `${r(originLat)},${r(originLng)}->${r(destLat)},${r(destLng)}`;
}

// Build a human-readable duration string from total minutes.
// Under 60 mins: "X mins"
// 60+ mins: "X hr Y mins" (or "X hr" if no remainder)
function formatMins(totalMins: number): string {
  if (totalMins < 60) return `${totalMins} mins`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} mins`;
}

// ── Hook ──────────────────────────────────────────────────────

export function useDeliveryETA(
  originLat: number | null,
  originLng: number | null,
  destLat:   number | null,
  destLng:   number | null,
): ETAResult {
  const [result, setResult] = useState<ETAResult>({
    durationText: null,
    distanceText: null,
    distanceKm:   null,
    isLoading:    false,
    error:        null,
  });

  const lastFetchKey = useRef<string | null>(null);

  useEffect(() => {
    // Coerce to number — values may arrive as strings from persisted storage
    const oLat = originLat != null ? Number(originLat) : null;
    const oLng = originLng != null ? Number(originLng) : null;
    const dLat = destLat   != null ? Number(destLat)   : null;
    const dLng = destLng   != null ? Number(destLng)   : null;

    // All four coordinates required
    if (oLat == null || oLng == null || dLat == null || dLng == null) {
      setResult({
        durationText: null,
        distanceText: null,
        distanceKm:   null,
        isLoading:    false,
        error:        null,
      });
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      setResult({
        durationText: null,
        distanceText: null,
        distanceKm:   null,
        isLoading:    false,
        error:        'No API key',
      });
      return;
    }

    const cacheKey = makeCacheKey(oLat, oLng, dLat, dLng);

    // Serve from cache if still fresh
    const cached = etaCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      if (lastFetchKey.current !== cacheKey) {
        lastFetchKey.current = cacheKey;
        setResult({
          durationText: cached.durationText,
          distanceText: cached.distanceText,
          distanceKm:   cached.distanceKm ?? null,
          isLoading:    false,
          error:        null,
        });
      }
      return;
    }

    // Don't re-fire if we already have an in-flight fetch for this key
    if (lastFetchKey.current === cacheKey && result.isLoading) return;

    lastFetchKey.current = cacheKey;
    setResult((prev) => ({ ...prev, isLoading: true, error: null }));

    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${oLat},${oLng}` +
      `&destinations=${dLat},${dLng}` +
      `&mode=driving` +
      `&units=metric` +
      `&key=${apiKey}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const element = data?.rows?.[0]?.elements?.[0];

        if (!element || element.status !== 'OK') {
          setResult({
            durationText: null,
            distanceText: null,
            distanceKm:   null,
            isLoading:    false,
            error:        element?.status ?? 'No route found',
          });
          return;
        }

        // duration.value is raw driving seconds from Google.
        // Add DELIVERY_BUFFER_MINS to cover:
        //   - pharmacy order acceptance
        //   - packing time
        //   - dispatch delay
        const rawDrivingSecs: number = element.duration.value;
        const totalMins = Math.ceil(rawDrivingSecs / 60) + DELIVERY_BUFFER_MINS;
        const durationText = formatMins(totalMins);
        const distanceText: string = element.distance.text;

        // element.distance.value is raw metres from Google
        // Divide by 1000 and round to 2 decimal places for km
        // This value is passed to the server for per-km surcharge calculation
        const distanceKm = parseFloat((element.distance.value / 1000).toFixed(2));

        // Store all three values in cache
        etaCache.set(cacheKey, {
          durationText,
          distanceText,
          distanceKm,
          fetchedAt: Date.now(),
        });

        setResult({
          durationText,
          distanceText,
          distanceKm,
          isLoading: false,
          error:     null,
        });
      })
      .catch((err) => {
        setResult({
          durationText: null,
          distanceText: null,
          distanceKm:   null,
          isLoading:    false,
          error:        err?.message ?? 'Network error',
        });
      });
  }, [originLat, originLng, destLat, destLng]);

  return result;
}