// ============================================
// cureli-admin/src/store/useCAdminNotificationStore.js
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  fetchUnreadCount as fetchUnreadCountAPI,
  fetchRecentNotifications as fetchRecentAPI,
  fetchNotifications as fetchNotificationsAPI,
  markNotificationAsRead as markAsReadAPI,
  markAllNotificationsAsRead as markAllAsReadAPI,
} from '../api/cadminNotifications';

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

export const useCAdminNotificationStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // ─────────────────────────────────────────
      // BADGE COUNT ACTIONS
      // ─────────────────────────────────────────

      fetchUnreadCount: async () => {
        try {
          const response = await fetchUnreadCountAPI();
          console.log('[CAdminNotificationStore] fetchUnreadCount response:', response);
          
          if (response.success) {
            const { total, by_priority, has_critical, has_high } = response.data;
            
            set({
              unreadCount: total,
              byPriority: by_priority || { critical: 0, high: 0, normal: 0, low: 0 },
              hasCritical: has_critical || false,
              hasHigh: has_high || false,
              lastFetched: new Date().toISOString(),
            });
          }
          
          return response;
        } catch (error) {
          console.error('[CAdminNotificationStore] fetchUnreadCount error:', error);
          return { success: false, error };
        }
      },

      // ─────────────────────────────────────────
      // DROPDOWN (RECENT) ACTIONS
      // ─────────────────────────────────────────

      fetchRecent: async (limit = 5) => {
        set({ isRecentLoading: true, recentError: null });
        
        try {
          const response = await fetchRecentAPI(limit);
          console.log('[CAdminNotificationStore] fetchRecent response:', response);
          
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
          console.error('[CAdminNotificationStore] fetchRecent error:', error);
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

          console.log('[CAdminNotificationStore] fetchNotifications params:', queryParams);

          const response = await fetchNotificationsAPI(queryParams);
          
          console.log('[CAdminNotificationStore] fetchNotifications response:', response);
          
          if (response.success) {
            const { notifications, unread_count, pagination: paginationData } = response.data;
            
            set({
              notifications: notifications || [],
              unreadCount: unread_count || 0,
              pagination: {
                page: paginationData?.page || 1,
                limit: paginationData?.limit || 20,
                total: paginationData?.total || 0,
                totalPages: paginationData?.total_pages || 0,
                hasMore: paginationData?.has_more || false,
              },
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
            
            console.log('[CAdminNotificationStore] State updated with', notifications?.length || 0, 'notifications');
          } else {
            console.warn('[CAdminNotificationStore] Response not successful:', response);
            set({ isLoading: false, error: 'Failed to load notifications' });
          }
          
          return response;
        } catch (error) {
          console.error('[CAdminNotificationStore] fetchNotifications error:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to load notifications',
          });
          return { success: false, error };
        }
      },

      setFilters: async (newFilters) => {
        const { filters } = get();
        
        const updatedFilters = { ...filters, ...newFilters };
        console.log('[CAdminNotificationStore] setFilters:', updatedFilters);
        
        set({
          filters: updatedFilters,
          pagination: { ...get().pagination, page: 1 },
        });

        return get().fetchNotifications({ page: 1, ...newFilters });
      },

      goToPage: async (page) => {
        console.log('[CAdminNotificationStore] goToPage:', page);
        set({
          pagination: { ...get().pagination, page },
        });
        
        return get().fetchNotifications({ page });
      },

      clearFilters: async () => {
        console.log('[CAdminNotificationStore] clearFilters');
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

      markAsRead: async (notificationId) => {
        try {
          const response = await markAsReadAPI(notificationId);
          console.log('[CAdminNotificationStore] markAsRead response:', response);
          
          if (response.success) {
            const now = new Date().toISOString();
            
            set((state) => ({
              recentNotifications: state.recentNotifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: now }
                  : n
              ),
              notifications: state.notifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: now }
                  : n
              ),
              selectedNotification:
                state.selectedNotification?.notification_id === notificationId
                  ? { ...state.selectedNotification, is_read: true, read_at: now }
                  : state.selectedNotification,
              unreadCount: Math.max(0, state.unreadCount - (response.data?.already_read ? 0 : 1)),
            }));
          }
          
          return response;
        } catch (error) {
          console.error('[CAdminNotificationStore] markAsRead error:', error);
          return { success: false, error };
        }
      },

      markAllAsRead: async (options = {}) => {
        try {
          const response = await markAllAsReadAPI(options);
          console.log('[CAdminNotificationStore] markAllAsRead response:', response);
          
          if (response.success) {
            const now = new Date().toISOString();
            
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
          console.error('[CAdminNotificationStore] markAllAsRead error:', error);
          return { success: false, error };
        }
      },

      // ─────────────────────────────────────────
      // SELECTION ACTIONS
      // ─────────────────────────────────────────

      setSelectedNotification: (notification) => {
        set({ selectedNotification: notification });
        
        // Auto-mark as read when selected
        if (notification && !notification.is_read) {
          get().markAsRead(notification.notification_id);
        }
      },

      clearSelectedNotification: () => {
        set({ selectedNotification: null });
      },

      // ─────────────────────────────────────────
      // POLLING ACTIONS
      // ─────────────────────────────────────────

      startPolling: (intervalMs = 60000) => {
        const { pollingInterval } = get();
        
        // Clear existing interval
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        // Fetch immediately
        get().fetchUnreadCount();

        // Set up polling
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

      // ─────────────────────────────────────────
      // UTILITY ACTIONS
      // ─────────────────────────────────────────

      refresh: async () => {
        console.log('[CAdminNotificationStore] refresh');
        await Promise.all([
          get().fetchUnreadCount(),
          get().fetchRecent(),
        ]);
      },

      reset: () => {
        const { pollingInterval } = get();
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        set(initialState);
      },
    }),
    { name: 'cadmin-notification-store' }
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

export default useCAdminNotificationStore;