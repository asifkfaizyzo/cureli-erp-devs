// ============================================
// NOTIFICATION STORE (Zustand)
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  fetchUnreadCount,
  fetchRecentNotifications,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notifications';

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Dropdown (recent) notifications
  recentNotifications: [],
  isRecentLoading: false,
  recentError: null,

  // Badge count
  unreadCount: 0,
  byPriority: {
    critical: 0,
    high: 0,
    normal: 0,
    low: 0,
  },
  hasCritical: false,
  hasHigh: false,

  // Full page notifications
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

  // Selected notification (for side panel)
  selectedNotification: null,

  // Filters (for full page)
  filters: {
    unreadOnly: false,
    priority: null,
    eventType: null,
  },

  // Polling
  lastFetched: null,
  pollingInterval: null,
};

// ============================================
// STORE
// ============================================

export const useNotificationStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // ─────────────────────────────────────────
      // BADGE COUNT ACTIONS
      // ─────────────────────────────────────────

      /**
       * Fetch unread count for badge
       */
      fetchUnreadCount: async () => {
        try {
          const response = await fetchUnreadCount();
          
          if (response.success) {
            const { total, by_priority, has_critical, has_high } = response.data;
            
            set({
              unreadCount: total,
              byPriority: by_priority,
              hasCritical: has_critical,
              hasHigh: has_high,
              lastFetched: new Date().toISOString(),
            });
          }
          
          return response;
        } catch (error) {
          console.error('[NotificationStore] fetchUnreadCount error:', error);
          return { success: false, error };
        }
      },

      // ─────────────────────────────────────────
      // DROPDOWN (RECENT) ACTIONS
      // ─────────────────────────────────────────

      /**
       * Fetch recent notifications for dropdown
       */
      fetchRecent: async (limit = 5) => {
        set({ isRecentLoading: true, recentError: null });
        
        try {
          const response = await fetchRecentNotifications(limit);
          
          if (response.success) {
            set({
              recentNotifications: response.data.notifications,
              unreadCount: response.data.unread_count,
              isRecentLoading: false,
              lastFetched: new Date().toISOString(),
            });
          }
          
          return response;
        } catch (error) {
          console.error('[NotificationStore] fetchRecent error:', error);
          set({
            isRecentLoading: false,
            recentError: error.message || 'Failed to load notifications',
          });
          return { success: false, error };
        }
      },

      // ─────────────────────────────────────────
      // FULL PAGE ACTIONS
      // ─────────────────────────────────────────

      /**
       * Fetch notifications for full page with pagination
       */
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

          // Clean undefined/null values
          Object.keys(queryParams).forEach(key => {
            if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === false) {
              delete queryParams[key];
            }
          });

          const response = await fetchNotifications(queryParams);
          
          if (response.success) {
            set({
              notifications: response.data.notifications,
              unreadCount: response.data.unread_count,
              pagination: response.data.pagination,
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
          }
          
          return response;
        } catch (error) {
          console.error('[NotificationStore] fetchNotifications error:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to load notifications',
          });
          return { success: false, error };
        }
      },

      /**
       * Set filters and refetch
       */
      setFilters: async (newFilters) => {
        const { filters } = get();
        
        set({
          filters: { ...filters, ...newFilters },
          pagination: { ...get().pagination, page: 1 }, // Reset to page 1
        });

        // Refetch with new filters
        return get().fetchNotifications({ page: 1, ...newFilters });
      },

      /**
       * Go to specific page
       */
      goToPage: async (page) => {
        set({
          pagination: { ...get().pagination, page },
        });
        
        return get().fetchNotifications({ page });
      },

      /**
       * Clear filters
       */
      clearFilters: async () => {
        set({
          filters: {
            unreadOnly: false,
            priority: null,
            eventType: null,
          },
          pagination: { ...get().pagination, page: 1 },
        });

        return get().fetchNotifications({ page: 1 });
      },

      // ─────────────────────────────────────────
      // MARK AS READ ACTIONS
      // ─────────────────────────────────────────

      /**
       * Mark single notification as read
       */
      markAsRead: async (notificationId) => {
        try {
          const response = await markNotificationAsRead(notificationId);
          
          if (response.success) {
            // Update local state immediately (optimistic)
            set((state) => ({
              // Update recent notifications
              recentNotifications: state.recentNotifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: new Date().toISOString() }
                  : n
              ),
              // Update full page notifications
              notifications: state.notifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: new Date().toISOString() }
                  : n
              ),
              // Update selected notification if it's the one being marked
              selectedNotification:
                state.selectedNotification?.notification_id === notificationId
                  ? { ...state.selectedNotification, is_read: true, read_at: new Date().toISOString() }
                  : state.selectedNotification,
              // Decrement unread count
              unreadCount: Math.max(0, state.unreadCount - (response.data.already_read ? 0 : 1)),
            }));
          }
          
          return response;
        } catch (error) {
          console.error('[NotificationStore] markAsRead error:', error);
          return { success: false, error };
        }
      },

      /**
       * Mark all notifications as read
       */
      markAllAsRead: async (options = {}) => {
        try {
          const response = await markAllNotificationsAsRead(options);
          
          if (response.success) {
            const now = new Date().toISOString();
            
            // Update local state
            set((state) => ({
              recentNotifications: state.recentNotifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: n.read_at || now,
              })),
              notifications: state.notifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: n.read_at || now,
              })),
              unreadCount: 0,
              byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
              hasCritical: false,
              hasHigh: false,
            }));
          }
          
          return response;
        } catch (error) {
          console.error('[NotificationStore] markAllAsRead error:', error);
          return { success: false, error };
        }
      },

      // ─────────────────────────────────────────
      // SELECTION ACTIONS
      // ─────────────────────────────────────────

      /**
       * Set selected notification (for side panel)
       */
      setSelectedNotification: (notification) => {
        set({ selectedNotification: notification });
        
        // Auto-mark as read when selected
        if (notification && !notification.is_read) {
          get().markAsRead(notification.notification_id);
        }
      },

      /**
       * Clear selected notification
       */
      clearSelectedNotification: () => {
        set({ selectedNotification: null });
      },

      // ─────────────────────────────────────────
      // POLLING ACTIONS
      // ─────────────────────────────────────────

      /**
       * Start polling for unread count
       */
      startPolling: (intervalMs = 60000) => {
        const { pollingInterval } = get();
        
        // Clear existing interval
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        // Initial fetch
        get().fetchUnreadCount();

        // Set up polling
        const interval = setInterval(() => {
          get().fetchUnreadCount();
        }, intervalMs);

        set({ pollingInterval: interval });
      },

      /**
       * Stop polling
       */
      stopPolling: () => {
        const { pollingInterval } = get();
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }
      },

      // ─────────────────────────────────────────
      // UTILITY ACTIONS
      // ─────────────────────────────────────────

      /**
       * Refresh all notification data
       */
      refresh: async () => {
        await Promise.all([
          get().fetchUnreadCount(),
          get().fetchRecent(),
        ]);
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        const { pollingInterval } = get();
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        set(initialState);
      },
    }),
    { name: 'notification-store' }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectUnreadCount = (state) => state.unreadCount;
export const selectHasCritical = (state) => state.hasCritical;
export const selectHasHigh = (state) => state.hasHigh;
export const selectRecentNotifications = (state) => state.recentNotifications;
export const selectIsRecentLoading = (state) => state.isRecentLoading;
export const selectNotifications = (state) => state.notifications;
export const selectPagination = (state) => state.pagination;
export const selectFilters = (state) => state.filters;
export const selectSelectedNotification = (state) => state.selectedNotification;
export const selectIsLoading = (state) => state.isLoading;

export default useNotificationStore;