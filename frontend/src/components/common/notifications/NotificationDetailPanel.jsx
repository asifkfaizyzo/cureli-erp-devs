// ============================================
// NOTIFICATION DETAIL PANEL
// Side panel showing full notification details on hover
// ============================================

import React from 'react';
import { X, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import NotificationIcon from './NotificationIcon';
import {
  formatNotificationFullDate,
  getPriorityConfig,
  getNotificationRoute,
} from '../../../config/notifications';

/**
 * NotificationDetailPanel - Full details side panel
 * 
 * @param {Object} notification - Notification data
 * @param {Function} onClose - Close handler
 * @param {Function} onNavigate - Navigation handler
 * @param {boolean} isVisible - Whether panel is visible
 */
const NotificationDetailPanel = ({
  notification,
  onClose,
  onNavigate,
  isVisible,
}) => {
  if (!notification || !isVisible) return null;

  const {
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

  return (
    <div
      className={`
        absolute right-full top-0 mr-2
        w-80 bg-white rounded-xl border border-gray-200 shadow-xl
        transform transition-all duration-200 origin-right
        ${isVisible 
          ? 'opacity-100 scale-100 translate-x-0' 
          : 'opacity-0 scale-95 translate-x-2 pointer-events-none'
        }
      `}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <NotificationIcon eventType={event_type} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                text-[10px] font-medium px-2 py-0.5 rounded-full
                ${priorityConfig.badgeBg} ${priorityConfig.badgeText}
              `}>
                {priorityConfig.label}
              </span>
              {is_read && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <CheckCircle size={10} />
                  Read
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Full Message */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {message}
        </p>

        {/* Context Details (if any) */}
        {context && Object.keys(context).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Details
            </p>
            <div className="space-y-1.5">
              {renderContextDetails(context)}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>Created: {formatNotificationFullDate(created_at)}</span>
          </div>
          {read_at && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle size={12} />
              <span>Read: {formatNotificationFullDate(read_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Navigation */}
      {route && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={() => onNavigate?.(notification)}
            className="
              w-full flex items-center justify-center gap-2
              px-3 py-2 rounded-lg
              bg-[#000060] text-white text-sm font-medium
              hover:bg-[#000080] transition-colors
            "
          >
            <span>View Details</span>
            <ExternalLink size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Render context details in a readable format
 */
const renderContextDetails = (context) => {
  // Filter out internal/sensitive fields
  const displayFields = Object.entries(context).filter(([key]) => {
    const excludeKeys = ['shop_id', 'branch_id', 'user_id', 'inventory_id', 'medicine_id'];
    return !excludeKeys.includes(key);
  });

  if (displayFields.length === 0) return null;

  return displayFields.slice(0, 5).map(([key, value]) => {
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
    }

    return (
      <div key={key} className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{formattedKey}:</span>
        <span className="text-gray-700 font-medium truncate max-w-[150px]">
          {String(displayValue)}
        </span>
      </div>
    );
  });
};

export default NotificationDetailPanel;