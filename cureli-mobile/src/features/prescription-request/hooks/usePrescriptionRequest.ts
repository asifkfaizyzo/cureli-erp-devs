// src/features/prescription-request/hooks/usePrescriptionRequest.ts

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionRequestApi }               from '../api/prescriptionRequest.api';

// ── Query keys ─────────────────────────────────────────────────────────────

export const prescriptionRequestKeys = {
  all:    ['prescription-requests'] as const,
  lists:  () => [...prescriptionRequestKeys.all, 'list'] as const,
  detail: (id: string) => [...prescriptionRequestKeys.all, 'detail', id] as const,
};

// ── List hook ──────────────────────────────────────────────────────────────

export function usePrescriptionRequests() {
  return useQuery({
    queryKey: prescriptionRequestKeys.lists(),
    queryFn: async () => {
      const res = await prescriptionRequestApi.getRequests({ limit: 50 });
      return res.data?.data?.requests ?? [];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// ── Detail hook ────────────────────────────────────────────────────────────

export function usePrescriptionRequestDetail(requestId: string | null) {
  return useQuery({
    queryKey: prescriptionRequestKeys.detail(requestId ?? ''),
    queryFn:  async () => {
      const res = await prescriptionRequestApi.getRequestDetail(requestId!);
      return res.data?.data ?? null;
    },
    enabled:   !!requestId,
    staleTime: 1000 * 30, // 30 seconds — refreshes more aggressively
    refetchInterval: (query) => {
      // Poll every 30 seconds if request is in an active state
      const data = query.state.data;
      if (!data) return false;
      const activeStatuses = ['PENDING', 'PARTIALLY_RESPONDED', 'FULLY_RESPONDED'];
      return activeStatuses.includes(data.status) ? 30_000 : false;
    },
  });
}

// ── Accept quote mutation ──────────────────────────────────────────────────

export function useAcceptQuote(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipientId: string) =>
      prescriptionRequestApi.acceptQuote(requestId, recipientId),
    onSuccess: () => {
      // Invalidate detail so it refetches with ACCEPTED status
      queryClient.invalidateQueries({
        queryKey: prescriptionRequestKeys.detail(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: prescriptionRequestKeys.lists(),
      });
    },
  });
}

// ── Cancel request mutation ────────────────────────────────────────────────

export function useCancelRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      prescriptionRequestApi.cancelRequest(requestId),
    onSuccess: (_data, requestId) => {
      queryClient.invalidateQueries({
        queryKey: prescriptionRequestKeys.detail(requestId),
      });
      queryClient.invalidateQueries({
        queryKey: prescriptionRequestKeys.lists(),
      });
    },
  });
}

// ── Quote countdown hook ───────────────────────────────────────────────────

export function useQuoteCountdown(expiresAt: string | null) {
  const computeRemaining = useCallback(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  const [remaining, setRemaining] = useState<number | null>(computeRemaining);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => setRemaining(computeRemaining());
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, computeRemaining]);

  if (remaining === null) return { display: null, isExpired: false, isUrgent: false };

  const isExpired = remaining <= 0;
  const isUrgent  = remaining < 120 && !isExpired;
  const mins      = Math.floor(remaining / 60);
  const secs      = remaining % 60;
  const display   = isExpired
    ? 'Expired'
    : `${mins}:${String(secs).padStart(2, '0')}`;

  return { display, isExpired, isUrgent };
}