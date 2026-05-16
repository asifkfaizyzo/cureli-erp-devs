// src/features/profile/hooks/useAddressMutations.ts
//
// All address mutations in one hook.
// Each mutation invalidates ADDRESSES query on success.
// Caller receives loading state per operation type.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, extractErrorMessage } from '../api/profile.api';
import { QUERY_KEYS } from '../constants/profile.constants';
import type { AddressFormData, UpdateAddressPayload } from '../types/profile.types';

export function useAddressMutations() {
  const queryClient = useQueryClient();

  const invalidateAddresses = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES });

  // ── Create ────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: AddressFormData) => profileApi.createAddress(data),
    onSuccess: invalidateAddresses,
  });

  // ── Update ────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAddressPayload) => profileApi.updateAddress(data),
    onSuccess: invalidateAddresses,
  });

  // ── Delete ────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileApi.deleteAddress(id),
    onSuccess: invalidateAddresses,
  });

  // ── Set Default ───────────────────────────────────────────

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => profileApi.setDefaultAddress(id),
    onSuccess: invalidateAddresses,
  });

  return {
    // Create
    createAddress: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error
      ? extractErrorMessage(createMutation.error)
      : null,

    // Update
    updateAddress: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error
      ? extractErrorMessage(updateMutation.error)
      : null,

    // Delete
    deleteAddress: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deletingId: null, // individual tracking handled in screen

    // Set default
    setDefaultAddress: setDefaultMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending,
  };
}