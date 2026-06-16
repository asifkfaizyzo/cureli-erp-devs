// src/pages/Communications/CommunicationsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Ticket,
  Mail,
  Radio,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
  Smartphone, // ✅ ADD THIS
} from "lucide-react";
import { getEnquiryStats } from "../../api/cadminEnquiries";
import { getAllTickets } from "../../api/cadminTickets";
import { useNavigate } from "react-router-dom";
import { useMenuStore } from "../../store/useMenuStore";
import { useToast } from "../../components/common/Toast";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions";

// ============================================
// BROADCAST PERMISSIONS — any of these = show card
// ============================================
const BROADCAST_ANY_PERMISSIONS = [
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_UPLOAD,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES,
  // ✅ ADD THESE
  CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
  CADMIN_PERMISSIONS.BROADCAST_MOBILE_VIEW_HISTORY,
  CADMIN_PERMISSIONS.BROADCAST_MOBILE_MANAGE_DRAFTS,
  CADMIN_PERMISSIONS.BROADCAST_MOBILE_SCHEDULE,
];

// ============================================
// STAT ITEM COMPONENT (unchanged)
// ============================================
const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </p>
    </div>
  </div>
);

// ============================================
// COMMUNICATION CARD COMPONENT (unchanged)
// ============================================
const CommunicationCard = ({
  title,
  description,
  icon: Icon,
  path,
  breadcrumbs,
  iconBg,
  iconColor,
  stats,
  isLoading,
  isComingSoon,
}) => {
  const navigate = useNavigate();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const handleClick = () => {
    if (isComingSoon) return;
    setBreadcrumbs(breadcrumbs);
    navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-xl border border-gray-200 p-5
        transition-all duration-200
        ${
          isComingSoon
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {isComingSoon && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-md uppercase">
            Coming Soon
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{description}</p>

      <div className="min-h-[44px]">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : stats && stats.length > 0 ? (
          <div className="flex items-center gap-6">
            {stats.map((stat, index) => (
              <StatItem
                key={index}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
              />
            ))}
          </div>
        ) : null}
      </div>

      {!isComingSoon && (
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-[#000060]">View all</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#000060]" />
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const CommunicationsPage = () => {
  const toast = useToast();
  const { hasPermission, hasAnyPermission } = useCAdminPermission();

  const [ticketStats, setTicketStats] = useState(null);
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  const fetchTicketStats = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const totalResponse = await getAllTickets({ page: 1, limit: 1 });
      const total = totalResponse?.data?.data?.pagination?.total || 0;
      const pendingResponse = await getAllTickets({
        page: 1,
        limit: 1,
        status: "PENDING",
      });
      const pending = pendingResponse?.data?.data?.pagination?.total || 0;
      setTicketStats({ total, pending });
    } catch (error) {
      console.error("Failed to fetch ticket stats:", error);
      setTicketStats({ total: 0, pending: 0 });
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const fetchEnquiryStats = useCallback(async () => {
    try {
      setLoadingEnquiries(true);
      const response = await getEnquiryStats();
      let statsData = null;
      if (response?.data?.data?.stats) statsData = response.data.data.stats;
      else if (response?.data?.stats) statsData = response.data.stats;
      else if (response?.stats) statsData = response.stats;
      else if (response?.data?.data) statsData = response.data.data;
      else if (response?.data) statsData = response.data;
      setEnquiryStats(statsData);
    } catch (error) {
      console.error("Failed to fetch enquiry stats:", error);
      setEnquiryStats(null);
    } finally {
      setLoadingEnquiries(false);
    }
  }, []);

  useEffect(() => {
    fetchTicketStats();
    fetchEnquiryStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest data...");
    fetchTicketStats();
    fetchEnquiryStats();
  }, [toast, fetchTicketStats, fetchEnquiryStats]);

  const totalTickets = ticketStats?.total || 0;
  const pendingTickets = ticketStats?.pending || 0;
  const totalEnquiries =
    enquiryStats?.total || enquiryStats?.totalEnquiries || 0;
  const pendingEnquiries =
    enquiryStats?.pending || enquiryStats?.pendingEnquiries || 0;

  const channels = useMemo(() => {
    const allChannels = [
      {
        id: "tickets",
        title: "Support Tickets",
        description:
          "Manage customer support requests and track resolution progress",
        icon: Ticket,
        path: "/communications/tickets",
        breadcrumbs: ["Communications", "Tickets"],
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        isLoading: loadingTickets,
        visible: hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
        stats: ticketStats
          ? [
              {
                icon: TrendingUp,
                label: "Total",
                value: totalTickets,
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Clock,
                label: "Pending",
                value: pendingTickets,
                color: "bg-amber-50 text-amber-600",
              },
            ]
          : null,
      },
      {
        id: "enquiries",
        title: "Enquiries",
        description:
          "Handle general inquiries and respond to customer questions and doubts",
        icon: Mail,
        path: "/communications/enquiries",
        breadcrumbs: ["Communications", "Enquiries"],
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        isLoading: loadingEnquiries,
        visible: hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),
        stats: enquiryStats
          ? [
              {
                icon: TrendingUp,
                label: "Total",
                value: totalEnquiries,
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: Clock,
                label: "Pending",
                value: pendingEnquiries,
                color: "bg-amber-50 text-amber-600",
              },
            ]
          : null,
      },
      {
        id: "broadcast",
        title: "Broadcast",
        description: "Send announcements and notifications to users",
        icon: Radio,
        path: "/communications/broadcast",
        breadcrumbs: ["Communications", "Broadcast"],
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        isLoading: false,
        isComingSoon: false,
        visible: hasAnyPermission(...BROADCAST_ANY_PERMISSIONS),
        stats: null,
      },
      // ✅ ADD THIS ENTRY
      {
        id: "broadcast-mobile",
        title: "Mobile Push",
        description: "Send push notifications directly to app users' devices",
        icon: Smartphone,
        path: "/communications/broadcast/mobile",
        breadcrumbs: ["Communications", "Broadcast", "Mobile Push"],
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
        isLoading: false,
        isComingSoon: false,
        visible: hasAnyPermission(
          CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
          CADMIN_PERMISSIONS.BROADCAST_MOBILE_VIEW_HISTORY,
          CADMIN_PERMISSIONS.BROADCAST_MOBILE_MANAGE_DRAFTS,
          CADMIN_PERMISSIONS.BROADCAST_MOBILE_SCHEDULE,
        ),
        stats: null,
      },
    ];

    return allChannels.filter((channel) => channel.visible);
  }, [
    loadingTickets,
    loadingEnquiries,
    ticketStats,
    enquiryStats,
    totalTickets,
    pendingTickets,
    totalEnquiries,
    pendingEnquiries,
    hasPermission,
    hasAnyPermission,
  ]);

  const isLoading = loadingTickets || loadingEnquiries;

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Communications
              </h1>
              <p className="text-sm text-gray-500">
                Manage customer interactions
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4">
        {/* Summary Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-blue-600 rounded-full" />
              <p className="text-sm font-medium text-gray-700">
                Quick Overview
              </p>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingTickets ? "..." : totalTickets}
                  </p>
                  <p className="text-xs text-gray-500">Tickets</p>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingEnquiries ? "..." : totalEnquiries}
                  </p>
                  <p className="text-xs text-gray-500">Enquiries</p>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {isLoading ? "..." : pendingTickets + pendingEnquiries}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                {!isLoading && pendingTickets + pendingEnquiries > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    Action needed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <CommunicationCard
              key={channel.id}
              title={channel.title}
              description={channel.description}
              icon={channel.icon}
              path={channel.path}
              breadcrumbs={channel.breadcrumbs}
              iconBg={channel.iconBg}
              iconColor={channel.iconColor}
              stats={channel.stats}
              isLoading={channel.isLoading}
              isComingSoon={channel.isComingSoon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunicationsPage;