// src/pages/Subscription-management/comps/risk/GracePeriodTable.jsx

import { useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../config/tableConfig";
import {
  GRACE_PERIOD_COLUMNS,
  formatDate,
  formatDaysLeft,
  getDaysLeftStyle,
  getPaymentStatusBadge,
} from "../../../../config/modules/subscriptionRiskConfig";
import SubscriptionActionsMenu from "./SubscriptionActionsMenu";

export default function GracePeriodTable({
  data = [],
  loading = false,
  emptyTitle,
  emptySubtitle,
  onViewDetails,
  onNavigateToShop,
  onActionComplete,
}) {
  const { styles } = TABLE_CONFIG;

  const [openMenuId, setOpenMenuId] = useState(null);

  const hasData = data.length > 0;
  const showTable = loading || hasData;
  const showEmpty = !loading && !hasData;

  const handleRowClick = (subscription) => {
    onViewDetails?.(subscription);
  };

  return (
    <div className="h-full flex flex-col">
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "700px" }}>
            {/* Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                {GRACE_PERIOD_COLUMNS.map((col) => (
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
                  columns={GRACE_PERIOD_COLUMNS.map((c) => c.key).filter(
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
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                            <span className="font-medium truncate max-w-[140px]">
                              {subscription.shop_name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 truncate pl-5">
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

                      {/* Grace Ends */}
                      <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                        {formatDate(subscription.grace_period_until)}
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
                          category="gracePeriod"
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
          icon={AlertTriangle}
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
      )}
    </div>
  );
}