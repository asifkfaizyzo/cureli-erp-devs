// src/pages/Subscription-management/comps/risk/ExpiringTable.jsx

import { useState } from "react";
import {
  Eye,
  Send,
  Ban,
  ExternalLink,
  MoreVertical,
  Clock,
} from "lucide-react";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../config/tableConfig";
import {
  EXPIRING_COLUMNS,
  formatDate,
  formatDaysLeft,
  getDaysLeftStyle,
  getPaymentStatusBadge,
} from "../../../../config/modules/subscriptionRiskConfig";
import SubscriptionActionsMenu from "./SubscriptionActionsMenu";

export default function ExpiringTable({
  data = [],
  loading = false,
  emptyTitle,
  emptySubtitle,
  onViewDetails,
  onNavigateToShop,
  onActionComplete,
}) {
  const { styles } = TABLE_CONFIG;

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  const hasData = data.length > 0;
  const showTable = loading || hasData;
  const showEmpty = !loading && !hasData;

  // ============================================
  // ROW CLICK HANDLER
  // ============================================
  const handleRowClick = (subscription) => {
    onViewDetails?.(subscription);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-full flex flex-col">
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "700px" }}>
            {/* Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                {EXPIRING_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.width }}
                    className={`${styles.header.cell} ${
                      col.key === "actions" ? "text-center" : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={8}
                  columns={EXPIRING_COLUMNS.map((c) => c.key).filter(
                    (k) => k !== "slNo" && k !== "actions"
                  )}
                />
              ) : (
                data.map((subscription, index) => {
                  const paymentBadge = getPaymentStatusBadge(subscription.payment_status);
                  const daysStyle = getDaysLeftStyle(subscription.days_left);

                  return (
                    <tr
                      key={subscription.subscription_id}
                      onClick={() => handleRowClick(subscription)}
                      className={getClickableRowClass(index, subscription.is_critical)}
                      style={{ height: "56px" }}
                    >
                      {/* # */}
                      <td className={`${styles.cell.base} ${styles.cell.muted}`}>
                        {index + 1}
                      </td>

                      {/* Shop Name */}
                      <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[160px]">
                            {subscription.shop_name}
                          </span>
                          <span className="text-xs text-gray-400 truncate">
                            {subscription.shop_city}, {subscription.shop_state}
                          </span>
                        </div>
                      </td>

                      {/* Plan Name */}
                      <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                        <span className="truncate max-w-[100px] block">
                          {subscription.plan_name}
                        </span>
                      </td>

                      {/* Expires On */}
                      <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                        {formatDate(subscription.end_date)}
                      </td>

                      {/* Days Left */}
                      <td className={`${styles.cell.base}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${daysStyle}`}
                        >
                          {subscription.is_critical && <Clock size={12} />}
                          {formatDaysLeft(subscription.days_left)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${paymentBadge.className}`}
                        >
                          {paymentBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={`${styles.cell.base}`} onClick={(e) => e.stopPropagation()}>
                        <SubscriptionActionsMenu
                          subscription={subscription}
                          category="expiring"
                          isOpen={openMenuId === subscription.subscription_id}
                          onToggle={() =>
                            setOpenMenuId(
                              openMenuId === subscription.subscription_id
                                ? null
                                : subscription.subscription_id
                            )
                          }
                          onClose={() => setOpenMenuId(null)}
                          onViewDetails={() => onViewDetails?.(subscription)}
                          onNavigateToShop={() => onNavigateToShop?.(subscription.shop_id)}
                          onActionComplete={onActionComplete}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmpty && (
        <TableEmptyState
          icon={Clock}
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
      )}
    </div>
  );
}