import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const StyledDateFilter = ({ label, date, setDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // For navigation
  const containerRef = useRef(null);

  // 1. Handle Outside Clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Date Logic Helpers
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDateDisplay = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDateClick = (day) => {
    // Create date string in YYYY-MM-DD format (local time)
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Adjust for timezone offset so we get the correct YYYY-MM-DD string
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
    const dateString = adjustedDate.toISOString().split('T')[0];
    
    setDate(dateString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDate("");
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  // 3. Generate Calendar Grid
  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the 1st of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    // Actual days
    for (let i = 1; i <= totalDays; i++) {
      const tempDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      // Check if this day matches the selected date
      // We compare strings to avoid time issues
      const isSelected = date && 
        parseInt(date.split('-')[2]) === i &&
        parseInt(date.split('-')[1]) === currentMonth.getMonth() + 1 &&
        parseInt(date.split('-')[0]) === currentMonth.getFullYear();

      // Check if today
      const isToday = new Date().toDateString() === tempDate.toDateString();

      days.push(
        <button
          key={i}
          onClick={() => handleDateClick(i)}
          className={`
            h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all
            ${isSelected 
              ? "bg-[#05015A] text-white shadow-md scale-105" 
              : "text-gray-700 hover:bg-indigo-50 hover:text-[#05015A]"
            }
            ${!isSelected && isToday ? "border border-[#05015A] text-[#05015A] font-bold" : ""}
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const isActive = Boolean(date);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs text-gray-500 font-medium ml-1">{label}</label>
      )}

      <div className="relative">
        {/* TRIGGER BUTTON */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            h-10 pl-10 pr-10 border rounded-lg text-sm text-left 
            flex items-center w-auto min-w-[160px] shadow-sm whitespace-nowrap
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            transition-all duration-200 ease-in-out
            ${isActive 
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }
          `}
        >
          <CalendarIcon 
            size={16} 
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors
              ${isActive ? "text-indigo-500" : "text-gray-400"}`}
          />
          
          <span>{isActive ? formatDateDisplay(date) : "Select Date"}</span>

          {isActive ? (
            <div
              role="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full 
                         hover:bg-indigo-200 text-indigo-500 transition-colors z-10"
            >
              <X size={14} strokeWidth={2.5} />
            </div>
          ) : (
            <ChevronDown 
              size={16} 
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200
                ${isOpen ? "rotate-180" : ""}`} 
            />
          )}
        </button>

        {/* CUSTOM CALENDAR DROPDOWN */}
        {isOpen && (
          <div className="absolute z-50 top-full left-0 mt-2 p-4 w-64 bg-white border border-gray-200 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
            
            {/* Header: Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
              >
                <ChevronLeft size={18} />
              </button>
              
              <span className="text-sm font-semibold text-gray-800">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>

              <button 
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 mb-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <span key={day} className="text-xs font-medium text-gray-400">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
              {renderCalendar()}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default StyledDateFilter;