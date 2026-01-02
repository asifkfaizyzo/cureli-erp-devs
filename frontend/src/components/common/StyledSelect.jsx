// components/common/StyledSelect.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const StyledSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select...",
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate position before opening
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Handle opening - calculate position first, then open
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on scroll and update position on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = Boolean(value);

  // Only render dropdown when open AND position is calculated
  const dropdown = isOpen && dropdownPosition
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: Math.max(dropdownPosition.width, 160),
          }}
        >
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
        </div>,
        document.body
      )
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-500 font-medium">{label}</label>
      )}
      
      {/* Trigger Button - Chevron is now INSIDE */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full h-10 px-3 border rounded-lg text-sm text-left
                   flex items-center justify-between gap-2 shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                   transition-all duration-200 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed
                   ${error
                     ? "border-red-500 bg-red-50"
                     : isActive 
                       ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
                       : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                   }`}
      >
        <span className={`flex-1 truncate ${selectedOption ? "" : "text-gray-400"}`}>
          {selectedOption?.label || placeholder}
        </span>
        
        {/* Chevron inside button */}
        <ChevronDown 
          size={16} 
          className={`flex-shrink-0 transition-transform duration-200
                     ${isOpen ? "rotate-180" : ""}
                     ${isActive ? "text-indigo-500" : "text-gray-400"}`} 
        />
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Dropdown Portal */}
      {dropdown}
    </div>
  );
};

export default StyledSelect;