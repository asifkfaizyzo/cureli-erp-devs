// src/pages/Dashboard/comps/PeriodSelector.jsx

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";

const PERIODS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last Year" },
];

const PeriodSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selected = PERIODS.find((p) => p.value === value) || PERIODS[1];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          border transition-all
          ${isOpen 
            ? "bg-[#000060] text-white border-[#000060] shadow-lg shadow-[#000060]/25" 
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }
        `}
      >
        <Calendar size={16} />
        <span className="hidden sm:inline">{selected.label}</span>
        <span className="sm:hidden">{value}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => {
                onChange(period.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 text-sm
                transition-colors
                ${period.value === value 
                  ? "bg-[#000060]/5 text-[#000060] font-medium" 
                  : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <span>{period.label}</span>
              {period.value === value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;