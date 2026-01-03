// frontend/src/components/common/Tooltip.jsx

import { useState, useRef, useEffect } from "react";

/**
 * Lightweight accessible tooltip component
 * - Activates on hover and focus
 * - Supports top, bottom, left, right positions
 * - Uses Tailwind CSS only
 * - Accessible: works with keyboard navigation
 */
const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
  contentClassName = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const padding = 8;

      let newPosition = position;

      // Check if tooltip overflows and adjust
      if (position === "top" && tooltipRect.top < padding) {
        newPosition = "bottom";
      } else if (position === "bottom" && tooltipRect.bottom > window.innerHeight - padding) {
        newPosition = "top";
      } else if (position === "left" && tooltipRect.left < padding) {
        newPosition = "right";
      } else if (position === "right" && tooltipRect.right > window.innerWidth - padding) {
        newPosition = "left";
      }

      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setActualPosition(position);
  };

  if (!content || disabled) {
    return <>{children}</>;
  }

  // Position classes
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  // Arrow classes
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900",
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!isVisible}
        className={`
          absolute z-[100] px-2.5 py-1.5 
          text-xs font-medium text-white 
          bg-gray-900 rounded-lg shadow-lg
          whitespace-nowrap pointer-events-none
          transition-all duration-150
          ${positionClasses[actualPosition]}
          ${isVisible ? "opacity-100 visible" : "opacity-0 invisible"}
          ${contentClassName}
        `}
      >
        {content}

        {/* Arrow */}
        <span
          className={`
            absolute w-0 h-0 
            border-4 border-solid
            ${arrowClasses[actualPosition]}
          `}
        />
      </div>
    </div>
  );
};

/**
 * Preset tooltip for status badges
 * Includes predefined messages for Cancelled and Closed statuses
 */
export const StatusTooltip = ({ status, children }) => {
  const statusMessages = {
    CANCELLED: "You cancelled this ticket before it was resolved.",
    CLOSED: "This ticket was resolved and closed by support.",
  };

  const message = statusMessages[status];

  if (!message) {
    return <>{children}</>;
  }

  return (
    <Tooltip content={message} position="top">
      {children}
    </Tooltip>
  );
};

export default Tooltip;