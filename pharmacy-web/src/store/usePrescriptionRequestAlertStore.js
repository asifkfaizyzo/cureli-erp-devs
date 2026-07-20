// pharmacy-web/src/store/usePrescriptionRequestAlertStore.js
//
// Tracks incoming prescription requests for the pharmacy.
// Mirrors the pattern of useOrderAlertStore but for prescription requests.
// The audio alert is shared — if orders are already alerting, we don't
// double-start the audio. If only requests are pending, we start it.

import { create }       from 'zustand';
import { devtools }     from 'zustand/middleware';
import orderAlertAudio  from '../utils/orderAlertAudio';

const usePrescriptionRequestAlertStore = create(
  devtools(
    (set, get) => ({
      // { [recipient_id]: true } — requests awaiting pharmacy action this session
      pendingRequestIds: {},

      // API-fetched count for refresh recovery (same pattern as order alert store)
      // -1 = not yet fetched
      refreshCount: -1,

      // ── Actions ────────────────────────────────────────────────────────────

      /**
       * Called when prescription_request_new SSE fires.
       * Starts audio if no orders or requests were already pending.
       */
      addPendingRequest: (recipientId) => {
        if (!recipientId) return;

        // Check if audio is already running (orders may have started it)
        // We check both stores to avoid double-starting
        const { pendingRequestIds } = get();
        const prevCount = Object.keys(pendingRequestIds).length;

        set((state) => ({
          pendingRequestIds: { ...state.pendingRequestIds, [recipientId]: true },
        }));

        // Only start audio if this is the first pending item across
        // both orders and requests. The order alert store manages its own
        // audio — we start ours only if orders aren't already alerting.
        // Import is dynamic to avoid circular dependency.
        if (prevCount === 0) {
          // Dynamic import to avoid circular dependency with useOrderAlertStore
          import('./useOrderAlertStore').then(({ default: useOrderAlertStore }) => {
            const orderCount = Object.keys(
              useOrderAlertStore.getState().pendingOrderIds,
            ).length;
            // Only start audio if orders haven't already started it
            if (orderCount === 0) {
              orderAlertAudio.start();
            }
          });
        }
      },

      /**
       * Called when a prescription request is resolved
       * (quote sent → accepted → converted, or declined, or expired).
       * Stops audio when no pending requests OR orders remain.
       */
      resolvePendingRequest: (recipientId) => {
        if (!recipientId) return;

        set((state) => {
          const next = { ...state.pendingRequestIds };
          delete next[recipientId];

          const newRefreshCount =
            state.refreshCount > 0 ? state.refreshCount - 1 : state.refreshCount;

          return { pendingRequestIds: next, refreshCount: newRefreshCount };
        });

        // Stop audio only if both order AND request registries are empty
        const requestCount = Object.keys(get().pendingRequestIds).length;

        import('./useOrderAlertStore').then(({ default: useOrderAlertStore }) => {
          const orderCount = Object.keys(
            useOrderAlertStore.getState().pendingOrderIds,
          ).length;
          if (requestCount === 0 && orderCount === 0) {
            orderAlertAudio.stop();
          }
        });
      },

      setRefreshCount: (count) => set({ refreshCount: count }),

      getBannerCount: () => {
        const { pendingRequestIds, refreshCount } = get();
        const sseCount = Object.keys(pendingRequestIds).length;
        return Math.max(sseCount, refreshCount > 0 ? refreshCount : 0);
      },

      isBannerVisible: () => {
        const { pendingRequestIds, refreshCount } = get();
        const sseCount = Object.keys(pendingRequestIds).length;
        return sseCount > 0 || refreshCount > 0;
      },
    }),
    { name: 'prescription-request-alert-store' },
  ),
);

export default usePrescriptionRequestAlertStore;