// src/pages/dashboard/DashboardPage.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Building2,
  Layers,
  FileText,
  Activity,
  Shield,
  ChevronRight,
  Filter,
  Download,
  Bell,
  CreditCard,
  Truck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  Pill,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown as TrendingDownIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Store imports
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../../store/useAuthStore";
import { useToast } from "../../components/common/Toast";

// API imports
import salesAPI from "../../api/sales";
import purchaseAPI from "../../api/purchase";
import inventoryAPI from "../../api/inventory";
import customersAPI from "../../api/customers";
import { fetchUnreadCount, fetchRecentNotifications } from "../../api/notifications";
import { getMySubscription } from "../../api/subscription";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ════════════════════════════════════════════════════════════════════════════

const COLORS = {
  primary: "#000060",
  secondary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  teal: "#14B8A6",
  orange: "#F97316",
};

const CHART_COLORS = [
  "#000060",
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatFullCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(value) || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(value || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDateRange = (range) => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  let startDate = new Date();

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate.setMonth(endDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setFullYear(endDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
};

// ════════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      <div className="w-16 h-5 bg-gray-200 rounded-full" />
    </div>
    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
    <div className="h-7 bg-gray-200 rounded w-28" />
  </div>
);

const ChartSkeleton = ({ height = 300 }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-60 mb-4" />
    <div className={`bg-gray-100 rounded-lg`} style={{ height }} />
  </div>
);

const ListSkeleton = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const StatCard = ({
  title,
  value,
  subValue,
  change,
  icon: Icon,
  color,
  trend,
  onClick,
  loading,
  suffix,
  prefix,
}) => {
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
  };

  if (loading) {
    return <StatCardSkeleton />;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all ${
        onClick ? "cursor-pointer hover:border-indigo-200" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg border ${colorClasses[color]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        {change !== undefined && change !== null && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <TrendIcon size={12} />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {prefix}
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
      </p>
      {subValue && (
        <p className="text-xs text-gray-500 mt-1">{subValue}</p>
      )}
      {onClick && (
        <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 font-medium">
          <span>View details</span>
          <ChevronRight size={12} />
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// QUICK ACTION CARD
// ════════════════════════════════════════════════════════════════════════════

const QuickActionCard = ({ title, description, icon: Icon, color, onClick, badge }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25",
    green: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25",
    purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/25",
    amber: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25",
    indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/25",
    teal: "from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/25",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${colorClasses[color]} 
                  text-white shadow-lg hover:shadow-xl transition-all group w-full text-left`}
    >
      {badge && (
        <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="relative z-10">
        <Icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs opacity-90 mt-1">{description}</p>
      </div>
      <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={80} />
      </div>
    </motion.button>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// BRANCH CONTEXT BANNER
// ════════════════════════════════════════════════════════════════════════════

const BranchContextBanner = ({ isGlobalMode, branchName, lastUpdated }) => {
  if (isGlobalMode) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Layers size={16} className="text-blue-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-blue-900">
                All Branches Overview
              </span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                Combined
              </span>
            </div>
          </div>
          {lastUpdated && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Clock size={12} />
              Updated {formatDateTime(lastUpdated)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Building2 size={16} className="text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-900">
            {branchName || "Selected Branch"}
          </span>
        </div>
        {lastUpdated && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Clock size={12} />
            Updated {formatDateTime(lastUpdated)}
          </span>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// CUSTOM CHART TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

const CustomTooltip = ({ active, payload, label, isCurrency = false }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-200">
      <p className="text-xs font-semibold text-gray-800 mb-2 border-b pb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600">{entry.name}:</span>
          <span className="text-xs font-bold text-gray-900 ml-auto">
            {isCurrency ? formatFullCurrency(entry.value) : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ALERT CARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const AlertCard = ({ type, title, message, count, onClick, icon: Icon }) => {
  const styles = {
    warning: {
      bg: "bg-gradient-to-r from-amber-50 to-orange-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-900",
      subTextColor: "text-amber-700",
    },
    danger: {
      bg: "bg-gradient-to-r from-red-50 to-pink-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-900",
      subTextColor: "text-red-700",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-50 to-indigo-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
      subTextColor: "text-blue-700",
    },
    success: {
      bg: "bg-gradient-to-r from-green-50 to-emerald-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      textColor: "text-green-900",
      subTextColor: "text-green-700",
    },
  };

  const style = styles[type] || styles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${style.bg} border ${style.border} rounded-xl p-4 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${style.iconBg}`}>
          <Icon className={style.iconColor} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold text-sm ${style.textColor}`}>{title}</h4>
            {count !== undefined && (
              <span className={`text-lg font-bold ${style.textColor}`}>{count}</span>
            )}
          </div>
          <p className={`text-xs ${style.subTextColor} mt-1`}>{message}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${style.textColor} mt-2`}>
            View details <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TRANSACTION ITEM COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const TransactionItem = ({ transaction, onClick }) => {
  const typeConfig = {
    SALE: {
      icon: ShoppingCart,
      bg: "bg-green-100",
      color: "text-green-600",
      label: "Sale",
    },
    PURCHASE: {
      icon: Truck,
      bg: "bg-blue-100",
      color: "text-blue-600",
      label: "Purchase",
    },
    RETURN: {
      icon: RotateCcw,
      bg: "bg-red-100",
      color: "text-red-600",
      label: "Return",
    },
    PAYMENT: {
      icon: CreditCard,
      bg: "bg-purple-100",
      color: "text-purple-600",
      label: "Payment",
    },
  };

  const config = typeConfig[transaction.type] || typeConfig.SALE;
  const Icon = config.icon;

  const statusColors = {
    CONFIRMED: "bg-green-100 text-green-700",
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
    PAID: "bg-emerald-100 text-emerald-700",
    UNPAID: "bg-amber-100 text-amber-700",
  };

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
          <Icon size={18} className={config.color} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {transaction.invoice_number}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              statusColors[transaction.status] || statusColors.DRAFT
            }`}>
              {transaction.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {transaction.party_name || "Walk-in"} • {formatDateTime(transaction.date)}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className={`text-sm font-bold ${
          transaction.type === "RETURN" ? "text-red-600" : "text-gray-900"
        }`}>
          {transaction.type === "RETURN" ? "-" : ""}{formatCurrency(transaction.amount)}
        </p>
        <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-600 transition-colors ml-auto" />
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TOP PRODUCT ITEM
// ════════════════════════════════════════════════════════════════════════════

const TopProductItem = ({ product, index, maxSales }) => {
  const percentage = maxSales > 0 ? (product.total_quantity / maxSales) * 100 : 0;

  const rankColors = [
    "from-amber-400 to-amber-500",
    "from-gray-400 to-gray-500",
    "from-orange-400 to-orange-500",
    "from-indigo-400 to-indigo-500",
    "from-purple-400 to-purple-500",
  ];

  return (
    <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br ${rankColors[index] || rankColors[4]}`}>
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{product.medicine_name}</p>
            <p className="text-xs text-gray-500">{product.manufacturer || "N/A"}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">{formatCurrency(product.total_revenue)}</p>
          <p className="text-xs text-gray-500">{formatNumber(product.total_quantity)} units</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const DashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Auth & Branch Context
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const user = useAuthStore((state) => state.user);
  const isGlobalMode = branchContext.mode === "GLOBAL";
  const currentBranchName = branchContext.branch_name;

  // Ref to track branch changes
  const prevBranchRef = useRef({
    mode: branchContext.mode,
    branch_id: branchContext.branch_id,
  });

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("week");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Dashboard Data
  const [salesStats, setSalesStats] = useState(null);
  const [purchaseStats, setPurchaseStats] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [notifications, setNotifications] = useState({ total: 0, critical: 0, high: 0 });
  const [subscription, setSubscription] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);

  // ════════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ════════════════════════════════════════════════════════════════════════════

  const fetchDashboardData = useCallback(
    async (showLoadingState = true) => {
      if (showLoadingState) {
        setLoading(true);
        setError(null);
      }

      try {
        const { startDate, endDate } = getDateRange(dateRange);
        const dateParams = { startDate, endDate };

        console.log("📊 Fetching dashboard data:", {
          dateRange,
          startDate,
          endDate,
          branchMode: branchContext.mode,
          branchId: branchContext.branch_id,
        });

        // Parallel API calls for better performance
        const results = await Promise.allSettled([
          // Sales stats
          salesAPI.getStats(dateParams),
          // Purchase stats
          purchaseAPI.getStats(dateParams),
          // Inventory summary
          inventoryAPI.getSummary(),
          // Low stock items
          inventoryAPI.getLowStock({ limit: 10 }),
          // Expiring items
          inventoryAPI.getExpiringSoon(30),
          // Notifications
          fetchUnreadCount(),
          // Recent sales invoices
          salesAPI.getAll({ limit: 10, ...dateParams }),
          // Recent purchase invoices
          purchaseAPI.getAll({ limit: 10, ...dateParams }),
          // Sales returns
          salesAPI.getAllReturns({ limit: 5, ...dateParams }),
          // Purchase returns
          purchaseAPI.getAllReturns({ limit: 5, ...dateParams }),
          // Subscription (Super Admin only)
          isSuperAdmin ? getMySubscription() : Promise.resolve(null),
        ]);

        // Process results
        const [
          salesStatsResult,
          purchaseStatsResult,
          inventoryResult,
          lowStockResult,
          expiringResult,
          notificationsResult,
          recentSalesResult,
          recentPurchasesResult,
          salesReturnsResult,
          purchaseReturnsResult,
          subscriptionResult,
        ] = results;

        // Sales Stats
        if (salesStatsResult.status === "fulfilled") {
          setSalesStats(salesStatsResult.value.data || {});
        }

        // Purchase Stats
        if (purchaseStatsResult.status === "fulfilled") {
          setPurchaseStats(purchaseStatsResult.value.data || {});
        }

        // Inventory Summary
        if (inventoryResult.status === "fulfilled") {
          setInventorySummary(inventoryResult.value.data || {});
        }

        // Low Stock Items
        if (lowStockResult.status === "fulfilled") {
          setLowStockItems(lowStockResult.value.data?.items || []);
        }

        // Expiring Items
        if (expiringResult.status === "fulfilled") {
          setExpiringItems(expiringResult.value.data?.items || []);
        }

        // Notifications
        if (notificationsResult.status === "fulfilled") {
          setNotifications({
            total: notificationsResult.value.data?.total || 0,
            critical: notificationsResult.value.data?.by_priority?.critical || 0,
            high: notificationsResult.value.data?.by_priority?.high || 0,
          });
        }

        // Recent Sales
        if (recentSalesResult.status === "fulfilled") {
          const salesData = recentSalesResult.value.data?.invoices || [];
          setRecentSales(
            salesData.map((inv) => ({
              ...inv,
              type: "SALE",
              party_name: inv.customer?.name || inv.walkin_name,
              amount: inv.net_amount,
              date: inv.invoice_date || inv.created_at,
            }))
          );

          // Extract top products from sales
          const productMap = new Map();
          salesData.forEach((inv) => {
            (inv.lineItems || []).forEach((item) => {
              const existing = productMap.get(item.medicine_id) || {
                medicine_id: item.medicine_id,
                medicine_name: item.medicine?.name || "Unknown",
                manufacturer: item.medicine?.manufacturer,
                total_quantity: 0,
                total_revenue: 0,
              };
              existing.total_quantity += parseFloat(item.quantity) || 0;
              existing.total_revenue += parseFloat(item.line_total) || 0;
              productMap.set(item.medicine_id, existing);
            });
          });
          const sorted = Array.from(productMap.values())
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);
          setTopProducts(sorted);
        }

        // Recent Purchases
        if (recentPurchasesResult.status === "fulfilled") {
          const purchaseData = recentPurchasesResult.value.data?.invoices || [];
          setRecentPurchases(
            purchaseData.map((inv) => ({
              ...inv,
              type: "PURCHASE",
              party_name: inv.supplier?.name,
              amount: inv.net_amount,
              date: inv.invoice_date || inv.created_at,
            }))
          );
        }

        // Sales Returns
        if (salesReturnsResult.status === "fulfilled") {
          setSalesReturns(salesReturnsResult.value.data?.returns || []);
        }

        // Purchase Returns
        if (purchaseReturnsResult.status === "fulfilled") {
          setPurchaseReturns(purchaseReturnsResult.value.data?.returns || []);
        }

        // Subscription
        if (subscriptionResult.status === "fulfilled" && subscriptionResult.value) {
          setSubscription(subscriptionResult.value.data?.data || null);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
        toast.error("Failed to load dashboard", err.message || "Please try refreshing");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, branchContext.mode, branchContext.branch_id, isSuperAdmin, toast]
  );

  // Initial load and date range changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Branch change detection
  useEffect(() => {
    const prevBranch = prevBranchRef.current;
    const branchChanged =
      prevBranch.mode !== branchContext.mode ||
      prevBranch.branch_id !== branchContext.branch_id;

    if (branchChanged) {
      prevBranchRef.current = {
        mode: branchContext.mode,
        branch_id: branchContext.branch_id,
      };

      if (branchContext.mode === "GLOBAL") {
        toast.info("All Branches", "Loading combined data...");
      } else if (branchContext.branch_name) {
        toast.info("Branch Changed", `Loading data for ${branchContext.branch_name}`);
      }

      fetchDashboardData(true);
    }
  }, [branchContext.mode, branchContext.branch_id, branchContext.branch_name, toast, fetchDashboardData]);

  // ════════════════════════════════════════════════════════════════════════════
  // COMPUTED DATA
  // ════════════════════════════════════════════════════════════════════════════

  // Stock Status for Pie Chart
  const stockStatusData = useMemo(() => {
    if (!inventorySummary) return [];

    return [
      { name: "In Stock", value: inventorySummary.inStockCount || 0, color: COLORS.success },
      { name: "Low Stock", value: inventorySummary.lowStockCount || 0, color: COLORS.warning },
      { name: "Out of Stock", value: inventorySummary.outOfStockCount || 0, color: COLORS.danger },
      { name: "Expired", value: inventorySummary.expiredCount || 0, color: COLORS.purple },
    ].filter((item) => item.value > 0);
  }, [inventorySummary]);

  // Revenue Chart Data
  const revenueChartData = useMemo(() => {
    const days = dateRange === "today" ? 1 : dateRange === "week" ? 7 : dateRange === "month" ? 30 : 12;
    const data = [];

    // Group sales by date
    const salesByDate = new Map();
    const purchasesByDate = new Map();

    recentSales.forEach((sale) => {
      const date = new Date(sale.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      salesByDate.set(date, (salesByDate.get(date) || 0) + parseFloat(sale.amount || 0));
    });

    recentPurchases.forEach((purchase) => {
      const date = new Date(purchase.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      purchasesByDate.set(date, (purchasesByDate.get(date) || 0) + parseFloat(purchase.amount || 0));
    });

    // Generate date labels
    for (let i = Math.min(days - 1, 6); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

      const sales = salesByDate.get(label) || 0;
      const purchases = purchasesByDate.get(label) || 0;

      data.push({
        date: label,
        sales,
        purchases,
        profit: sales - purchases,
      });
    }

    return data;
  }, [recentSales, recentPurchases, dateRange]);

  // Combined recent transactions
  const recentTransactions = useMemo(() => {
    const transactions = [
      ...recentSales.slice(0, 5),
      ...recentPurchases.slice(0, 5),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    return transactions;
  }, [recentSales, recentPurchases]);

  // Max sales for progress bar
  const maxProductSales = useMemo(() => {
    return Math.max(...topProducts.map((p) => p.total_quantity), 1);
  }, [topProducts]);

  // ════════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════════════

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const handleQuickAction = useCallback(
    (action) => {
      if (isGlobalMode && ["new-sale", "new-purchase"].includes(action)) {
        toast.warning("Select a Branch", "Please select a specific branch first");
        return;
      }

      switch (action) {
        case "new-sale":
          navigate("/sales/billing");
          break;
        case "new-purchase":
          navigate("/purchase/billing");
          break;
        case "inventory":
          navigate("/inventory");
          break;
        case "reports":
          navigate("/reports-sales");
          break;
        default:
          break;
      }
    },
    [navigate, isGlobalMode, toast]
  );

  // ════════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ════════════════════════════════════════════════════════════════════════════

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-4 lg:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Welcome back, {user?.first_name || user?.full_name?.split(" ")[0] || "User"}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's what's happening with your business
              {dateRange === "today"
                ? " today"
                : dateRange === "week"
                ? " this week"
                : dateRange === "month"
                ? " this month"
                : " this year"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter */}
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              {["today", "week", "month", "year"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                    dateRange === range
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {range === "week" ? "7 Days" : range === "month" ? "30 Days" : range}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Branch Context Banner */}
        {isSuperAdmin && (
          <BranchContextBanner
            isGlobalMode={isGlobalMode}
            branchName={currentBranchName}
            lastUpdated={lastUpdated}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales"
            value={formatCurrency(salesStats?.total_sales || salesStats?.total_revenue || 0)}
            subValue={`${formatNumber(salesStats?.total_invoices || 0)} invoices`}
            change={salesStats?.growth_percentage}
            trend={salesStats?.growth_percentage >= 0 ? "up" : "down"}
            icon={DollarSign}
            color="green"
            onClick={() => navigate("/sales-invoice")}
            loading={loading}
          />
          <StatCard
            title="Total Purchases"
            value={formatCurrency(purchaseStats?.total_purchases || purchaseStats?.total_amount || 0)}
            subValue={`${formatNumber(purchaseStats?.total_invoices || 0)} invoices`}
            change={purchaseStats?.growth_percentage}
            trend={purchaseStats?.growth_percentage >= 0 ? "up" : "down"}
            icon={Truck}
            color="blue"
            onClick={() => navigate("/purchase-invoices")}
            loading={loading}
          />
          <StatCard
            title="Total Products"
            value={formatNumber(inventorySummary?.totalItems || 0)}
            subValue={`${formatNumber(inventorySummary?.totalStockQuantity || 0)} units in stock`}
            icon={Package}
            color="purple"
            onClick={() => navigate("/inventory")}
            loading={loading}
          />
          <StatCard
            title="Low Stock Items"
            value={formatNumber(inventorySummary?.lowStockCount || lowStockItems.length || 0)}
            subValue={`${formatNumber(inventorySummary?.outOfStockCount || 0)} out of stock`}
            icon={AlertTriangle}
            color={inventorySummary?.lowStockCount > 10 ? "red" : "amber"}
            onClick={() => navigate("/inventory?filter=lowstock")}
            loading={loading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Pending Payments"
            value={formatCurrency(salesStats?.pending_amount || 0)}
            icon={Clock}
            color="amber"
            onClick={() => navigate("/sales-invoice?status=pending")}
            loading={loading}
          />
          <StatCard
            title="Expiring Soon"
            value={formatNumber(inventorySummary?.expiringSoonCount || expiringItems.length || 0)}
            subValue="Within 30 days"
            icon={Calendar}
            color="red"
            onClick={() => navigate("/inventory?filter=expiring")}
            loading={loading}
          />
          <StatCard
            title="Sales Returns"
            value={formatNumber(salesReturns.length)}
            subValue={`${salesReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length} pending`}
            icon={RotateCcw}
            color="pink"
            onClick={() => navigate("/sales-returns")}
            loading={loading}
          />
          <StatCard
            title="Notifications"
            value={formatNumber(notifications.total)}
            subValue={notifications.critical > 0 ? `${notifications.critical} critical` : "All clear"}
            icon={Bell}
            color={notifications.critical > 0 ? "red" : "teal"}
            onClick={() => navigate("/notifications")}
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="New Sale"
            description="Create sales invoice"
            icon={ShoppingCart}
            color="green"
            onClick={() => handleQuickAction("new-sale")}
            badge={isGlobalMode ? "Select Branch" : null}
          />
          <QuickActionCard
            title="New Purchase"
            description="Record purchase entry"
            icon={Truck}
            color="blue"
            onClick={() => handleQuickAction("new-purchase")}
            badge={isGlobalMode ? "Select Branch" : null}
          />
          <QuickActionCard
            title="Inventory"
            description="Manage stock levels"
            icon={Package}
            color="purple"
            onClick={() => handleQuickAction("inventory")}
            badge={lowStockItems.length > 0 ? `${lowStockItems.length} low` : null}
          />
          <QuickActionCard
            title="Reports"
            description="View analytics"
            icon={BarChart3}
            color="amber"
            onClick={() => handleQuickAction("reports")}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Chart - 2 cols */}
          <div className="xl:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-60 mb-4" />
                <div className="h-[300px] bg-gray-100 rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                    <p className="text-xs text-gray-500">Sales vs Purchases comparison</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-gray-600">Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Purchases</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={COLORS.success}
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                      name="Sales"
                    />
                    <Bar
                      dataKey="purchases"
                      fill={COLORS.info}
                      radius={[4, 4, 0, 0]}
                      name="Purchases"
                      opacity={0.8}
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Summary Row */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Sales</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(revenueChartData.reduce((sum, d) => sum + d.sales, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Purchases</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(revenueChartData.reduce((sum, d) => sum + d.purchases, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Net Profit</p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(revenueChartData.reduce((sum, d) => sum + d.profit, 0))}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stock Status Pie Chart - 1 col */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
                <div className="h-[220px] bg-gray-100 rounded-full mx-auto w-[220px]" />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution</h3>
                
                {stockStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={stockStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {stockStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {stockStatusData.map((status) => (
                        <div key={status.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: status.color }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs text-gray-600 block truncate">{status.name}</span>
                            <span className="text-sm font-bold text-gray-900">{formatNumber(status.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <PieChartIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No stock data available</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
                    <p className="text-xs text-gray-500">By revenue this period</p>
                  </div>
                  <button
                    onClick={() => navigate("/reports-sales")}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    View All <ExternalLink size={12} />
                  </button>
                </div>
                
                {topProducts.length > 0 ? (
                  <div className="space-y-1">
                    {topProducts.map((product, index) => (
                      <TopProductItem
                        key={product.medicine_id}
                        product={product}
                        index={index}
                        maxSales={maxProductSales}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <Pill size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sales data for this period</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                    <p className="text-xs text-gray-500">Latest sales & purchases</p>
                  </div>
                  <button
                    onClick={() => navigate("/sales/invoice")}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    View All <ExternalLink size={12} />
                  </button>
                </div>
                
                {recentTransactions.length > 0 ? (
                  <div className="space-y-1 max-h-[380px] overflow-y-auto">
                    {recentTransactions.map((transaction) => (
                      <TransactionItem
                        key={`${transaction.type}-${transaction.invoice_id}`}
                        transaction={transaction}
                        onClick={() =>
                          navigate(
                            transaction.type === "SALE"
                              ? `/sales/invoice`
                              : `/purchase/invoice`
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No transactions for this period</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Alert Cards */}
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <AlertCard
                type="warning"
                title="Low Stock Alert"
                message={`${lowStockItems.length} items need restocking soon`}
                count={lowStockItems.length}
                icon={AlertTriangle}
                onClick={() => navigate("/inventory?filter=lowstock")}
              />
            )}

            {/* Expiring Soon Alert */}
            {expiringItems.length > 0 && (
              <AlertCard
                type="danger"
                title="Expiring Soon"
                message={`${expiringItems.length} items expiring within 30 days`}
                count={expiringItems.length}
                icon={Clock}
                onClick={() => navigate("/inventory?filter=expiring")}
              />
            )}

            {/* Critical Notifications */}
            {notifications.critical > 0 && (
              <AlertCard
                type="info"
                title="Critical Alerts"
                message={`${notifications.critical} notifications need attention`}
                count={notifications.critical}
                icon={Bell}
                onClick={() => navigate("/notifications?priority=critical")}
              />
            )}

            {/* Subscription Alert (Super Admin) */}
            {isSuperAdmin && subscription && subscription.days_remaining < 30 && (
              <AlertCard
                type="info"
                title="Plan Expiring"
                message={`Your plan expires in ${subscription.days_remaining} days`}
                count={subscription.days_remaining}
                icon={CreditCard}
                onClick={() => navigate("/settings/plans")}
              />
            )}

            {/* Pending Returns */}
            {(salesReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length > 0 ||
              purchaseReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length > 0) && (
              <AlertCard
                type="warning"
                title="Pending Returns"
                message={`${
                  salesReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length +
                  purchaseReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length
                } returns awaiting approval`}
                count={
                  salesReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length +
                  purchaseReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length
                }
                icon={RotateCcw}
                onClick={() => navigate("/sales/returns")}
              />
            )}
          </div>
        </AnimatePresence>

        {/* Low Stock Items Preview */}
        {!loading && lowStockItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">Low Stock Items</h3>
                  <p className="text-xs text-amber-700">Items that need restocking</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/inventory?filter=lowstock")}
                className="text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
              >
                View All ({lowStockItems.length}) <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {lowStockItems.slice(0, 4).map((item) => (
                <div
                  key={item.inventory_id}
                  className="bg-white p-3 rounded-lg border border-amber-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate("/inventory")}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{item.medicine_name || item.name}</p>
                  <p className="text-xs text-gray-500 truncate">{item.batch_number}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-amber-700 font-medium">
                      Stock: {item.current_stock || item.quantity}
                    </span>
                    <span className="text-xs text-gray-500">
                      Min: {item.min_stock_level || item.minimum_stock || 10}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Dashboard data refreshes automatically. Last updated: {lastUpdated ? formatDateTime(lastUpdated) : "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;