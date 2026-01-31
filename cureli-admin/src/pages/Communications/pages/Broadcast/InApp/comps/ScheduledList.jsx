// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/ScheduledList.jsx
import { useState, useEffect } from "react";
import { Calendar, X, Loader2, Clock } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from '../../../../../../components/common/Pagination';

function ScheduledList({ refreshTrigger, onCountChange }) {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const rowsPerPage = 10;

  useEffect(() => {
    loadScheduled();
  }, [refreshTrigger, page]);

  const loadScheduled = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await broadcastAPI.getScheduled(page, rowsPerPage);
      if (response.data.success) {
        const { scheduled: scheduledData, pagination } = response.data.data;
        setScheduled(scheduledData);
        setTotalPages(pagination.total_pages);
        setTotalItems(pagination.total);
        onCountChange?.(pagination.total);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load scheduled broadcasts",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (campaignId, title) => {
    if (!window.confirm(`Cancel scheduled broadcast "${title}"?`)) return;

    try {
      await broadcastAPI.cancelScheduled(campaignId);
      loadScheduled();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel broadcast");
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

  const getTimeUntil = (dateString) => {
    const scheduledTime = new Date(dateString);
    const now = new Date();
    const diffMs = scheduledTime - now;

    if (diffMs < 0) return "Sending soon...";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    if (hours < 24)
      return `in ${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} min`;

    const days = Math.floor(hours / 24);
    return `in ${days} day${days !== 1 ? "s" : ""}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading scheduled broadcasts...</p>
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

  if (scheduled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
        <Calendar size={48} className="text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-500 mb-1">
          No scheduled broadcasts
        </p>
        <p className="text-sm text-gray-400">
          Schedule a broadcast to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Scheduled Broadcasts
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalItems} scheduled broadcast{totalItems !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "1000px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th className="p-3 font-semibold text-sm">Title</th>
              <th className="p-3 font-semibold text-sm">Message Preview</th>
              <th className="p-3 font-semibold text-sm text-center">
                Recipients
              </th>
              <th className="p-3 font-semibold text-sm">Scheduled For</th>
              <th className="p-3 font-semibold text-sm text-center">
                Time Until
              </th>
              <th className="p-3 font-semibold text-sm">Created By</th>
              <th className="p-3 font-semibold text-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scheduled.map((item, index) => (
              <tr
                key={item.campaign_id}
                className={`border-b border-gray-100 transition-all duration-150 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-indigo-50`}
              >
                <td className="px-3 py-3">
                  <span className="font-medium text-gray-900 line-clamp-2">
                    {item.title}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.message.substring(0, 60)}
                    {item.message.length > 60 && "..."}
                  </p>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {item.recipient_count || "N/A"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formatDateTime(item.scheduled_for)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    <Clock size={12} />
                    {getTimeUntil(item.scheduled_for)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    {item.cadmin_name}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleCancel(item.campaign_id, item.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-200 transition-all"
                      title="Cancel"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
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

export default ScheduledList;
