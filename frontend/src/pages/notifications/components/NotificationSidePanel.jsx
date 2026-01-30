// ============================================
// frontend\src\pages\notifications\components\NotificationSidePanel.jsx
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  Trash2,
  Bell,
} from 'lucide-react';
import { NotificationIcon } from '../../../components/common/notifications';
import {
  formatNotificationFullDate,
  getPriorityConfig,
  getNotificationRoute,
} from '../../../config/notifications';

/**
 * NotificationSidePanel - Full detail view for selected notification
 */
const NotificationSidePanel = ({
  notification,
  onClose,
  onMarkAsRead,
  onDelete,
  isDeleting,
}) => {
  const navigate = useNavigate();

  if (!notification) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Bell size={28} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">Select a notification</p>
        <p className="text-xs text-gray-400 mt-1">
          Click on any notification to view details
        </p>
      </div>
    );
  }

  const {
    notification_id,
    event_type,
    title,
    message,
    priority,
    is_read,
    read_at,
    created_at,
    context,
  } = notification;

  const priorityConfig = getPriorityConfig(priority);
  const route = getNotificationRoute(event_type);

  const handleNavigate = () => {
    if (route) {
      navigate(route);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(notification_id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <NotificationIcon eventType={event_type} size="lg" />
          <div className="pt-1">
            <h2 className="font-semibold text-gray-900 text-base leading-tight">
              {title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`
                text-xs font-semibold px-2 py-0.5 rounded-full
                ${priorityConfig.badgeBg} ${priorityConfig.badgeText}
              `}>
                {priorityConfig.label}
              </span>
              {is_read ? (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Read
                </span>
              ) : (
                <span className="text-xs text-[#000060] font-medium flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#000060]" />
                  Unread
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Full Message */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Message
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Context Details */}
        {context && Object.keys(context).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {renderContextDetails(context)}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Timeline
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Created</p>
                <p className="text-gray-700 font-medium">
                  {formatNotificationFullDate(created_at)}
                </p>
              </div>
            </div>

            {read_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle size={14} className="text-green-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Read</p>
                  <p className="text-gray-700 font-medium">
                    {formatNotificationFullDate(read_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        {/* Navigate Button */}
        {route && (
          <button
            onClick={handleNavigate}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 rounded-lg
              bg-[#000060] text-white text-sm font-medium
              hover:bg-[#000080] transition-colors
            "
          >
            <span>View Details</span>
            <ExternalLink size={14} />
          </button>
        )}

        {/* Secondary Actions */}
        <div className="flex items-center gap-2">
          {/* Mark as Read (if unread) */}
          {!is_read && (
            <button
              onClick={() => onMarkAsRead?.(notification_id)}
              className="
                flex-1 flex items-center justify-center gap-2
                px-4 py-2 rounded-lg border border-gray-200
                text-sm font-medium text-gray-600
                hover:bg-gray-50 transition-colors
              "
            >
              <CheckCircle size={14} />
              Mark as Read
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="
              flex items-center justify-center gap-2
              px-4 py-2 rounded-lg border border-red-200
              text-sm font-medium text-red-600
              hover:bg-red-50 transition-colors
              disabled:opacity-50
            "
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {!is_read ? '' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Render context details in a readable format
 */
const renderContextDetails = (context) => {
  // Filter out internal/sensitive fields
  const excludeKeys = [
    'shop_id', 'branch_id', 'user_id', 'inventory_id', 
    'medicine_id', 'subscription_id', 'ticket_id', 'transaction_id'
  ];
  
  const displayFields = Object.entries(context).filter(([key]) => {
    return !excludeKeys.includes(key);
  });

  if (displayFields.length === 0) {
    return <p className="text-xs text-gray-400 italic">No additional details</p>;
  }

  return displayFields.map(([key, value]) => {
    // Format key for display
    const formattedKey = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // Format value
    let displayValue = value;
    if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    } else if (value === null || value === undefined) {
      return null;
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value);
    }

    return (
      <div key={key} className="flex items-start justify-between gap-4 text-sm">
        <span className="text-gray-500 flex-shrink-0">{formattedKey}</span>
        <span className="text-gray-700 font-medium text-right truncate max-w-[180px]">
          {String(displayValue)}
        </span>
      </div>
    );
  });
};

export default NotificationSidePanel;