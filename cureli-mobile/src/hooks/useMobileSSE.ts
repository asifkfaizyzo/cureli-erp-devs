// cureli-mobile/src/hooks/useMobileSSE.ts
//
// Establishes and maintains an SSE connection to the mobile notifications
// stream endpoint. Designed to be mounted once from _layout.tsx after
// authentication is confirmed.
//
// Lifecycle:
//   - Connects when the hook mounts with a valid token
//   - Disconnects when app goes to background (AppState)
//   - Reconnects when app returns to foreground
//   - Reconnects on connection error with exponential backoff
//   - Disconnects permanently on logout (token cleared from storage)
//
// Events handled:
//   connected            — confirms connection, no action needed
//   heartbeat            — keeps connection alive, no action needed
//   order_status_changed — updates orderNotificationStore
//   branch_status_changed — updates branchStatusStore

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import EventSource, { CustomEvent } from 'react-native-sse';

import { StorageService } from '../services/storage';
import { CONFIG } from '../constants/config';
import { useOrderNotificationStore } from '../store/orderNotificationStore';
import { useAuthStore } from '../store/authStore';
import { useBranchStatusStore } from '../store/branchStatusStore';

// ── Custom SSE event names this hook subscribes to ────────────────────────────
// Must be declared here and passed as the generic to EventSource so TypeScript
// accepts them in .addEventListener() calls. Any event not in this union will
// be a compile-time error — intentional, keeps the contract explicit.
type SSEEvents =
  | 'connected'
  | 'heartbeat'
  | 'order_status_changed'
  | 'branch_status_changed';

// Backoff config — doubles on each retry, capped at 30s
const INITIAL_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS     = 30_000;

export function useMobileSSE() {
  const status                = useAuthStore((s) => s.status);
  const setLastStatusUpdate   = useOrderNotificationStore((s) => s.setLastStatusUpdate);
  const setBranchStatusUpdate = useBranchStatusStore((s) => s.setBranchStatusUpdate);

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
    // Do not connect if already connected, not authenticated, or unmounted
    if (!isMountedRef.current)      return;
    if (status !== 'authenticated') return;
    if (esRef.current)              return;

    const token = StorageService.getAccessToken();
    if (!token) return;

    const url = `${CONFIG.BASE_URL}/mobile/notifications/stream?token=${encodeURIComponent(token)}`;

    // Generic union tells TypeScript exactly which custom event names are valid
    // for addEventListener() on this instance.
    const es = new EventSource<SSEEvents>(url);
    esRef.current = es;

    // ── Connection confirmed ──────────────────────────────────────────────
    es.addEventListener('connected', () => {
      // Reset backoff on successful connection
      backoffRef.current = INITIAL_BACKOFF_MS;
    });

    // ── Heartbeat — no action needed ──────────────────────────────────────
    es.addEventListener('heartbeat', () => {
      // Intentionally empty — heartbeat keeps connection alive through proxies
    });

    // ── Order status changed ──────────────────────────────────────────────
    // Fired by the backend after any state transition:
    // ACCEPTED, REJECTED, READY_FOR_PICKUP, COMPLETED, CANCELLED
    //
    // CustomEvent<'order_status_changed'> is what react-native-sse passes to
    // callbacks for non-built-in event names. It carries a .data string field
    // (the raw SSE data payload) just like MessageEvent, but its .type is
    // the custom event name rather than "message".
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
        // Malformed SSE payload — ignore silently
      }
    });

    // ── Branch status changed ─────────────────────────────────────────────
    // Fired by the marketplace scheduler when a branch auto-opens or
    // auto-closes based on its configured open_days / opening_time /
    // closing_time. Updates branchStatusStore so any mounted ShopProfile
    // screen can patch its React Query cache without a full refetch.
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

    // ── Error: connection dropped ─────────────────────────────────────────
    // Reconnect with exponential backoff.
    es.addEventListener('error', () => {
      if (!isMountedRef.current) return;

      // Close the broken connection
      esRef.current?.close();
      esRef.current = null;

      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);

      retryTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, delay);
    });
  }, [status, setLastStatusUpdate, setBranchStatusUpdate]);

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  // ── Connect when authenticated ────────────────────────────────────────────
  // Disconnect when logged out
  useEffect(() => {
    if (status === 'authenticated') {
      connect();
    } else {
      disconnect();
    }
  }, [status, connect, disconnect]);

  // ── AppState: background → foreground ────────────────────────────────────
  // Reconnect when app comes back to foreground.
  // Disconnect when app goes to background to conserve battery and
  // avoid keeping connections alive unnecessarily.
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Came to foreground — reconnect if authenticated and not connected
        if (status === 'authenticated' && !esRef.current) {
          backoffRef.current = INITIAL_BACKOFF_MS; // reset backoff on intentional reconnect
          connect();
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        // Going to background — close connection cleanly
        disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [status, connect, disconnect]);
}