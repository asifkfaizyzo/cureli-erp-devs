// src/hooks/useDeliveryETA.ts
//
// Fetches driving distance + duration via backend proxy endpoint.
// No Google API key used client-side — key stays server-side.
// Works identically in dev and prod regardless of build type.
//
// Returns:
//   { durationText, distanceText, distanceKm, isLoading, error }
//
// durationText includes DELIVERY_BUFFER_MINS on top of raw driving time.
// This covers: order acceptance + pharmacy packing + dispatch delay.
//
// distanceKm is the raw numeric km value (2 decimal places).
// Used by the checkout flow to calculate per-km surcharge server-side.
//
// Results are cached in-memory by coordinate pair for 5 minutes.
// Falls back gracefully: if coordinates missing or request fails,
// all fields are null and the UI shows nothing (no fake value).

import { useState, useEffect, useRef } from 'react';
import { DELIVERY_BUFFER_MINS } from '../constants/config';
import { api } from '../services/api';

// ── Types ─────────────────────────────────────────────────────

interface ETAResult {
  durationText: string | null;
  distanceText: string | null;
  distanceKm:   number | null;
  isLoading:    boolean;
  error:        string | null;
}

interface CacheEntry {
  durationText: string;
  distanceText: string;
  distanceKm:   number;
  fetchedAt:    number;
}

interface DistanceApiResponse {
  success: boolean;
  message: string;
  data: {
    distanceKm:   number;
    durationSecs: number;
    distanceText: string;
    durationText: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────

const etaCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function makeCacheKey(
  originLat: number,
  originLng: number,
  destLat:   number,
  destLng:   number,
): string {
  const r = (n: number) => n.toFixed(4);
  return `${r(originLat)},${r(originLng)}->${r(destLat)},${r(destLng)}`;
}

// Under 60 mins: "X mins"
// 60+ mins: "X hr Y mins" (or "X hr" if no remainder)
function formatMins(totalMins: number): string {
  if (totalMins < 60) return `${totalMins} mins`;
  const hrs  = Math.floor(totalMins / 60);
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

  // Tracks the cache key of the last initiated fetch.
  // Prevents duplicate in-flight requests and stale state updates.
  const lastFetchKey = useRef<string | null>(null);

  useEffect(() => {
    // Coerce to number — values may arrive as strings from persisted MMKV storage
    const oLat = originLat != null ? Number(originLat) : null;
    const oLng = originLng != null ? Number(originLng) : null;
    const dLat = destLat   != null ? Number(destLat)   : null;
    const dLng = destLng   != null ? Number(destLng)   : null;

    // All four coordinates required — clear result if any are missing
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

    const cacheKey = makeCacheKey(oLat, oLng, dLat, dLng);

    // Serve from cache if still fresh — avoids redundant backend calls
    const cached = etaCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      if (lastFetchKey.current !== cacheKey) {
        lastFetchKey.current = cacheKey;
        setResult({
          durationText: cached.durationText,
          distanceText: cached.distanceText,
          distanceKm:   cached.distanceKm,
          isLoading:    false,
          error:        null,
        });
      }
      return;
    }

    // Don't re-fire if already in-flight for this exact coordinate pair
    if (lastFetchKey.current === cacheKey && result.isLoading) return;

    lastFetchKey.current = cacheKey;
    setResult((prev) => ({ ...prev, isLoading: true, error: null }));

    api
      .get<DistanceApiResponse>('/mobile/places/distance', {
        params: {
          originLat: oLat,
          originLng: oLng,
          destLat:   dLat,
          destLng:   dLng,
        },
      })
      .then((res) => {
        // Guard: ignore response if a newer fetch has since been initiated
        if (lastFetchKey.current !== cacheKey) return;

        const { distanceKm, durationSecs, distanceText } = res.data.data;

        // Add buffer on top of raw driving time
        const totalMins   = Math.ceil(durationSecs / 60) + DELIVERY_BUFFER_MINS;
        const durationText = formatMins(totalMins);

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
        if (lastFetchKey.current !== cacheKey) return;

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