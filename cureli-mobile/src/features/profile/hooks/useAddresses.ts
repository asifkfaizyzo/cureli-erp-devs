// src/features/profile/hooks/useAddresses.ts
//
// React Query hook for GET /mobile/users/addresses.

import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { QUERY_KEYS } from '../constants/profile.constants';

export function useAddresses() {
  const query = useQuery({
    queryKey: QUERY_KEYS.ADDRESSES,
    queryFn: profileApi.getAddresses,
    staleTime: 1000 * 60 * 5,
  });

  return {
    addresses: query.data?.addresses ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}