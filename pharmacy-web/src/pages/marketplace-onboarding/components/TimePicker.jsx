// src/pages/marketplace-onboarding/components/TimePicker.jsx

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

const TimePicker = ({ value, onChange, label, placeholder = "Select time" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState("AM");
  const containerRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  // Parse incoming value (HH:mm 24h format) into 12h state
  useEffect(() => {
    if (!value) return;
    const [h, m] = value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    setPeriod(h >= 12 ? "PM" : "AM");
    setHours(h === 0 ? 12 : h > 12 ? h - 12 : h);
    setMinutes(m);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Convert 12h → 24h HH:mm and emit
  const emit = useCallback(
    (h, m, p) => {
      let h24 = h;
      if (p === "AM" && h === 12) h24 = 0;
      else if (p === "PM" && h !== 12) h24 = h + 12;
      const timeStr = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      onChange(timeStr);
    },
    [onChange]
  );

  const incrementHours = () => {
    const next = hours >= 12 ? 1 : hours + 1;
    setHours(next);
    emit(next, minutes, period);
  };

  const decrementHours = () => {
    const next = hours <= 1 ? 12 : hours - 1;
    setHours(next);
    emit(next, minutes, period);
  };

  const incrementMinutes = () => {
    const next = minutes >= 55 ? 0 : minutes + 5;
    setMinutes(next);
    emit(hours, next, period);
  };

  const decrementMinutes = () => {
    const next = minutes <= 0 ? 55 : minutes - 5;
    setMinutes(next);
    emit(hours, next, period);
  };

  const togglePeriod = () => {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    emit(hours, minutes, next);
  };

  // Scroll wheel support
  const handleWheel = (e, type) => {
    e.preventDefault();
    if (type === "hours") {
      e.deltaY < 0 ? incrementHours() : decrementHours();
    } else {
      e.deltaY < 0 ? incrementMinutes() : decrementMinutes();
    }
  };

  // Format display
  const displayValue = value
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`
    : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-2 px-2.5 py-2 rounded-lg
          border text-left transition-all duration-150
          ${isOpen
            ? "bg-white/[0.06] border-white/20 ring-2 ring-white/10"
            : "bg-white/[0.04] border-white/10 hover:border-white/15"
          }
        `}
      >
        <Clock
          size={13}
          className={`flex-shrink-0 ${displayValue ? "text-white/40" : "text-white/15"}`}
        />
        <span
          className={`text-xs font-mono flex-1 ${
            displayValue ? "text-white" : "text-white/20"
          }`}
        >
          {displayValue || placeholder}
        </span>
        <ChevronDown
          size={11}
          className={`text-white/20 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-1.5
            min-w-[200px] w-max
            left-1/2 -translate-x-1/2
            rounded-xl border border-white/10 bg-[#0a0a1a]
            shadow-2xl shadow-black/60
            overflow-visible
          "
        >
          {/* Picker body */}
          <div className="flex items-center justify-center gap-2 px-4 py-4">
            {/* Hours column */}
            <SpinColumn
              ref={hoursRef}
              value={hours}
              onIncrement={incrementHours}
              onDecrement={decrementHours}
              onWheel={(e) => handleWheel(e, "hours")}
              pad={2}
            />

            {/* Separator */}
            <div className="flex flex-col items-center justify-center select-none">
              <span className="text-white/30 text-lg font-bold leading-none">:</span>
            </div>

            {/* Minutes column */}
            <SpinColumn
              ref={minutesRef}
              value={minutes}
              onIncrement={incrementMinutes}
              onDecrement={decrementMinutes}
              onWheel={(e) => handleWheel(e, "minutes")}
              pad={2}
            />

            {/* AM/PM toggle */}
            <div className="ml-1.5">
              <button
                type="button"
                onClick={togglePeriod}
                className="
                  relative flex flex-col items-center w-12 rounded-lg
                  border border-white/10 overflow-hidden
                "
              >
                <span
                  className={`
                    w-full text-center py-2 text-[10px] font-bold tracking-wider transition-all duration-150
                    ${period === "AM"
                      ? "bg-white/10 text-white"
                      : "bg-transparent text-white/20 hover:text-white/30"
                    }
                  `}
                >
                  AM
                </span>
                <span className="w-full h-px bg-white/[0.06]" />
                <span
                  className={`
                    w-full text-center py-2 text-[10px] font-bold tracking-wider transition-all duration-150
                    ${period === "PM"
                      ? "bg-white/10 text-white"
                      : "bg-transparent text-white/20 hover:text-white/30"
                    }
                  `}
                >
                  PM
                </span>
              </button>
            </div>
          </div>

          {/* Done button */}
          <div className="border-t border-white/[0.06] px-3 py-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="
                w-full py-1.5 rounded-lg text-xs font-semibold
                bg-white/[0.08] text-white/70 hover:bg-white/[0.12] hover:text-white
                transition-all duration-150
              "
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Spin Column ───────────────────────────────────────────── */

const SpinColumn = forwardRef(
  ({ value, onIncrement, onDecrement, onWheel, pad = 2 }, ref) => {
    return (
      <div
        ref={ref}
        onWheel={onWheel}
        className="flex flex-col items-center gap-0.5 select-none"
      >
        {/* Up arrow */}
        <button
          type="button"
          onClick={onIncrement}
          className="
            w-11 h-7 flex items-center justify-center rounded-md
            text-white/20 hover:text-white/50 hover:bg-white/[0.06]
            transition-all duration-100 active:scale-90
          "
        >
          <ChevronUp size={14} />
        </button>

        {/* Value */}
        <div
          className="
            w-11 h-11 flex items-center justify-center rounded-lg
            bg-white/[0.06] border border-white/10
          "
        >
          <span className="text-white text-base font-mono font-semibold tabular-nums">
            {String(value).padStart(pad, "0")}
          </span>
        </div>

        {/* Down arrow */}
        <button
          type="button"
          onClick={onDecrement}
          className="
            w-11 h-7 flex items-center justify-center rounded-md
            text-white/20 hover:text-white/50 hover:bg-white/[0.06]
            transition-all duration-100 active:scale-90
          "
        >
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }
);

SpinColumn.displayName = "SpinColumn";

export default TimePicker;