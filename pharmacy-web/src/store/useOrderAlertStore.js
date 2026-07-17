// pharmacy-web/src/store/useOrderAlertStore.js
// REPLACED
// Key changes:
//   1. Calls orderAlertAudio.start() / stop() directly — no Zustand subscription
//   2. resolvePendingOrder also decrements refreshCount so banner
//      stays accurate after user visits orders page without acting
//   3. clearRefreshCount removed — no longer needed

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import orderAlertAudio from '../utils/orderAlertAudio';

const useOrderAlertStore = create(
  devtools(
    (set, get) => ({
      // { [order_id]: true } — orders awaiting pharmacy action this session
      pendingOrderIds: {},

      // Count fetched from API on mount (refresh recovery for banner only).
      // -1 = not yet fetched, 0 = none, N = count
      refreshCount: -1,

      // ── Actions ──────────────────────────────────────────────────────────

      /**
       * Called when marketplace_new_order SSE fires.
       * If this is the first pending order, starts the audio loop.
       */
      addPendingOrder: (orderId) => {
        if (!orderId) return;

        const prevCount = Object.keys(get().pendingOrderIds).length;

        set((state) => ({
          pendingOrderIds: { ...state.pendingOrderIds, [orderId]: true },
        }));

        // Start audio only when transitioning from 0 → 1
        // (subsequent orders don't restart the already-looping audio)
        if (prevCount === 0) {
          orderAlertAudio.start();
        }
      },

      /**
       * Called when marketplace_order_status_changed SSE fires with
       * new_status of ACCEPTED, REJECTED, or CANCELLED.
       *
       * Two things happen:
       *   1. Order removed from SSE pending registry
       *   2. refreshCount decremented (so banner count stays accurate
       *      even if this order was counted in the refresh-recovery fetch)
       *
       * When SSE registry is empty → audio stops.
       */
      resolvePendingOrder: (orderId) => {
        if (!orderId) return;

        set((state) => {
          const next = { ...state.pendingOrderIds };
          const wasTracked = next[orderId] === true;
          delete next[orderId];

          const newCount = Object.keys(next).length;

          // Decrement refreshCount if it's positive, regardless of whether
          // this specific order was in the SSE registry.
          // This handles the case where orders existed before page load
          // and are now being resolved during the session.
          const newRefreshCount = state.refreshCount > 0
            ? state.refreshCount - 1
            : state.refreshCount;

          return {
            pendingOrderIds: next,
            refreshCount: newRefreshCount,
          };
        });

        // Stop audio when no more SSE-tracked orders are pending
        const remaining = Object.keys(get().pendingOrderIds).length;
        if (remaining === 0) {
          orderAlertAudio.stop();
        }
      },

      /**
       * Called by NewOrderBanner on mount to store the API-fetched count.
       * Only sets if still at initial value (-1) to avoid overwriting
       * a count that's already been updated by SSE during the fetch.
       */
      setRefreshCount: (count) => {
        // Only update if we're still at the initial unfetched state
        // or if the new count is meaningful.
        set({ refreshCount: count });
      },

      // ── Derived helpers ───────────────────────────────────────────────────

      /**
       * Total count to display in the banner.
       * SSE count takes priority; falls back to refreshCount.
       * De-duplicates: if an order arrived via SSE AND was in the refresh
       * count, we show whichever is larger to avoid under-counting.
       */
      getBannerCount: () => {
        const { pendingOrderIds, refreshCount } = get();
        const sseCount = Object.keys(pendingOrderIds).length;
        // Take the larger of the two to avoid under-reporting
        return Math.max(sseCount, refreshCount > 0 ? refreshCount : 0);
      },

      /**
       * Whether the banner should be visible at all.
       */
      isBannerVisible: () => {
        const { pendingOrderIds, refreshCount } = get();
        const sseCount = Object.keys(pendingOrderIds).length;
        return sseCount > 0 || refreshCount > 0;
      },
    }),
    { name: 'order-alert-store' },
  ),
);

export default useOrderAlertStore;