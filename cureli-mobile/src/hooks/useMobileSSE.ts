// cureli-mobile/src/hooks/useMobileSSE.ts

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import EventSource, { CustomEvent } from 'react-native-sse';
import { useQueryClient } from '@tanstack/react-query';

import { StorageService } from '../services/storage';
import { CONFIG } from '../constants/config';
import { useOrderNotificationStore } from '../store/orderNotificationStore';
import { useAuthStore } from '../store/authStore';
import { useBranchStatusStore } from '../store/branchStatusStore';
import { prescriptionRequestKeys } from '../features/prescription-request/hooks/usePrescriptionRequest';

// ── Custom SSE event names this hook subscribes to ────────────────────────────
type SSEEvents =
  | 'connected'
  | 'heartbeat'
  | 'order_status_changed'
  | 'branch_status_changed'
  | 'prescription_quote_received'; // ← NEW

const INITIAL_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS     = 30_000;

export function useMobileSSE() {
  const status                = useAuthStore((s) => s.status);
  const setLastStatusUpdate   = useOrderNotificationStore((s) => s.setLastStatusUpdate);
  const setBranchStatusUpdate = useBranchStatusStore((s) => s.setBranchStatusUpdate);

  // ── NEW ───────────────────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  // ─────────────────────────────────────────────────────────────────────────

  const esRef         = useRef<EventSource<SSEEvents> | null>(null);
  const backoffRef    = useRef<number>(INITIAL_BACKOFF_MS);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef  = useRef<boolean>(true);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current)      return;
    if (status !== 'authenticated') return;
    if (esRef.current)              return;

    const token = StorageService.getAccessToken();
    if (!token) return;

    const url = `${CONFIG.BASE_URL}/mobile/notifications/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource<SSEEvents>(url);
    esRef.current = es;

    // ── Connection confirmed ──────────────────────────────────────────────
    es.addEventListener('connected', () => {
      backoffRef.current = INITIAL_BACKOFF_MS;
    });

    // ── Heartbeat ─────────────────────────────────────────────────────────
    es.addEventListener('heartbeat', () => {
      // Intentionally empty
    });

    // ── Order status changed ──────────────────────────────────────────────
    es.addEventListener('order_status_changed', (event: CustomEvent<'order_status_changed'>) => {
      if (!event.data) return;
      try {
        const data = JSON.parse(event.data);
        setLastStatusUpdate({
          order_id:     data.order_id,
          order_number: data.order_number,
          new_status:   data.new_status,
        });
      } catch {
        // Malformed payload — ignore
      }
    });

    // ── Branch status changed ─────────────────────────────────────────────
    es.addEventListener('branch_status_changed', (event: CustomEvent<'branch_status_changed'>) => {
      if (!event.data) return;
      try {
        const data = JSON.parse(event.data);
        setBranchStatusUpdate({
          branch_id:    data.branch_id,
          is_open:      data.is_open,
          opening_time: data.opening_time ?? null,
          closing_time: data.closing_time ?? null,
          is_24_hours:  data.is_24_hours  ?? false,
        });
      } catch {
        // Malformed payload — ignore
      }
    });

    // ── NEW: Prescription quote received ──────────────────────────────────
    // Fired when a pharmacy sends a quote back to the customer.
    // Invalidates the detail and list queries so any mounted screen
    // refetches immediately without the user needing to pull-to-refresh.
    es.addEventListener('prescription_quote_received', (event: CustomEvent<'prescription_quote_received'>) => {
      if (!event.data) return;
      try {
        const data = JSON.parse(event.data);
        const requestId = data.request_id;

        if (requestId) {
          queryClient.invalidateQueries({
            queryKey: prescriptionRequestKeys.detail(requestId),
          });
          queryClient.invalidateQueries({
            queryKey: prescriptionRequestKeys.lists(),
          });
        }
      } catch {
        // Malformed payload — ignore
      }
    });
    // ─────────────────────────────────────────────────────────────────────

    // ── Error: reconnect with backoff ─────────────────────────────────────
    es.addEventListener('error', () => {
      if (!isMountedRef.current) return;

      esRef.current?.close();
      esRef.current = null;

      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);

      retryTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, delay);
    });
  }, [status, setLastStatusUpdate, setBranchStatusUpdate, queryClient]); // ← queryClient added

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  // ── Connect / disconnect on auth state change ─────────────────────────────
  useEffect(() => {
    if (status === 'authenticated') {
      connect();
    } else {
      disconnect();
    }
  }, [status, connect, disconnect]);

  // ── AppState: background ↔ foreground ────────────────────────────────────
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (status === 'authenticated' && !esRef.current) {
          backoffRef.current = INITIAL_BACKOFF_MS;
          connect();
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [status, connect, disconnect]);
}