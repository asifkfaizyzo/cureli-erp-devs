// ============================================
// frontend\src\pages\notifications\components\NotificationList.jsx
// ============================================

import React from 'react';
import { Inbox, AlertCircle, Loader2 } from 'lucide-react';
import { NotificationItem, NotificationIcon } from '../../../components/common/notifications';
import {
  formatNotificationTime,
  getPriorityConfig,
} from '../../../config/notifications';

/**
 * NotificationList - List of notifications with grouping by date
 */
const NotificationList = ({
  notifications,
  isLoading,
  error,
  selectedId,
  onSelect,
  onRetry,
}) => {
  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">Failed to load notifications</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-[#000060] hover:bg-[#000060]/5 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (notifications.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Inbox size={32} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No notifications found</p>
        <p className="text-xs text-gray-400">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  // ============================================
  // GROUP BY DATE
  // ============================================
  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          {/* Date Header */}
          <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {dateLabel}
            </span>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-gray-50">
            {items.map((notification) => (
              <NotificationListItem
                key={notification.notification_id}
                notification={notification}
                isSelected={selectedId === notification.notification_id}
                onClick={() => onSelect(notification)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Individual notification list item (enhanced version for full page)
 */
const NotificationListItem = ({ notification, isSelected, onClick }) => {
  const {
    event_type,
    title,
    message,
    priority,
    is_read,
    created_at,
  } = notification;

  const priorityConfig = getPriorityConfig(priority);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left transition-all duration-150
        px-4 py-4 flex items-start gap-4
        border-l-4
        ${isSelected
          ? 'bg-[#000060]/5 border-l-[#000060]'
          : is_read
            ? 'border-l-transparent hover:bg-gray-50'
            : `${priorityConfig.bgColor} ${priorityConfig.borderColor} hover:bg-gray-50`
        }
      `}
    >
      {/* Icon */}
      <NotificationIcon eventType={event_type} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`
              font-medium text-sm truncate
              ${is_read ? 'text-gray-700' : 'text-gray-900'}
            `}>
              {title}
            </p>
            
            {/* Unread dot */}
            {!is_read && (
              <span className={`
                w-2.5 h-2.5 rounded-full flex-shrink-0
                ${priorityConfig.dotColor}
              `} />
            )}
          </div>

          {/* Priority Badge */}
          {priority !== 'normal' && (
            <span className={`
              text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0
              ${priorityConfig.badgeBg} ${priorityConfig.badgeText}
            `}>
              {priorityConfig.label}
            </span>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {message}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-gray-400 mt-2">
          {formatNotificationTime(created_at)}
        </p>
      </div>
    </button>
  );
};

/**
 * Group notifications by date (Today, Yesterday, This Week, Older)
 */
const groupNotificationsByDate = (notifications) => {
  const groups = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let label;
    if (notifDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (notifDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else if (notifDate > weekAgo) {
      label = 'This Week';
    } else {
      // Group by month
      label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
  });

  return groups;
};

export default NotificationList;