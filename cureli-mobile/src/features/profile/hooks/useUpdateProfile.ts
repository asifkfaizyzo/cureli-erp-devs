// src/features/profile/hooks/useUpdateProfile.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { profileApi, extractErrorMessage } from '../api/profile.api';
import { QUERY_KEYS } from '../constants/profile.constants';
import { useAuthStore } from '../../../store/authStore';
import type { ProfileFormData } from '../types/profile.types';

interface UseUpdateProfileOptions {
  redirectOnSuccess?: boolean; // default true
}

export function useUpdateProfile(options: UseUpdateProfileOptions = {}) {
  const { redirectOnSuccess = true } = options;
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) => profileApi.updateProfile(data),

    onSuccess: (responseData) => {
      const updatedUser = responseData.user;

      queryClient.setQueryData(QUERY_KEYS.ME, {
        user: { ...updatedUser, address_count: 0 },
      });

      setUser(updatedUser);

      if (redirectOnSuccess) {
        router.back();
      }
    },
  });

  return {
    updateProfile: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error ? extractErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}