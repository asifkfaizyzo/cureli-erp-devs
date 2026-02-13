// src/pages/Communications/pages/Broadcast/Email/comps/EmailHistoryList.jsx

import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Ban,
  Loader2,
  Mail,
  Users,
  RefreshCw,
  Eye,
  ChevronDown,
} from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";
import Pagination from "../../../../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

function EmailHistoryList({ refreshTrigger, onRetry }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadCampaigns();
  }, [refreshTrigger, page, rowsPerPage, search]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBroadcastAPI.getHistory(page, rowsPerPage, search);
      if (response.data.success) {
        const { history, pagination } = response.data.data;
        setCampaigns(history);
        setTotalPages(pagination.total_pages);
        setTotalItems(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (campaignId) => {
    if (!window.confirm("Retry sending this campaign?")) return;

    setRetryingId(campaignId);
    try {
      await emailBroadcastAPI.retryCampaign(campaignId);
      loadCampaigns();
      onRetry?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to retry campaign");
    } finally {
      setRetryingId(null);
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

  const getStatusConfig = (status) => {
    const configs = {
      sent: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircle,
        label: "Sent",
      },
      partial_failure: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: AlertTriangle,
        label: "Partial",
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: XCircle,
        label: "Failed",
      },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-600",
        icon: Ban,
        label: "Cancelled",
      },
    };
    return configs[status] || configs.sent;
  };

  const canRetry = (status) => {
    return ["failed", "partial_failure"].includes(status);
  };

  const { styles } = TABLE_CONFIG;

  if (loading && campaigns.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container.wrapper}>
      {/* Search Bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search by subject or sender..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
        />
      </div>

      {campaigns.length === 0 ? (
        <div className={styles.emptyState.container}>
          <div className={styles.emptyState.iconWrapper}>
            <Mail size={48} className={styles.emptyState.icon} />
          </div>
          <p className={styles.emptyState.title}>No email history</p>
          <p className={styles.emptyState.subtitle}>
            Sent campaigns will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: "1000px" }}>
              <thead className="sticky top-0 z-10">
                <tr className={styles.header.row}>
                  <th className={styles.header.cell} style={{ width: "30px" }}></th>
                  <th className={styles.header.cell}>Subject</th>
                  <th className={`${styles.header.cell} text-center`}>Status</th>
                  <th className={`${styles.header.cell} text-center`}>Delivered</th>
                  <th className={`${styles.header.cell} text-center`}>Failed</th>
                  <th className={`${styles.header.cell} text-center`}>Rate</th>
                  <th className={styles.header.cell}>Sent At</th>
                  <th className={styles.header.cell}>Sent By</th>
                  <th className={`${styles.header.cell} text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, index) => {
                  const statusConfig = getStatusConfig(campaign.status);
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedId === campaign.campaign_id;

                  return (
                    <>
                      <tr
                        key={campaign.campaign_id}
                        className={`
                          ${styles.row.base}
                          ${index % 2 === 0 ? styles.row.even : styles.row.odd}
                          ${styles.row.hover}
                          ${isExpanded ? "bg-gray-50" : ""}
                        `}
                        style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
                      >
                        <td className={styles.cell.base}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : campaign.campaign_id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <ChevronDown
                              size={14}
                              className={`text-gray-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>

                        <td className={styles.cell.base}>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={`${styles.cell.primary} line-clamp-1`}>
                              {campaign.subject}
                            </span>
                          </div>
                        </td>

                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <span className="text-green-600 font-medium">
                            {campaign.delivered_count || 0}
                          </span>
                        </td>

                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <span className={campaign.failed_count > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                            {campaign.failed_count || 0}
                          </span>
                        </td>

                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  campaign.delivery_rate >= 90
                                    ? "bg-green-500"
                                    : campaign.delivery_rate >= 70
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${campaign.delivery_rate || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium">
                              {campaign.delivery_rate || 0}%
                            </span>
                          </div>
                        </td>

                        <td className={styles.cell.base}>
                          <span className={styles.cell.muted}>
                            {formatDateTime(campaign.sent_at)}
                          </span>
                        </td>

                        <td className={styles.cell.base}>
                          <span className={styles.cell.primary}>{campaign.cadmin_name}</span>
                        </td>

                        <td className={styles.cell.base}>
                          <div className={styles.actions.container}>
                            {canRetry(campaign.status) && (
                              <button
                                onClick={() => handleRetry(campaign.campaign_id)}
                                disabled={retryingId === campaign.campaign_id}
                                className={`${styles.actions.button.base} text-amber-600 hover:bg-amber-50`}
                                title="Retry Campaign"
                              >
                                {retryingId === campaign.campaign_id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  Message Preview
                                </h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                                  {campaign.message_text || "No message"}
                                </p>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase">
                                    Target Audience
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {campaign.target_users && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        Shop Owners
                                      </span>
                                    )}
                                    {campaign.target_cadmins && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                        CAdmins
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {campaign.last_error && (
                                  <div>
                                    <span className="text-xs font-semibold text-red-500 uppercase">
                                      Last Error
                                    </span>
                                    <p className="text-xs text-red-600 mt-1">
                                      {campaign.last_error}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            setCurrentPage={setPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </>
      )}
    </div>
  );
}

export default EmailHistoryList;