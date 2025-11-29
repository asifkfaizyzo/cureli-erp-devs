// components/common/StyledSelect.jsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const StyledSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = Boolean(value);

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-xs text-gray-500 font-medium">{label}</label>
      )}
      
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 pl-4 pr-10 border rounded-lg text-sm text-left
                     flex items-center min-w-[140px] whitespace-nowrap shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                     transition-all duration-200 ease-in-out
                     ${isActive 
                       ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
                       : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                     }`}
        >
          <span className={selectedOption ? "" : "text-gray-400"}>
            {selectedOption?.label || placeholder}
          </span>
        </button>

        {/* Chevron */}
        <ChevronDown 
          size={16} 
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform
                     ${isOpen ? "rotate-180" : ""}
                     ${isActive ? "text-indigo-500" : "text-gray-400"}`} 
        />

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[160px]
                         bg-white border border-gray-200 rounded-lg shadow-lg
                         py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between
                           transition-colors
                           ${value === option.value 
                             ? "bg-indigo-50 text-indigo-700" 
                             : "text-gray-700 hover:bg-gray-50"
                           }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check size={14} className="text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StyledSelect;