// frontend/src/pages/purchase/returns/components/ReturnStatusBadge.jsx

import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
};

const ReturnStatusBadge = ({ status, size = "md", showIcon = true }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_APPROVAL;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon size={size === "sm" ? 12 : size === "lg" ? 18 : 14} />}
      {config.label}
    </span>
  );
};

export default ReturnStatusBadge;