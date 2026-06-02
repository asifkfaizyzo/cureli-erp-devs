// src/features/profile/hooks/useLocationSearch.ts
//
// Debounced place search hook.
// Fires after 400ms of inactivity. Min 2 chars.
// Clears results when query is cleared.

import { useState, useEffect, useRef, useCallback } from 'react';
import { placesApi } from '../api/places.api';
import type { PlaceSuggestion } from '../api/places.api';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

interface UseLocationSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  suggestions: PlaceSuggestion[];
  isSearching: boolean;
  searchError: string | null;
  clearSearch: () => void;
}

export function useLocationSearch(): UseLocationSearchReturn {
  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track latest query to ignore stale responses
  const latestQuery = useRef('');

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    setSearchError(null);

    // Clear immediately if query is too short
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSearching(false);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    setIsSearching(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const trimmed = q.trim();
      latestQuery.current = trimmed;

      try {
        const results = await placesApi.searchPlaces(trimmed);

        // Ignore if a newer query has already been fired
        if (latestQuery.current !== trimmed) return;

        setSuggestions(results);
      } catch {
        if (latestQuery.current !== trimmed) return;
        setSearchError('Search failed. Please try again.');
        setSuggestions([]);
      } finally {
        if (latestQuery.current === trimmed) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    setIsSearching(false);
    setSearchError(null);
    latestQuery.current = '';
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isSearching,
    searchError,
    clearSearch,
  };
}