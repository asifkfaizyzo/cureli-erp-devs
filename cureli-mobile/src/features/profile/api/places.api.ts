// src/features/profile/api/places.api.ts
//
// Mobile places API — proxied through our backend.
// Never calls Google directly from the app.
// All endpoints require mobileAuth (Bearer token sent automatically by api instance).

import { api } from '../../../services/api';

// ── Response types ─────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetails {
  place_id: string | null;
  name: string | null;
  formatted_address: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ── API methods ────────────────────────────────────────────────

export const placesApi = {
  /**
   * GET /mobile/places/search?query=
   * Returns place predictions for a text query.
   */
  searchPlaces: async (query: string): Promise<PlaceSuggestion[]> => {
  // console.log('🔍 [PLACES] search called', { query });
  try {
    const response = await api.get<ApiResponse<{ results: PlaceSuggestion[] }>>(
      '/mobile/places/search',
      { params: { query } },
    );
    // console.log('🔍 [PLACES] search success', response.data);
    return response.data.data.results;
  } catch (error: unknown) {
    const e = error as any;
    // console.log('🔍 [PLACES] search failed', {
    //   status: e?.response?.status,
    //   data: e?.response?.data,
    //   message: e?.message,
    //   url: e?.config?.url,
    // });
    throw error;
  }
},

  /**
   * GET /mobile/places/details?place_id=
   * Returns full address details for a place_id.
   */
  getPlaceDetails: async (placeId: string): Promise<PlaceDetails> => {
    const response = await api.get<ApiResponse<{ details: PlaceDetails }>>(
      '/mobile/places/details',
      { params: { place_id: placeId } },
    );
    return response.data.data.details;
  },

  /**
   * GET /mobile/places/reverse?lat=&lng=
   * Returns address details for GPS coordinates.
   */
  reverseGeocode: async (lat: number, lng: number): Promise<PlaceDetails> => {
  // console.log('📍 [PLACES] reverseGeocode called', { lat, lng });
  try {
    const response = await api.get<ApiResponse<{ details: PlaceDetails }>>(
      '/mobile/places/reverse',
      { params: { lat, lng } },
    );
    // console.log('📍 [PLACES] reverseGeocode success', response.data);
    return response.data.data.details;
  } catch (error: unknown) {
    const e = error as any;
    // console.log('📍 [PLACES] reverseGeocode failed', {
    //   status: e?.response?.status,
    //   data: e?.response?.data,
    //   message: e?.message,
    //   url: e?.config?.url,
    // });
    throw error;
  }
},
};