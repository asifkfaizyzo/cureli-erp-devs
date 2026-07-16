// src/features/profile/hooks/useMembers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import type {
  FamilyMember,
  CreateMemberPayload,
  UpdateMemberPayload,
} from '../../../types/members';

export const MEMBERS_QUERY_KEY = ['mobile', 'family-members'] as const;

// ── List ──────────────────────────────────────────────────────

export function useMembers() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: async () => {
      const res = await membersApi.list();
      return res.data.data.members;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    members: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}

// ── Create ────────────────────────────────────────────────────

export function useCreateMember(options?: {
  onSuccess?: (member: FamilyMember) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMemberPayload) => membersApi.create(payload),

    onSuccess: (res) => {
      const newMember = res.data.data.member;

      // Optimistic update — append to cached list
      queryClient.setQueryData<FamilyMember[]>(
        MEMBERS_QUERY_KEY,
        (old) => [...(old ?? []), newMember],
      );

      options?.onSuccess?.(newMember);
    },

    onError: (err: any) => {
      const message =
        err?.response?.data?.message ?? 'Failed to add family member.';
      options?.onError?.(message);
    },
  });
}

// ── Update ────────────────────────────────────────────────────

export function useUpdateMember(options?: {
  onSuccess?: (member: FamilyMember) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMemberPayload }) =>
      membersApi.update(id, payload),

    onSuccess: (res) => {
      const updated = res.data.data.member;

      queryClient.setQueryData<FamilyMember[]>(
        MEMBERS_QUERY_KEY,
        (old) =>
          (old ?? []).map((m) => (m.id === updated.id ? updated : m)),
      );

      options?.onSuccess?.(updated);
    },

    onError: (err: any) => {
      const message =
        err?.response?.data?.message ?? 'Failed to update family member.';
      options?.onError?.(message);
    },
  });
}

// ── Delete ────────────────────────────────────────────────────

export function useDeleteMember(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersApi.delete(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<FamilyMember[]>(
        MEMBERS_QUERY_KEY,
        (old) => (old ?? []).filter((m) => m.id !== id),
      );

      options?.onSuccess?.();
    },

    onError: (err: any) => {
      const message =
        err?.response?.data?.message ?? 'Failed to remove family member.';
      options?.onError?.(message);
    },
  });
}