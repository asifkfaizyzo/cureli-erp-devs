// src/features/profile/api/profile.api.ts
//
// All profile-related API calls.
// Every method goes through src/services/api.ts (the shared Axios instance).
// Never call axios directly from here.

import { api, authApi } from '../../../services/api';
import type {
  ProfileFormData,
  AddressFormData,
  UpdateAddressPayload,
  MeResponseData,
  AddressesResponseData,
  UpdateProfileResponseData,
  AddressResponseData,
} from '../types/profile.types';
import type { AxiosError } from 'axios';

// ── Shared response wrapper ───────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Error message extractor ───────────────────────────────────
// The interceptor throws raw AxiosError — no reshaping is done.
// Extract the backend message string from the error response body.

export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message: string }>;
  return (
    axiosError.response?.data?.message ??
    'Something went wrong. Please try again.'
  );
}

// ── API methods ───────────────────────────────────────────────

export const profileApi = {
  /**
   * GET /mobile/auth/me
   * Returns the current user with address_count.
   */
  getMe: async (): Promise<MeResponseData> => {
    const response = await authApi.me();
    return response.data.data;
  },

  /**
   * PATCH /mobile/users/profile
   * Updates full_name and/or email.
   */
  updateProfile: async (data: ProfileFormData): Promise<UpdateProfileResponseData> => {
    const response = await api.patch<ApiResponse<UpdateProfileResponseData>>(
      '/mobile/users/profile',
      data,
    );
    return response.data.data;
  },

  /**
   * GET /mobile/users/addresses
   * Returns all non-deleted addresses for the current user.
   */
  getAddresses: async (): Promise<AddressesResponseData> => {
    const response = await api.get<ApiResponse<AddressesResponseData>>(
      '/mobile/users/addresses',
    );
    return response.data.data;
  },

  /**
   * POST /mobile/users/addresses
   * Creates a new address.
   */
  createAddress: async (data: AddressFormData): Promise<AddressResponseData> => {
    const response = await api.post<ApiResponse<AddressResponseData>>(
      '/mobile/users/addresses',
      data,
    );
    return response.data.data;
  },

  /**
   * PATCH /mobile/users/addresses/:id
   * Updates an existing address.
   */
  updateAddress: async ({ id, ...data }: UpdateAddressPayload): Promise<AddressResponseData> => {
    const response = await api.patch<ApiResponse<AddressResponseData>>(
      `/mobile/users/addresses/${id}`,
      data,
    );
    return response.data.data;
  },

  /**
   * PATCH /mobile/users/addresses/:id/default
   * Sets an address as the default.
   */
  setDefaultAddress: async (id: string): Promise<AddressResponseData> => {
    const response = await api.patch<ApiResponse<AddressResponseData>>(
      `/mobile/users/addresses/${id}/default`,
    );
    return response.data.data;
  },

  /**
   * DELETE /mobile/users/addresses/:id
   * Soft deletes an address.
   */
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/mobile/users/addresses/${id}`);
  },

  /**
   * POST /mobile/auth/logout-all
   * Revokes all sessions for the current user.
   * Delegates to the existing authApi method.
   */
  logoutAllDevices: async (): Promise<void> => {
    await authApi.logoutAll();
  },
};