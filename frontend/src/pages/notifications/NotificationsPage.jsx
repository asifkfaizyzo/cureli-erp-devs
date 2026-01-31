// ============================================
// frontend\src\pages\notifications\NotificationsPage.jsx
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { deleteNotification } from '../../api/notifications';
import { useToast } from '../../components/common/Toast';

// Components
import NotificationFilters from './components/NotificationFilters';
import NotificationList from './components/NotificationList';
import NotificationSidePanel from './components/NotificationSidePanel';
import InvoicePagination from '../../components/common/Pagination';

// Config - Import at the top, not with require()
import { EVENT_TYPE_GROUPS } from '../../config/notifications';

const NotificationsPage = () => {
  const toast = useToast();

  // ============================================
  // STORE STATE
  // ============================================
  const {
    notifications,
    pagination,
    filters,
    unreadCount,
    isLoading,
    error,
    selectedNotification,
    fetchNotifications,
    setFilters,
    goToPage,
    clearFilters,
    setSelectedNotification,
    clearSelectedNotification,
    markAsRead,
    refresh,
  } = useNotificationStore();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch on mount
  useEffect(() => {
    console.log('[NotificationsPage] Fetching notifications on mount...');
    fetchNotifications();
  }, [fetchNotifications]);

  // Debug: Log when notifications change
  useEffect(() => {
    console.log('[NotificationsPage] Notifications state:', {
      count: notifications.length,
      notifications,
      pagination,
      isLoading,
      error,
    });
  }, [notifications, pagination, isLoading, error]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFilterChange = useCallback((newFilters) => {
    console.log('[NotificationsPage] Filter change:', newFilters);
    
    // Map eventType group to actual event types array
    if (newFilters.eventType !== undefined) {
      // ✅ FIXED: Use imported EVENT_TYPE_GROUPS instead of require()
      const group = EVENT_TYPE_GROUPS[newFilters.eventType];
      
      if (group) {
        newFilters.eventType = group.events;
      } else {
        newFilters.eventType = null;
      }
    }
    
    setFilters(newFilters);
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    clearSelectedNotification();
  }, [clearFilters, clearSelectedNotification]);

  const handleRefresh = useCallback(() => {
    console.log('[NotificationsPage] Manual refresh triggered');
    refresh();
    fetchNotifications();
  }, [refresh, fetchNotifications]);

  const handlePageChange = useCallback((page) => {
    goToPage(page);
    clearSelectedNotification();
  }, [goToPage, clearSelectedNotification]);

  const handleSelectNotification = useCallback((notification) => {
    setSelectedNotification(notification);
  }, [setSelectedNotification]);

  const handleClosePanel = useCallback(() => {
    clearSelectedNotification();
  }, [clearSelectedNotification]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  const handleDelete = useCallback(async (notificationId) => {
    setIsDeleting(true);
    try {
      const response = await deleteNotification(notificationId);
      
      if (response.success) {
        toast.success('Notification deleted');
        clearSelectedNotification();
        fetchNotifications(); // Refresh list
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  }, [clearSelectedNotification, fetchNotifications, toast]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-6">
      {/* Filters Header */}
      <NotificationFilters
        filters={{
          unreadOnly: filters.unreadOnly,
          priority: filters.priority,
          eventType: filters.eventType ? 'custom' : null,
        }}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        unreadCount={unreadCount}
        totalCount={pagination.total}
      />

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Notification List */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* List */}
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            selectedId={selectedNotification?.notification_id}
            onSelect={handleSelectNotification}
            onRetry={handleRefresh}
          />

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex-shrink-0 border-t border-gray-100">
              <InvoicePagination
                currentPage={pagination.page}
                setCurrentPage={handlePageChange}
                totalItems={pagination.total}
                rowsPerPage={pagination.limit}
              />
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="hidden lg:block w-96 flex-shrink-0">
          <div className="h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <NotificationSidePanel
              notification={selectedNotification}
              onClose={handleClosePanel}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </div>

      {/* Mobile Side Panel (Slide-over) */}
      {selectedNotification && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30"
            onClick={handleClosePanel}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl animate-in slide-in-from-right duration-200">
            <NotificationSidePanel
              notification={selectedNotification}
              onClose={handleClosePanel}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;