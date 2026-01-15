// src/config/tableConfig.js
// Global table design system configuration
// All tables across the application should use these values for consistency

export const TABLE_CONFIG = {
  // ============================================
  // HEIGHT MEASUREMENTS (in pixels)
  // ============================================
  heights: {
    headerRow: 48,
    bodyRow: 56,
    pagination: 48,
  },

  // ============================================
  // DYNAMIC ROW COUNT BREAKPOINTS
  // Based on window.innerHeight (screen height)
  // Format: { minHeight: rowCount }
  // ============================================
  rowBreakpoints: {
    1440: 12,  // 1440p+ / 27" monitors / 4K (very tall screens)
    1080: 9,   // 1080p Full HD (typical desktop)
    900: 7,    // 900p / smaller monitors
    800: 6,    // Tablets / small laptops
    0: 5,      // Mobile / fallback (minimum)
  },

  // ============================================
  // STYLE CLASSES
  // ============================================
  styles: {
    // Table container
    container: {
      wrapper: 'h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden',
    },

    // Header row
    header: {
      row: 'bg-gradient-to-r from-[#000060] to-[#0a0280] text-white text-left',
      cell: 'p-3 font-semibold text-sm',
      sortIcon: {
        active: 'text-yellow-300',
        inactive: 'text-white/50',
      },
      resizeHandle: 'absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30 transition-colors',
    },

    // Body rows
    row: {
      base: 'border-b border-gray-100 transition-all duration-150',
      even: 'bg-gray-50/50',
      odd: 'bg-white',
      hover: 'hover:bg-indigo-50/50',
      clickable: 'cursor-pointer',
      disabled: 'opacity-60',
    },

    // Cell styles
    cell: {
      base: 'px-3 py-2',
      primary: 'font-medium text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500 text-sm',
      center: 'text-center',
    },

    // Pagination area
    pagination: {
      wrapper: 'flex-shrink-0 border-t border-gray-100 bg-gray-50/50',
    },

    // Action buttons in table
    actions: {
      container: 'flex items-center justify-center gap-1',
      button: {
        base: 'p-1.5 rounded-lg transition-all',
        view: 'text-gray-500 hover:text-[#000060] hover:bg-indigo-50',
        edit: 'text-gray-500 hover:text-amber-600 hover:bg-amber-50',
        suspend: 'text-gray-500 hover:text-orange-600 hover:bg-orange-50',
        activate: 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50',
        delete: 'text-gray-500 hover:text-red-600 hover:bg-red-50',
      },
    },

    // Badge styles
    badges: {
      status: {
        active: 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 min-w-[70px]',
        inactive: 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 min-w-[70px]',
        suspended: 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 min-w-[70px]',
        pending: 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 min-w-[70px]',
      },

      role: {
        superAdmin: 'bg-amber-100 text-amber-700 border border-amber-200',
        branchAdmin: 'bg-purple-100 text-purple-700 border border-purple-200',
        staff: 'bg-slate-100 text-slate-700 border border-slate-200',
        default: 'bg-gray-100 text-gray-700 border border-gray-200',
      },
      roleBase: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
    },

    // Skeleton loading
    skeleton: {
      row: 'animate-pulse',
      cell: 'h-4 bg-gray-200 rounded',
    },

    // Empty state
    emptyState: {
      container: 'flex-1 flex flex-col items-center justify-center py-12',
      iconWrapper: 'w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4',
      icon: 'text-gray-300',
      title: 'text-lg font-medium text-gray-500 mb-1',
      subtitle: 'text-sm text-gray-400',
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get role badge style based on role name
 */
export const getRoleBadgeStyle = (role) => {
  const { badges } = TABLE_CONFIG.styles;
  const roleKey = role?.toLowerCase().replace(/[_\s]+/g, '');
  
  const roleMap = {
    'superadmin': badges.role.superAdmin,
    'branchadmin': badges.role.branchAdmin,
    'staff': badges.role.staff,
  };

  return `${badges.roleBase} ${roleMap[roleKey] || badges.role.default}`;
};

/**
 * Get status badge style based on status
 */
export const getStatusBadgeStyle = (status) => {
  const { badges } = TABLE_CONFIG.styles;
  const statusKey = typeof status === 'boolean' 
    ? (status ? 'active' : 'inactive')
    : status?.toLowerCase();
  
  return badges.status[statusKey] || badges.status.inactive;
};

/**
 * Get row background class based on index
 */
export const getRowBgClass = (index, isDisabled = false) => {
  const { row } = TABLE_CONFIG.styles;
  const bgClass = index % 2 === 0 ? row.even : row.odd;
  const disabledClass = isDisabled ? row.disabled : '';
  return `${row.base} ${bgClass} ${row.hover} ${disabledClass}`;
};

/**
 * Combine row classes for clickable rows
 */
export const getClickableRowClass = (index, isDisabled = false) => {
  const { row } = TABLE_CONFIG.styles;
  return `${getRowBgClass(index, isDisabled)} ${row.clickable}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default TABLE_CONFIG;