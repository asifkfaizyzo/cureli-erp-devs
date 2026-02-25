// src/pages/Dashboard/comps/AlertsBanner.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ALERT_STYLES = {
  error: {
    bg: "bg-red-50 border-red-200",
    icon: "bg-red-100 text-red-600",
    text: "text-red-800",
    button: "bg-red-100 hover:bg-red-200 text-red-700",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-800",
    button: "bg-amber-100 hover:bg-amber-200 text-amber-700",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-800",
    button: "bg-blue-100 hover:bg-blue-200 text-blue-700",
  },
};

const AlertsBanner = ({ alerts = [], onDismiss }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex];
  const style = ALERT_STYLES[currentAlert.type] || ALERT_STYLES.info;
  const Icon = currentAlert.type === "error" 
    ? AlertCircle 
    : currentAlert.type === "warning" 
    ? AlertTriangle 
    : Info;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? alerts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === alerts.length - 1 ? 0 : prev + 1));
  };

  const handleAction = () => {
    if (currentAlert.action?.path) {
      navigate(currentAlert.action.path);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`${style.bg} border rounded-xl px-4 py-2 flex items-center gap-2 transition-all hover:shadow-md`}
      >
        <div className={`w-6 h-6 rounded-lg ${style.icon} flex items-center justify-center`}>
          <Icon size={14} />
        </div>
        <span className={`text-sm font-medium ${style.text}`}>
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown size={16} className={style.text} />
      </button>
    );
  }

  return (
    <div className={`${style.bg} border rounded-xl p-4 transition-all`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${style.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={`font-semibold ${style.text}`}>{currentAlert.title}</h4>
              <p className={`text-sm ${style.text} opacity-80 mt-0.5`}>
                {currentAlert.message}
              </p>
            </div>

            {/* Collapse & Dismiss */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded hover:bg-black/5 transition-colors"
              >
                <ChevronUp size={16} className={style.text} />
              </button>
              <button
                onClick={() => onDismiss?.(currentAlert.id)}
                className="p-1 rounded hover:bg-black/5 transition-colors"
              >
                <X size={16} className={style.text} />
              </button>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between mt-3">
            {/* Action Button */}
            {currentAlert.action && (
              <button
                onClick={handleAction}
                className={`${style.button} px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors`}
              >
                {currentAlert.action.label}
                <ChevronRight size={14} />
              </button>
            )}

            {/* Navigation */}
            {alerts.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-1 rounded hover:bg-black/5 transition-colors"
                >
                  <ChevronLeft size={16} className={style.text} />
                </button>
                <span className={`text-xs ${style.text}`}>
                  {currentIndex + 1} / {alerts.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1 rounded hover:bg-black/5 transition-colors"
                >
                  <ChevronRight size={16} className={style.text} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsBanner;