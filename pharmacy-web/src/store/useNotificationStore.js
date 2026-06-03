// ============================================
// pharmacy-web/src/store/useNotificationStore.js
// ============================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  fetchUnreadCount as fetchUnreadCountAPI,
  fetchRecentNotifications as fetchRecentAPI,
  fetchNotifications as fetchNotificationsAPI,
  markNotificationAsRead as markAsReadAPI,
  markAllNotificationsAsRead as markAllAsReadAPI,
} from "../api/notifications";

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  // Recent / dropdown
  recentNotifications: [],
  isRecentLoading: false,
  recentError: null,

  // Badge counts
  unreadCount: 0,
  byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
  hasCritical: false,
  hasHigh: false,

  // Full notification list
  notifications: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
  isLoading: false,
  error: null,

  // Detail view
  selectedNotification: null,

  // Filters
  filters: {
    unreadOnly: false,
    priority: null,
    eventType: null,
  },

  // SSE state
  hasNewNotifications: false,

  // Marketplace order real-time state
  newOrderCount: 0,

  // Polling
  lastFetched: null,
  pollingInterval: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useNotificationStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // ── SSE Actions ──────────────────────────────────────────────────────

      /**
       * Manually set the hasNewNotifications flag.
       * Call with (false) when user opens the notification panel/page.
       */
      setHasNewNotifications: (val) => set({ hasNewNotifications: val }),

      /**
       * Called by the SSE hook when a `new_notification` event arrives.
       * Updates badge count, prepends the notification to recentNotifications,
       * and raises the hasNewNotifications flag to trigger UI indicators.
       */
      receiveSSENotification: (data) => {
        const { unread_count, notification } = data;

        set((state) => ({
          unreadCount: unread_count,
          hasNewNotifications: true,
          recentNotifications: notification
            ? [notification, ...state.recentNotifications].slice(0, 10)
            : state.recentNotifications,
        }));
      },

      /**
       * Called by SSE hook when a marketplace_new_order event arrives.
       * Increments the new order badge count on the sidebar Orders item.
       * Cleared when user navigates to /marketplace/orders.
       */
      receiveNewOrderSSE: () => {
        set((state) => ({
          newOrderCount: state.newOrderCount + 1,
        }));
      },

      /**
       * Call when user opens the Orders page.
       */
      clearNewOrderCount: () => set({ newOrderCount: 0 }),

      // ── Badge Count ──────────────────────────────────────────────────────

      fetchUnreadCount: async () => {
        try {
          const response = await fetchUnreadCountAPI();

          if (response.success) {
            const { total, by_priority, has_critical, has_high } =
              response.data;
            set({
              unreadCount: total,
              byPriority: by_priority || {
                critical: 0,
                high: 0,
                normal: 0,
                low: 0,
              },
              hasCritical: has_critical || false,
              hasHigh: has_high || false,
              lastFetched: new Date().toISOString(),
            });
          }

          return response;
        } catch (error) {
          console.error("[NotificationStore] fetchUnreadCount error:", error);
          return { success: false, error };
        }
      },

      // ── Dropdown (Recent) ────────────────────────────────────────────────

      fetchRecent: async (limit = 5) => {
        set({ isRecentLoading: true, recentError: null });

        try {
          const response = await fetchRecentAPI(limit);

          if (response.success) {
            set({
              recentNotifications: response.data.notifications || [],
              unreadCount: response.data.unread_count || 0,
              isRecentLoading: false,
              lastFetched: new Date().toISOString(),
            });
          } else {
            set({ isRecentLoading: false });
          }

          return response;
        } catch (error) {
          console.error("[NotificationStore] fetchRecent error:", error);
          set({
            isRecentLoading: false,
            recentError: error.message || "Failed to load notifications",
          });
          return { success: false, error };
        }
      },

      // ── Full Page ────────────────────────────────────────────────────────

      fetchNotifications: async (params = {}) => {
        const { filters, pagination } = get();
        set({ isLoading: true, error: null });

        try {
          const queryParams = {
            page: params.page || pagination.page,
            limit: params.limit || pagination.limit,
            unread_only: params.unreadOnly ?? filters.unreadOnly,
            priority: params.priority ?? filters.priority,
            event_type: params.eventType ?? filters.eventType,
          };

          // Strip falsy / null / undefined values
          Object.keys(queryParams).forEach((key) => {
            if (
              queryParams[key] === null ||
              queryParams[key] === undefined ||
              queryParams[key] === false
            ) {
              delete queryParams[key];
            }
          });

          const response = await fetchNotificationsAPI(queryParams);

          if (response.success) {
            const {
              notifications,
              unread_count,
              pagination: pg,
            } = response.data;
            set({
              notifications: notifications || [],
              unreadCount: unread_count || 0,
              pagination: pg || {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasMore: false,
              },
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
          } else {
            set({ isLoading: false, error: "Failed to load notifications" });
          }

          return response;
        } catch (error) {
          console.error("[NotificationStore] fetchNotifications error:", error);
          set({
            isLoading: false,
            error: error.message || "Failed to load notifications",
          });
          return { success: false, error };
        }
      },

      setFilters: async (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };

        set({
          filters: updatedFilters,
          pagination: { ...get().pagination, page: 1 },
        });

        return get().fetchNotifications({ page: 1, ...newFilters });
      },

      goToPage: async (page) => {
        set({ pagination: { ...get().pagination, page } });
        return get().fetchNotifications({ page });
      },

      clearFilters: async () => {
        set({
          filters: { unreadOnly: false, priority: null, eventType: null },
          pagination: { ...get().pagination, page: 1 },
        });
        return get().fetchNotifications({ page: 1 });
      },

      // ── Mark As Read ─────────────────────────────────────────────────────

      markAsRead: async (notificationId) => {
        try {
          const response = await markAsReadAPI(notificationId);

          if (response.success) {
            const now = new Date().toISOString();
            const alreadyRead = response.data?.already_read ?? false;

            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: now }
                  : n,
              ),
              recentNotifications: state.recentNotifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: now }
                  : n,
              ),
              selectedNotification:
                state.selectedNotification?.notification_id === notificationId
                  ? {
                      ...state.selectedNotification,
                      is_read: true,
                      read_at: now,
                    }
                  : state.selectedNotification,
              // Only decrement if it was actually unread
              unreadCount: alreadyRead
                ? state.unreadCount
                : Math.max(0, state.unreadCount - 1),
            }));
          }

          return response;
        } catch (error) {
          console.error("[NotificationStore] markAsRead error:", error);
          return { success: false, error };
        }
      },

      markAllAsRead: async (options = {}) => {
        try {
          const response = await markAllAsReadAPI(options);

          if (response.success) {
            const now = new Date().toISOString();
            set((state) => ({
              notifications: state.notifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: n.read_at || now,
              })),
              recentNotifications: state.recentNotifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: n.read_at || now,
              })),
              selectedNotification: state.selectedNotification
                ? {
                    ...state.selectedNotification,
                    is_read: true,
                    read_at: state.selectedNotification.read_at || now,
                  }
                : null,
              unreadCount: 0,
              byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
              hasCritical: false,
              hasHigh: false,
              // Clear new-notification indicator when user reads everything
              hasNewNotifications: false,
            }));
          }

          return response;
        } catch (error) {
          console.error("[NotificationStore] markAllAsRead error:", error);
          return { success: false, error };
        }
      },

      // ── Selection ────────────────────────────────────────────────────────

      setSelectedNotification: (notification) => {
        set({ selectedNotification: notification });
        if (notification && !notification.is_read) {
          get().markAsRead(notification.notification_id);
        }
      },

      clearSelectedNotification: () => set({ selectedNotification: null }),

      // ── Polling ──────────────────────────────────────────────────────────

      /**
       * Start polling for unread count.
       * Default raised to 5 minutes (300_000 ms) — SSE handles real-time,
       * polling is a fallback for missed events / reconnections.
       */
      startPolling: (intervalMs = 300000) => {
        const { pollingInterval } = get();
        if (pollingInterval) clearInterval(pollingInterval);

        // Fetch immediately on mount
        get().fetchUnreadCount();

        const interval = setInterval(() => {
          get().fetchUnreadCount();
        }, intervalMs);

        set({ pollingInterval: interval });
      },

      stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }
      },

      refresh: async () => {
        await Promise.all([get().fetchUnreadCount(), get().fetchRecent()]);
      },

      reset: () => {
        const { pollingInterval } = get();
        if (pollingInterval) clearInterval(pollingInterval);
        set(initialState);
      },
    }),
    { name: "notification-store" },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────

export const selectUnreadCount = (state) => state.unreadCount;
export const selectHasCritical = (state) => state.hasCritical;
export const selectHasHigh = (state) => state.hasHigh;
export const selectHasNewNotifications = (state) => state.hasNewNotifications;
export const selectNewOrderCount = (state) => state.newOrderCount;
export const selectRecentNotifications = (state) => state.recentNotifications;
export const selectIsRecentLoading = (state) => state.isRecentLoading;
export const selectNotifications = (state) => state.notifications;
export const selectPagination = (state) => state.pagination;
export const selectFilters = (state) => state.filters;
export const selectSelectedNotification = (state) => state.selectedNotification;
export const selectIsLoading = (state) => state.isLoading;

export default useNotificationStore;