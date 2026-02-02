// frontend/src/pages/notifications/NotificationsPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '../../store/useNotificationStore';
import { deleteNotification } from '../../api/notifications';
import { useToast } from '../../components/common/Toast';
import { Bell, RefreshCw, Filter, Inbox, AlertCircle } from 'lucide-react';

// Components
import NotificationList from './components/NotificationList';
import NotificationSidePanel from './components/NotificationSidePanel';
import InvoicePagination from '../../components/common/Pagination';

// Config
import { PRIORITY_CONFIG } from '../../config/notifications';

// Hook for dynamic row count
import useDynamicRowCount from '../../hooks/useDynamicRowCount';

// Breakpoints for notification rows (height -> row count)
const NOTIFICATION_BREAKPOINTS = {
  900: 12,
  800: 10,
  700: 8,
  600: 7,
  500: 6,
  400: 5,
};

const NotificationsPage = () => {
  const toast = useToast();

  // Dynamic row count based on screen height
  const rowsPerPage = useDynamicRowCount({
    breakpoints: NOTIFICATION_BREAKPOINTS,
    fallback: 8,
    debounceMs: 150,
  });

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

  // Fetch with updated limit when rowsPerPage changes
  useEffect(() => {
    fetchNotifications({ limit: rowsPerPage });
  }, [rowsPerPage, fetchNotifications]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFilterChange = useCallback((filterType, value) => {
    if (filterType === 'priority') {
      setFilters({ priority: value || null });
    } else if (filterType === 'unreadOnly') {
      setFilters({ unreadOnly: value });
    }
  }, [setFilters]);

  const handleRefresh = useCallback(() => {
    refresh();
    fetchNotifications({ limit: rowsPerPage });
    toast.success('Refreshed');
  }, [refresh, fetchNotifications, rowsPerPage, toast]);

  const handlePageChange = useCallback((page) => {
    goToPage(page);
    clearSelectedNotification();
  }, [goToPage, clearSelectedNotification]);

  const handleSelectNotification = useCallback((notification) => {
    setSelectedNotification(notification);
    // Auto mark as read when selected
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
  }, [setSelectedNotification, markAsRead]);

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
        fetchNotifications({ limit: rowsPerPage });
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  }, [clearSelectedNotification, fetchNotifications, toast, rowsPerPage]);

  // Filter tabs configuration
  const filterTabs = [
    { id: 'all', label: 'All', filter: { unreadOnly: false, priority: null } },
    { id: 'unread', label: 'Unread', filter: { unreadOnly: true, priority: null }, badge: unreadCount },
    { id: 'critical', label: 'Critical', filter: { unreadOnly: false, priority: 'critical' } },
    { id: 'high', label: 'High', filter: { unreadOnly: false, priority: 'high' } },
  ];

  // Determine active tab
  const getActiveTab = () => {
    if (filters.priority === 'critical') return 'critical';
    if (filters.priority === 'high') return 'high';
    if (filters.unreadOnly) return 'unread';
    return 'all';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab) => {
    clearFilters();
    if (tab.filter.unreadOnly) {
      setFilters({ unreadOnly: true });
    }
    if (tab.filter.priority) {
      setFilters({ priority: tab.filter.priority });
    }
    clearSelectedNotification();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Bar - Matching ProfilePage Style */}
      <div className="flex-shrink-0 border-b border-gray-100 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Title & Tabs Container */}
          <div className="flex items-center gap-6 lg:gap-8">
            {/* Title Section */}
            <div>
              <h1 className="text-xl font-bold text-[#000060]">Notifications</h1>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? (
                  <><span className="text-[#000060] font-medium">{unreadCount} unread</span> · {pagination.total} total</>
                ) : (
                  <>{pagination.total} notifications</>
                )}
              </p>
            </div>

            {/* Horizontal Filter Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {filterTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const showBadge = tab.badge && tab.badge > 0;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-white text-[#000060] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    {showBadge && (
                      <span className={`
                        inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                        text-[10px] font-bold rounded-full
                        ${isActive 
                          ? 'bg-[#000060] text-white' 
                          : 'bg-red-500 text-white'
                        }
                      `}>
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>

        {/* Mobile Filter Tabs */}
        <div className="sm:hidden flex items-center gap-1 mt-3 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.badge && tab.badge > 0;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`
                  flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-white text-[#000060] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span>{tab.label}</span>
                {showBadge && (
                  <span className={`
                    inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5
                    text-[9px] font-bold rounded-full
                    ${isActive ? 'bg-[#000060] text-white' : 'bg-red-500 text-white'}
                  `}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full flex gap-4">
          {/* Notification List */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                  rowsPerPage={rowsPerPage}
                />
              </div>
            )}
          </div>

          {/* Side Panel - Desktop */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={handleClosePanel}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-auto"
          >
            <NotificationSidePanel
              notification={selectedNotification}
              onClose={handleClosePanel}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;