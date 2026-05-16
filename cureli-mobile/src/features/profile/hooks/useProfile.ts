// src/features/profile/hooks/useProfile.ts
//
// React Query hook for GET /mobile/auth/me.
// Uses authStore user as initialData to prevent blank flash on first load.

import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { QUERY_KEYS } from '../constants/profile.constants';
import { useAuthStore } from '../../../store/authStore';

export function useProfile() {
  const storeUser = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: profileApi.getMe,
    // Seed the cache with whatever the auth store already has.
    // This renders the screen immediately while the fresh fetch runs.
    initialData: storeUser
      ? { user: { ...storeUser, address_count: 0 } }
      : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: query.data?.user ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}