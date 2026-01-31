// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/DraftsList.jsx
import { useState, useEffect } from "react";
import { Edit2, Trash2, FileText, Loader2 } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from '../../../../../../components/common/Pagination';
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";

function DraftsList({ refreshTrigger, onCountChange, onEdit }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const rowsPerPage = 10;

  useEffect(() => {
    loadDrafts();
  }, [refreshTrigger, page]);

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await broadcastAPI.getDrafts(page, rowsPerPage);
      if (response.data.success) {
        const { drafts: draftData, pagination } = response.data.data;
        setDrafts(draftData);
        setTotalPages(pagination.total_pages);
        setTotalItems(pagination.total);
        onCountChange?.(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;

    try {
      await broadcastAPI.deleteDraft(draftId);
      loadDrafts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete draft");
    }
  };

  const formatDate = (dateString) => {
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
        <p className="text-sm text-gray-500">Loading drafts...</p>
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

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
        <FileText size={48} className="text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-500 mb-1">No drafts yet</p>
        <p className="text-sm text-gray-400">Saved drafts will appear here</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Saved Drafts</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalItems} total draft{totalItems !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "900px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th className="p-3 font-semibold text-sm">Title</th>
              <th className="p-3 font-semibold text-sm">Message Preview</th>
              <th className="p-3 font-semibold text-sm text-center">
                Recipients
              </th>
              <th className="p-3 font-semibold text-sm text-center">
                Priority
              </th>
              <th className="p-3 font-semibold text-sm">Last Updated</th>
              <th className="p-3 font-semibold text-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft, index) => (
              <tr
                key={draft.campaign_id}
                className={`border-b border-gray-100 transition-all duration-150 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-indigo-50`}
              >
                <td className="px-3 py-3">
                  <span className="font-medium text-gray-900 line-clamp-2">
                    {draft.title}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {draft.message.substring(0, 80)}
                    {draft.message.length > 80 && "..."}
                  </p>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {draft.recipient_count || "N/A"}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(
                      draft.priority,
                    )}`}
                  >
                    {draft.priority}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-gray-600">
                    {formatDate(draft.updated_at)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(draft)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(draft.campaign_id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
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

export default DraftsList;
