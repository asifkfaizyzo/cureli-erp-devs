// src/pages/Subscription-management/comps/risk/SuspendedTable.jsx

import { useState } from "react";
import { Ban } from "lucide-react";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../config/tableConfig";
import {
  SUSPENDED_COLUMNS,
  formatDate,
} from "../../../../config/modules/subscriptionRiskConfig";
import SubscriptionActionsMenu from "./SubscriptionActionsMenu";

export default function SuspendedTable({
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
          <table className="w-full border-collapse text-sm" style={{ minWidth: "650px" }}>
            {/* Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                {SUSPENDED_COLUMNS.map((col) => (
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
                  columns={SUSPENDED_COLUMNS.map((c) => c.key).filter(
                    (k) => k !== "slNo" && k !== "actions"
                  )}
                />
              ) : (
                data.map((subscription, index) => (
                  <tr
                    key={subscription.subscription_id}
                    onClick={() => handleRowClick(subscription)}
                    className={getClickableRowClass(index, true)} // Always show as inactive
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
                          <Ban size={14} className="text-red-500 flex-shrink-0" />
                          <span className="font-medium truncate max-w-[140px] text-gray-500">
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

                    {/* Suspended On */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                      {formatDate(subscription.updated_at)}
                    </td>

                    {/* Owner */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                      <div className="flex flex-col">
                        <span className="truncate max-w-[120px]">
                          {subscription.owner_name || "N/A"}
                        </span>
                        <span className="text-xs text-gray-400 truncate max-w-[120px]">
                          {subscription.owner_email || ""}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className={`${styles.cell.base}`} onClick={(e) => e.stopPropagation()}>
                      <SubscriptionActionsMenu
                        subscription={subscription}
                        category="suspended"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmpty && (
        <TableEmptyState
          icon={Ban}
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
      )}
    </div>
  );
}