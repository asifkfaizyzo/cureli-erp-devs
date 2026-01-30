// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/HistoryList.jsx
import { useState, useEffect } from "react";
import { History, CheckCircle, Loader2 } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from '../../../../../../components/common/Pagination';

function HistoryList({ refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const rowsPerPage = 20;

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger, page]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
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
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
        <History size={48} className="text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-500 mb-1">
          No sent broadcasts yet
        </p>
        <p className="text-sm text-gray-400">
          Sent broadcasts will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Broadcast History
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalItems} total broadcast{totalItems !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "1100px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th className="p-3 font-semibold text-sm">Title</th>
              <th className="p-3 font-semibold text-sm">Message Preview</th>
              <th className="p-3 font-semibold text-sm text-center">
                Recipients
              </th>
              <th className="p-3 font-semibold text-sm text-center">
                Delivered
              </th>
              <th className="p-3 font-semibold text-sm text-center">Read</th>
              <th className="p-3 font-semibold text-sm text-center">
                Read Rate
              </th>
              <th className="p-3 font-semibold text-sm">Sent At</th>
              <th className="p-3 font-semibold text-sm">Sent By</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr
                key={item.campaign_id}
                className={`border-b border-gray-100 transition-all duration-150 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-indigo-50`}
              >
                <td className="px-3 py-3">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-900 line-clamp-2 flex-1">
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
                <td className="px-3 py-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.message.substring(0, 70)}
                    {item.message.length > 70 && "..."}
                  </p>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {item.recipient_count || 0}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">
                      {item.delivered_count || 0}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {item.read_count || 0}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getReadRateClass(
                      item.read_rate,
                    )}`}
                  >
                    {item.read_rate}%
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-gray-600">
                    {formatDateTime(item.sent_at)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    {item.cadmin_name}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50">
          <Pagination
            currentPage={page}
            setCurrentPage={setPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </div>
      )}
    </div>
  );
}

export default HistoryList;
