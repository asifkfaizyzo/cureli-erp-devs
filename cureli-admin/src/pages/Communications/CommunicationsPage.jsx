// src/pages/Communications/CommunicationsPage.jsx

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { getEnquiryStats } from "../../api/cadminEnquiries";
import { getAllTickets } from "../../api/cadminTickets";
import { useNavigate } from "react-router-dom";
import { useMenuStore } from "../../store/useMenuStore";
import { useToast } from "../../components/common/Toast";

// ============================================
// STAT ITEM COMPONENT
// ============================================
const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  </div>
);

// ============================================
// COMMUNICATION CARD COMPONENT
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
        ${isComingSoon 
          ? "opacity-60 cursor-not-allowed" 
          : "cursor-pointer hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {isComingSoon && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-md uppercase">
            Coming Soon
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{description}</p>

      {/* Stats */}
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

      {/* Action */}
      {!isComingSoon && (
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-[#05015A]">View all</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#05015A]" />
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
  const [ticketStats, setTicketStats] = useState(null);
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  // Fetch ticket stats - get pending count
  const fetchTicketStats = useCallback(async () => {
    try {
      setLoadingTickets(true);
      
      // Fetch total count
      const totalResponse = await getAllTickets({ page: 1, limit: 1 });
      const total = totalResponse?.data?.data?.pagination?.total || 0;
      
      // Fetch pending count
      const pendingResponse = await getAllTickets({ page: 1, limit: 1, status: "PENDING" });
      const pending = pendingResponse?.data?.data?.pagination?.total || 0;

      setTicketStats({ total, pending });
    } catch (error) {
      console.error("Failed to fetch ticket stats:", error);
      setTicketStats({ total: 0, pending: 0 });
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Fetch enquiry stats
  const fetchEnquiryStats = useCallback(async () => {
    try {
      setLoadingEnquiries(true);
      const response = await getEnquiryStats();

      let statsData = null;
      if (response?.data?.data?.stats) {
        statsData = response.data.data.stats;
      } else if (response?.data?.stats) {
        statsData = response.data.stats;
      } else if (response?.stats) {
        statsData = response.stats;
      } else if (response?.data?.data) {
        statsData = response.data.data;
      } else if (response?.data) {
        statsData = response.data;
      }

      setEnquiryStats(statsData);
    } catch (error) {
      console.error("Failed to fetch enquiry stats:", error);
      setEnquiryStats(null);
    } finally {
      setLoadingEnquiries(false);
    }
  }, []);

  // Initial load - no toast, runs once on mount
  useEffect(() => {
    fetchTicketStats();
    fetchEnquiryStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual refresh handler - with toast
  const handleRefresh = useCallback(() => {
    toast.info("Refreshing", "Loading latest data...");
    fetchTicketStats();
    fetchEnquiryStats();
  }, [toast, fetchTicketStats, fetchEnquiryStats]);

  // Calculate totals
  const totalTickets = ticketStats?.total || 0;
  const pendingTickets = ticketStats?.pending || 0;
  const totalEnquiries = enquiryStats?.total || enquiryStats?.totalEnquiries || 0;
  const pendingEnquiries = enquiryStats?.pending || enquiryStats?.pendingEnquiries || 0;

  // Communication channels
  const channels = [
    {
      id: "tickets",
      title: "Support Tickets",
      description: "Manage customer support requests and track resolution progress",
      icon: Ticket,
      path: "/communications/tickets",
      breadcrumbs: ["Communications", "Tickets"],
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      isLoading: loadingTickets,
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
      description: "Handle general inquiries and respond to customer questions and doubts",
      icon: Mail,
      path: "/communications/enquiries",
      breadcrumbs: ["Communications", "Enquiries"],
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      isLoading: loadingEnquiries,
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
      isComingSoon: true,
      stats: null,
    },
  ];

  return (
    <div className="space-y-5 font-poppins">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#05015A] rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Communications</h1>
            <p className="text-xs text-gray-500">Manage customer interactions</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loadingTickets || loadingEnquiries}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 
                     transition-colors disabled:opacity-50"
        >
          <RefreshCw 
            size={16} 
            className={loadingTickets || loadingEnquiries ? "animate-spin" : ""} 
          />
        </button>
      </div>

      {/* Summary Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-blue-600 rounded-full" />
            <p className="text-sm font-medium text-gray-700">Quick Overview</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Tickets */}
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

            <div className="w-px h-10 bg-gray-200" />

            {/* Enquiries */}
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

            <div className="w-px h-10 bg-gray-200" />

            {/* Pending */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {loadingTickets || loadingEnquiries 
                    ? "..." 
                    : pendingTickets + pendingEnquiries
                  }
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              {/* Optional: Pending badge indicator */}
              {!loadingTickets && !loadingEnquiries && (pendingTickets + pendingEnquiries) > 0 && (
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
  );
};

export default CommunicationsPage;