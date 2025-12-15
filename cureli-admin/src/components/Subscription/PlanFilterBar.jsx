import { Search, SlidersHorizontal } from "lucide-react";
import { FILTER_OPTIONS, PLAN_STATUS } from "../../config/modules/subscriptionConfig";

export default function PlanFilterBar({ 
  filter, 
  setFilter, 
  searchQuery, 
  setSearchQuery,
  planCounts 
}) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-5">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={14} className="text-gray-400 mr-1" />
          
          {FILTER_OPTIONS.map((option) => {
            const count = option.key === "all" 
              ? planCounts.total 
              : planCounts[option.key.toLowerCase()] || 0;

            return (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                  font-medium text-xs transition-all duration-300
                  ${filter === option.key 
                    ? `${option.activeColor} text-white shadow-md` 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                <option.icon size={12} />
                {option.label}
                <span 
                  className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${filter === option.key 
                      ? "bg-white/20 text-white" 
                      : "bg-gray-200 text-gray-600"
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-auto">
          <Search 
            size={14} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full lg:w-[240px] pl-9 pr-3 py-2 
              border-2 border-gray-200 rounded-lg text-sm
              focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20
              transition-all duration-300 outline-none
              hover:border-[#05015A]/50
            "
          />
        </div>

      </div>
    </div>
  );
}