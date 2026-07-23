// src/features/orders/constants/prescriptionRequest.constants.ts
//
// Status display configuration for PrescriptionRequest records shown in
// the Orders screen Prescriptions tab.
//
// colorKey maps to colors.status.* tokens.
// 'default' = faint text / tint background (no status.* token needed).

export type PrxColorKey = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface PrxStatusConfig {
  label:    string;
  colorKey: PrxColorKey;
  icon:     string;
}

export const PRX_STATUS_CONFIG: Record<string, PrxStatusConfig> = {
  PENDING: {
    label:    'Awaiting Responses',
    colorKey: 'info',
    icon:     'time-outline',
  },
  PARTIALLY_RESPONDED: {
    label:    'Quotes Arriving',
    colorKey: 'warning',
    icon:     'chatbubble-outline',
  },
  FULLY_RESPONDED: {
    // Label and color are overridden in PrescriptionRequestCard at render
    // time based on quoted_count. This entry is the fallback only.
    label:    'All Responded',
    colorKey: 'warning',
    icon:     'checkmark-circle-outline',
  },
  ACCEPTED: {
    label:    'Quote Accepted',
    colorKey: 'success',
    icon:     'checkmark-done-outline',
  },
  COMPLETED: {
    label:    'Order Placed',
    colorKey: 'success',
    icon:     'bag-check-outline',
  },
  CANCELLED: {
    label:    'Cancelled',
    colorKey: 'error',
    icon:     'close-circle-outline',
  },
  EXPIRED: {
    label:    'Expired',
    colorKey: 'default',
    icon:     'hourglass-outline',
  },
};

// Active statuses used in OrdersScreen to decide whether to show the
// prescription badge dot on the Orders tab AND count the inner tab bubble.
//
// FULLY_RESPONDED is intentionally NOT in this set anymore.
// FULLY_RESPONDED has two sub-states that require quoted_count to distinguish:
//   quoted_count > 0  → pharmacies sent quotes → still needs action → active
//   quoted_count === 0 → all pharmacies declined → nothing to do   → NOT active
//
// The count logic in OrdersScreen handles FULLY_RESPONDED separately
// using isActivePrescription() which checks both status AND quoted_count.
export const PRX_ACTIVE_STATUSES = new Set([
  'PENDING',
  'PARTIALLY_RESPONDED',
]);

// Active order statuses — used to decide the red badge dot.
export const ORDER_ACTIVE_STATUSES = new Set([
  'PLACED',
  'ACCEPTED',
  'READY_FOR_PICKUP',
]);