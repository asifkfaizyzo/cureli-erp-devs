// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/HistoryList.jsx
import { useState, useEffect } from "react";
import { History, CheckCircle, Loader2 } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from '../../../../../../components/common/Pagination';
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

function HistoryList({ refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ✅ Dynamic row count
  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger, page, rowsPerPage]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await broadcastAPI.getHistory(page, rowsPerPage);
      if (response.data.success) {
        const { history: historyData, pagination } = response.data.data;
        setHistory(historyData);
        setTotalPages(pagination.total_pages);
        setTotalItems(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "N/A";
    }
  };

  const getReadRateClass = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 70)
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (numRate >= 40) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getPriorityBadgeClass = (priority) => {
    const map = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      normal: "bg-blue-100 text-blue-700 border-blue-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return map[priority] || map.normal;
  };

  const { styles } = TABLE_CONFIG;

  if (loading) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading broadcast history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <div className={styles.emptyState.iconWrapper}>
          <History size={48} className={styles.emptyState.icon} />
        </div>
        <p className={styles.emptyState.title}>No sent broadcasts yet</p>
        <p className={styles.emptyState.subtitle}>
          Sent broadcasts will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container.wrapper}>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "1100px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Title</th>
              <th className={styles.header.cell}>Message Preview</th>
              <th className={`${styles.header.cell} text-center`}>Recipients</th>
              <th className={`${styles.header.cell} text-center`}>Delivered</th>
              <th className={`${styles.header.cell} text-center`}>Read</th>
              <th className={`${styles.header.cell} text-center`}>Read Rate</th>
              <th className={styles.header.cell}>Sent At</th>
              <th className={styles.header.cell}>Sent By</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr
                key={item.campaign_id}
                className={`
                  ${styles.row.base}
                  ${index % 2 === 0 ? styles.row.even : styles.row.odd}
                  ${styles.row.hover}
                `}
                style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
              >
                {/* Title + Priority */}
                <td className={styles.cell.base}>
                  <div className="flex items-start gap-2">
                    <span className={`${styles.cell.primary} line-clamp-2 flex-1`}>
                      {item.title}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getPriorityBadgeClass(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </td>

                {/* Message Preview */}
                <td className={styles.cell.base}>
                  <p className={`${styles.cell.secondary} line-clamp-2`}>
                    {item.message.substring(0, 70)}
                    {item.message.length > 70 && "..."}
                  </p>
                </td>

                {/* Recipients */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>
                    {item.recipient_count || 0}
                  </span>
                </td>

                {/* Delivered */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">
                      {item.delivered_count || 0}
                    </span>
                  </div>
                </td>

                {/* Read */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>
                    {item.read_count || 0}
                  </span>
                </td>

                {/* Read Rate */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getReadRateClass(
                      item.read_rate,
                    )}`}
                  >
                    {item.read_rate}%
                  </span>
                </td>

                {/* Sent At */}
                <td className={styles.cell.base}>
                  <span className={styles.cell.muted}>
                    {formatDateTime(item.sent_at)}
                  </span>
                </td>

                {/* Sent By */}
                <td className={styles.cell.base}>
                  <span className={styles.cell.primary}>{item.cadmin_name}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        setCurrentPage={setPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
}

export default HistoryList;