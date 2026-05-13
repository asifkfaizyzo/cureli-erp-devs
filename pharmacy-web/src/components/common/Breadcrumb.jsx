// src/components/layout/Breadcrumb.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

/**
 * Complete breadcrumb path mapping
 * Derived from App.jsx routes and Sidebar.jsx menu structure
 */
const BREADCRUMB_PATHS = {
  // ── Has real hub page = clickable ──
  Dashboard: "/dashboard",
  Inventory: "/inventory",
  Suppliers: "/suppliers",
  Notifications: "/notifications",
  "Support Tickets": "/tickets",

  // ── Settings sub-pages = clickable ──
  Users: "/settings/users",
  Branches: "/settings/branches",
  Profile: "/settings/profile",
  Plans: "/settings/upgrade",

  // ── Reports sub-pages ──
  "Sales Report": "/reports-sales",
  "Purchase Report": "/reports-purchase",
  "Inventory Report": "/reports-inventory",
  "Finance Report": "/reports-finance",

  // ── NO ENTRY for: Settings, Sales, Purchase, Orders, Reports ──
  // These have no hub page → getBreadcrumbPath returns null → non-clickable automatically
};

const CONTEXT_PATHS = {
  Billing: {
    Sales: "/Sales-billing",
    Purchase: "/purchase-billing",
  },
  Invoices: {
    Sales: "/Sales-invoice",
    Purchase: "/purchase-invoices",
  },
  Returns: {
    Sales: "/sales-returns",
    Purchase: "/purchase-returns",
  },
  "All Orders": { Orders: "/orders" },
  Pending: { Orders: "/orders-pending" },
  Completed: { Orders: "/orders-completed" },
  Sessions: { Orders: "/orders-sessions" },
};

const getBreadcrumbPath = (crumb, allCrumbs, index) => {
  if (BREADCRUMB_PATHS[crumb]) return BREADCRUMB_PATHS[crumb];

  if (CONTEXT_PATHS[crumb]) {
    const parent = allCrumbs[index - 1];
    if (parent && CONTEXT_PATHS[crumb][parent]) {
      return CONTEXT_PATHS[crumb][parent];
    }
  }

  return null; // → non-clickable
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
      {/* Home icon — decorative only, no click */}
      <Home size={14} className="text-gray-400 flex-shrink-0" />
      <span className="text-gray-300 select-none">›</span>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const path = getBreadcrumbPath(crumb, crumbs, index);
        const isClickable = !isLast && path; // null path = non-clickable automatically

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