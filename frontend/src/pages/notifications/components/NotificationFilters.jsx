// frontend/src/pages/notifications/components/NotificationFilters.jsx

import React from 'react';
import { Filter, X, Bell, RefreshCw, Megaphone } from 'lucide-react';
import StyledSelect from '../../../components/common/StyledSelect';
import { EVENT_TYPE_GROUPS, PRIORITY_CONFIG } from '../../../config/notifications';

/**
 * NotificationFilters - Filter bar for notifications page
 */
const NotificationFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  onRefresh,
  isLoading,
  unreadCount,
  totalCount,
}) => {
  const { unreadOnly, priority, eventType } = filters;

  // Priority options
  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label,
    })),
  ];

  // Event type group options - Put announcements first
  const eventTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'announcements', label: '📢 Announcements' },
    ...Object.entries(EVENT_TYPE_GROUPS)
      .filter(([key]) => key !== 'announcements')
      .map(([key, group]) => ({
        value: key,
        label: group.label,
      })),
  ];

  // Check if any filter is active
  const hasActiveFilters = unreadOnly || priority || eventType;

  // Check if filtering announcements only
  const isAnnouncementsFilter = eventType === 'announcements';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isAnnouncementsFilter ? 'bg-indigo-100' : 'bg-[#000060]/5'
          }`}>
            {isAnnouncementsFilter ? (
              <Megaphone size={18} className="text-indigo-600" />
            ) : (
              <Bell size={18} className="text-[#000060]" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {isAnnouncementsFilter ? 'Announcements' : 'Notifications'}
            </h1>
            <p className="text-xs text-gray-500">
              {unreadCount > 0 ? (
                <>
                  <span className="text-[#000060] font-medium">{unreadCount} unread</span>
                  {' · '}
                </>
              ) : null}
              {totalCount} total
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            size={18}
            className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Filters Row */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Filter Icon */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={16} />
          <span className="font-medium">Filters:</span>
        </div>

        {/* Quick Filter: Announcements Only */}
        <button
          onClick={() => onFilterChange({ 
            eventType: isAnnouncementsFilter ? null : 'announcements' 
          })}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            border flex items-center gap-1.5
            ${isAnnouncementsFilter
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
            }
          `}
        >
          <Megaphone size={14} />
          Announcements
        </button>

        {/* Unread Toggle */}
        <button
          onClick={() => onFilterChange({ unreadOnly: !unreadOnly })}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            border
            ${unreadOnly
              ? 'bg-[#000060] text-white border-[#000060]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          Unread Only
          {unreadOnly && unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Priority Filter */}
        <div className="w-40">
          <StyledSelect
            value={priority || ''}
            onChange={(val) => onFilterChange({ priority: val || null })}
            options={priorityOptions}
            placeholder="Priority"
          />
        </div>

        {/* Event Type Filter */}
        <div className="w-44">
          <StyledSelect
            value={eventType || ''}
            onChange={(val) => onFilterChange({ eventType: val || null })}
            options={eventTypeOptions}
            placeholder="Type"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-sm font-medium text-red-600 
              hover:bg-red-50 transition-colors
            "
          >
            <X size={14} />
            Clear Filters
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${
              isAnnouncementsFilter ? 'bg-indigo-500' : 'bg-[#000060]'
            }`} />
            <span>Filters active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationFilters;