// src/components/common/Breadcrumb.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

const BREADCRUMB_PATHS = {
  // ── ERP hub pages ──
  Dashboard: "/erp/dashboard",
  Inventory: "/erp/inventory",
  Suppliers: "/erp/suppliers",
  Notifications: "/erp/notifications",
  "Support Tickets": "/erp/tickets",

  // ── Settings sub-pages ──
  Users: "/erp/settings/users",
  Branches: "/erp/settings/branches",
  Profile: "/erp/settings/profile",
  Plans: "/erp/settings/upgrade",

  // ── Reports sub-pages (commented out in sidebar but keep paths ready) ──
  "Sales Report": "/erp/reports-sales",
  "Purchase Report": "/erp/reports-purchase",
  "Inventory Report": "/erp/reports-inventory",
  "Finance Report": "/erp/reports-finance",

  // ── Marketplace hub pages ──
  Marketplace: "/marketplace/dashboard",
};

const CONTEXT_PATHS = {
  Billing: {
    Sales: "/erp/sales-billing",
    Purchase: "/erp/purchase-billing",
  },
  Invoices: {
    Sales: "/erp/sales-invoice",
    Purchase: "/erp/purchase-invoices",
  },
  Returns: {
    Sales: "/erp/sales-returns",
    Purchase: "/erp/purchase-returns",
  },
  // Orders entries removed — moving to Marketplace
};

const getBreadcrumbPath = (crumb, allCrumbs, index) => {
  if (BREADCRUMB_PATHS[crumb]) return BREADCRUMB_PATHS[crumb];

  if (CONTEXT_PATHS[crumb]) {
    const parent = allCrumbs[index - 1];
    if (parent && CONTEXT_PATHS[crumb][parent]) {
      return CONTEXT_PATHS[crumb][parent];
    }
  }

  return null;
};

const Breadcrumb = () => {
  const navigate = useNavigate();
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const crumbs = useMemo(() => {
    return breadcrumbs?.length > 0 ? breadcrumbs : ["Dashboard"];
  }, [breadcrumbs]);

  const handleCrumbClick = (crumb, index) => {
    const path = getBreadcrumbPath(crumb, crumbs, index);
    if (path) {
      setBreadcrumbs(crumbs.slice(0, index + 1));
      navigate(path);
    }
  };

  return (
    <nav
      className="text-sm flex items-center gap-1.5 mb-3"
      aria-label="Breadcrumb"
    >
      <Home size={14} className="text-gray-400 flex-shrink-0" />
      <span className="text-gray-300 select-none">›</span>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const path = getBreadcrumbPath(crumb, crumbs, index);
        const isClickable = !isLast && path;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {isClickable ? (
              <button
                onClick={() => handleCrumbClick(crumb, index)}
                className="text-gray-400 hover:text-[#000060] transition-colors duration-150"
              >
                {crumb}
              </button>
            ) : (
              <span
                className={
                  isLast ? "text-gray-700 font-medium" : "text-gray-400"
                }
              >
                {crumb}
              </span>
            )}
            {!isLast && <span className="text-gray-300 select-none">›</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;