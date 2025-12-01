// components/User/DetailRow.jsx

import { Pencil, ClipboardCopy, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";

const DetailRow = ({
  label,
  value,
  isEditing,
  fieldName,
  type = "text", // text | select | status | verification
  options = [],
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textValue = typeof value === "string" ? value : String(value);
    navigator.clipboard.writeText(textValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    let styles = "bg-gray-100 text-gray-700";
    let icon = null;

    if (statusLower === "active" || statusLower === "yes") {
      styles = "bg-emerald-100 text-emerald-700";
      icon = <CheckCircle size={12} />;
    } else if (statusLower === "suspended" || statusLower === "inactive" || statusLower === "no") {
      styles = "bg-red-100 text-red-700";
      icon = <XCircle size={12} />;
    } else if (statusLower === "pending" || statusLower === "pending setup") {
      styles = "bg-orange-100 text-orange-700";
      icon = <Clock size={12} />;
    } else if (statusLower === "paid") {
      styles = "bg-emerald-100 text-emerald-700";
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>
        {icon}
        {status}
      </span>
    );
  };

  // Render verification badge
  const renderVerificationBadge = (status) => {
    const statusLower = status?.toLowerCase();
    let styles = "bg-orange-100 text-orange-700";
    let icon = <Clock size={12} />;

    if (statusLower === "verified") {
      styles = "bg-emerald-100 text-emerald-700";
      icon = <CheckCircle size={12} />;
    } else if (statusLower === "rejected") {
      styles = "bg-red-100 text-red-700";
      icon = <XCircle size={12} />;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>
        {icon}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-4 py-2 group">
      {/* Label */}
      <label className="w-36 text-sm font-medium text-gray-500 flex-shrink-0">
        {label}
      </label>

      {/* Value */}
      <div className="flex-1 relative">
        {/* Status Badge */}
        {type === "status" && !isEditing && (
          <div className="px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200">
            {renderStatusBadge(value)}
          </div>
        )}

        {/* Verification Badge */}
        {type === "verification" && !isEditing && (
          <div className="px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200">
            {renderVerificationBadge(value)}
          </div>
        )}

        {/* Select Field */}
        {type === "select" && isEditing && (
          <select
            name={fieldName}
            defaultValue={value}
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border-2 border-indigo-500 
                       text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Text Input - Editable or Read-only */}
        {(type === "text" || (type === "select" && !isEditing)) && (
          <input
            type="text"
            name={fieldName}
            defaultValue={type === "select" ? options.find(o => o.value === value)?.label || value : value}
            readOnly={!isEditing}
            className={`
              w-full px-4 py-2.5 pr-10 rounded-lg text-sm transition-all duration-200
              ${isEditing
                ? "bg-white border-2 border-indigo-500 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                : "bg-white border border-gray-200 text-gray-700 cursor-default"
              }
            `}
          />
        )}

        {/* Copy Button - Only in read mode for text */}
        {!isEditing && type === "text" && (
          <button
            onClick={handleCopy}
            className="
              absolute right-3 top-1/2 -translate-y-1/2 opacity-0
              group-hover:opacity-100 transition-opacity duration-150
              text-gray-400 hover:text-indigo-500
            "
          >
            <ClipboardCopy size={16} />
          </button>
        )}

        {/* Edit Icon - Only in edit mode for text */}
        {isEditing && type === "text" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Pencil size={14} className="text-indigo-400" />
          </div>
        )}
      </div>

      {/* Copy feedback */}
      {copied && (
        <span className="text-xs text-green-600 ml-2">Copied</span>
      )}
    </div>
  );
};

export default DetailRow;