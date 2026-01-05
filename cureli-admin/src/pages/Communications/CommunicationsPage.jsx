// src/pages/Communications/CommunicationsPage.jsx

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Ticket,
  Mail,
  Radio,
  Clock,
  TrendingUp,
  Construction,
} from "lucide-react";
import { getEnquiryStats } from "../../api/cadminEnquiries";
import { getAllTickets } from "../../api/cadminTickets";
import CommunicationCard from "./comps/CommunicationCard";

const CommunicationsPage = () => {
  // Stats state
  const [ticketStats, setTicketStats] = useState(null);
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  // Fetch ticket stats using existing API
  const fetchTicketStats = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const response = await getAllTickets({ page: 1, limit: 1 });
      const pagination = response?.data?.data?.pagination;

      setTicketStats({
        total: pagination?.total || 0,
      });
    } catch (error) {
      console.error("Failed to fetch ticket stats:", error);
      setTicketStats({ total: 0 });
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Fetch enquiry stats using existing API
  const fetchEnquiryStats = useCallback(async () => {
    try {
      setLoadingEnquiries(true);
      const response = await getEnquiryStats();

      // Parse response (handling various response structures)
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

  useEffect(() => {
    fetchTicketStats();
    fetchEnquiryStats();
  }, [fetchTicketStats, fetchEnquiryStats]);

  // Communication channels configuration
  const communicationChannels = [
    {
      id: "tickets",
      title: "Support Tickets",
      description: "Manage customer support requests and track resolution",
      icon: Ticket,
      path: "/communications/tickets",
      breadcrumbs: ["Communications", "Tickets"],
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
      isLoading: loadingTickets,
      stats: ticketStats
        ? [
            {
              icon: TrendingUp,
              value: ticketStats.total || 0,
              label: "Total",
              bgColor: "bg-blue-50",
              iconColor: "text-blue-500",
            },
            {
              icon: Clock,
              value: ticketStats.open || "—",
              label: "Open",
              bgColor: "bg-orange-50",
              iconColor: "text-orange-500",
            },
          ]
        : null,
    },
    {
      id: "enquiries",
      title: "Enquiries",
      description: "Handle general inquiries and customer questions",
      icon: Mail,
      path: "/communications/enquiries",
      breadcrumbs: ["Communications", "Enquiries"],
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-600",
      isLoading: loadingEnquiries,
      stats: enquiryStats
        ? [
            {
              icon: TrendingUp,
              value: enquiryStats.total || enquiryStats.totalEnquiries || 0,
              label: "Total",
              bgColor: "bg-emerald-50",
              iconColor: "text-emerald-500",
            },
            {
              icon: Clock,
              value: enquiryStats.pending || enquiryStats.pendingEnquiries || 0,
              label: "Pending",
              bgColor: "bg-amber-50",
              iconColor: "text-amber-500",
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
      gradientFrom: "from-violet-500",
      gradientTo: "to-violet-600",
      isLoading: false,
      stats: [
        {
          icon: Construction,
          value: "—",
          label: "Coming Soon",
          bgColor: "bg-violet-50",
          iconColor: "text-violet-500",
        },
      ],
    },
  ];

  // Calculate totals for overview
  const totalTickets = ticketStats?.total || 0;
  const totalEnquiries =
    enquiryStats?.total || enquiryStats?.totalEnquiries || 0;

  return (
    <div className="p-6 space-y-6 font-poppins">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 bg-gradient-to-br from-[#05015A] to-[#1a1a8c] rounded-2xl 
                        flex items-center justify-center shadow-lg shadow-indigo-500/20"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500">
            Manage all customer interactions and broadcasts
          </p>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-[#05015A] to-[#1a1a8c] rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold opacity-90">
              Communication Overview
            </h2>
            <p className="text-sm opacity-70">
              Quick summary of all channels
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {loadingTickets ? "..." : totalTickets}
              </div>
              <div className="text-xs opacity-70">Total Tickets</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">
                {loadingEnquiries ? "..." : totalEnquiries}
              </div>
              <div className="text-xs opacity-70">Total Enquiries</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">—</div>
              <div className="text-xs opacity-70">Broadcasts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communicationChannels.map((channel) => (
          <CommunicationCard
            key={channel.id}
            title={channel.title}
            description={channel.description}
            icon={channel.icon}
            path={channel.path}
            breadcrumbs={channel.breadcrumbs}
            stats={channel.stats}
            gradientFrom={channel.gradientFrom}
            gradientTo={channel.gradientTo}
            isLoading={channel.isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default CommunicationsPage;