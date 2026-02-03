// cureli-admin/src/pages/Notifications/NotificationsPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, RefreshCw, CheckCheck, Loader2 } from 'lucide-react';

import NotificationList from './components/NotificationList';
import NotificationSidePanel from './components/NotificationSidePanel';
import Pagination from '../../components/common/Pagination';
import { useCAdminNotificationStore } from '../../store/useCAdminNotificationStore';
import { useMenuStore } from '../../store/useMenuStore';
import { markNotificationAsRead } from '../../api/cadminNotifications';
import { useToast } from '../../components/common/Toast';
import useDynamicRowCount from '../../hooks/useDynamicRowCount';

const NotificationsPage = () => {
  const location = useLocation();
  const toast = useToast();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  // Dynamic row count based on screen height
  const rowsPerPage = useDynamicRowCount();

  // Store
  const {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    error,
    filters,
    selectedNotification,
    fetchNotifications,
    setFilters,
    goToPage,
    clearFilters,
    markAllAsRead,
    setSelectedNotification,
    clearSelectedNotification,
  } = useCAdminNotificationStore();

  // Local state
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================
  
  useEffect(() => {
    setBreadcrumbs(["Notifications"]);
  }, [setBreadcrumbs]);

  // Fetch with updated limit when rowsPerPage changes
  useEffect(() => {
    fetchNotifications({ limit: rowsPerPage });
  }, [rowsPerPage, fetchNotifications]);

  // Handle pre-selected notification from dropdown navigation
  useEffect(() => {
    const selectedId = location.state?.selectedNotificationId;
    if (selectedId && notifications.length > 0) {
      const notification = notifications.find(n => n.notification_id === selectedId);
      if (notification) {
        setSelectedNotification(notification);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, notifications, setSelectedNotification]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    fetchNotifications({ limit: rowsPerPage });
    toast.success('Refreshed');
  }, [fetchNotifications, rowsPerPage, toast]);

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
      toast.success('All marked as read');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleSelectNotification = useCallback((notification) => {
    setSelectedNotification(notification);
    // Auto mark as read when selected
    if (!notification.is_read) {
      markNotificationAsRead(notification.notification_id).catch(console.error);
      fetchNotifications({ limit: rowsPerPage });
    }
  }, [setSelectedNotification, fetchNotifications, rowsPerPage]);

  const handleClosePanel = useCallback(() => {
    clearSelectedNotification();
  }, [clearSelectedNotification]);

  const handlePageChange = useCallback((page) => {
    goToPage(page);
    clearSelectedNotification();
  }, [goToPage, clearSelectedNotification]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications({ limit: rowsPerPage });
      toast.success('Marked as read');
    } catch (err) {
      console.error('Mark as read error:', err);
      toast.error('Failed to mark as read');
    }
  }, [fetchNotifications, rowsPerPage, toast]);

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
    <div className="flex flex-col">
      {/* Header Bar */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Title & Tabs Container */}
            <div className="flex items-center gap-6 lg:gap-8">
              {/* Title Section */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#000060]/10 flex items-center justify-center">
                  <Bell size={20} className="text-[#000060]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#000060]">Notifications</h1>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0 ? (
                      <>
                        <span className="text-[#000060] font-medium">{unreadCount} unread</span>
                        {' · '}
                        {pagination.total} total
                      </>
                    ) : (
                      <>{pagination.total} notifications</>
                    )}
                  </p>
                </div>
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

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAllRead}
                  className="
                    hidden sm:flex items-center gap-2 px-3 py-2 
                    text-sm font-medium text-[#000060]
                    bg-[#000060]/5 hover:bg-[#000060]/10
                    rounded-lg transition-colors
                    disabled:opacity-50
                  "
                >
                  {isMarkingAllRead ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCheck size={16} />
                  )}
                  <span>Mark all read</span>
                </button>
              )}

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
      </div>

      {/* Main Content Area - Relative container for side panel positioning */}
      <div className="relative flex gap-4 items-start">
        {/* Notification List - Height based on content */}
        <div className={`flex-1 min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${
          selectedNotification ? 'hidden lg:block' : 'block'
        }`}>
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
            <div className="border-t border-gray-100">
              <Pagination
                currentPage={pagination.page}
                setCurrentPage={handlePageChange}
                totalItems={pagination.total}
                rowsPerPage={rowsPerPage}
              />
            </div>
          )}
        </div>

        {/* Side Panel - Desktop (Animated slide-in, independent height) */}
        <AnimatePresence>
          {selectedNotification && (
            <motion.div
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 400 }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="hidden lg:block flex-shrink-0 sticky top-0"
            >
              <NotificationSidePanel
                notification={selectedNotification}
                onClose={handleClosePanel}
                onMarkAsRead={handleMarkAsRead}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Side Panel (Full screen slide-over) */}
      <AnimatePresence>
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
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;