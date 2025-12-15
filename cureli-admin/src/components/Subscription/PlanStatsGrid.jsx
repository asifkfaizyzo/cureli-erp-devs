import { 
  LayoutGrid, 
  FileEdit, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from "lucide-react";
import { PLAN_STATUS } from "../../config/modules/subscriptionConfig";

const StatCard = ({ label, count, icon: Icon, iconBg, iconColor, hoverBorder }) => (
  <div 
    className={`
      group bg-white p-4 rounded-xl shadow-sm border border-gray-100 
      hover:shadow-md ${hoverBorder} transition-all duration-300
    `}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${iconColor}`}>{count}</p>
      </div>
      <div 
        className={`
          p-2.5 ${iconBg} rounded-xl 
          group-hover:scale-110 transition-all duration-300
        `}
      >
        <Icon size={20} className={iconColor} />
      </div>
    </div>
  </div>
);

export default function PlanStatsGrid({ plans }) {
  const stats = {
    total: plans.length,
    draft: plans.filter(p => p.status === PLAN_STATUS.DRAFT).length,
    active: plans.filter(p => p.status === PLAN_STATUS.ACTIVE).length,
    deprecated: plans.filter(p => p.status === PLAN_STATUS.DEPRECATED).length,
    suspended: plans.filter(p => p.status === PLAN_STATUS.SUSPENDED).length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      <StatCard
        label="Total Plans"
        count={stats.total}
        icon={LayoutGrid}
        iconBg="bg-[#05015A]/10"
        iconColor="text-[#05015A]"
        hoverBorder="hover:border-[#05015A]/30"
      />
      <StatCard
        label="Draft"
        count={stats.draft}
        icon={FileEdit}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        hoverBorder="hover:border-amber-300"
      />
      <StatCard
        label="Active"
        count={stats.active}
        icon={CheckCircle2}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        hoverBorder="hover:border-emerald-300"
      />
      <StatCard
        label="Deprecated"
        count={stats.deprecated}
        icon={Clock}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        hoverBorder="hover:border-orange-300"
      />
      <StatCard
        label="Suspended"
        count={stats.suspended}
        icon={XCircle}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        hoverBorder="hover:border-red-300"
      />
    </div>
  );
}