// src/components/common/Breadcrumb.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

/**
 * Breadcrumb path mapping for admin panel
 */
const BREADCRUMB_PATHS = {
  // Main sections
  "Dashboard": "/dashboard",
  "Users": "/users",
  "Shops": "/shops",
  "Verification": "/verification",
  "Subscriptions": "/subscriptions",
  "Audits": "/audits",
  "Admins": "/admins",
  "Settings": "/settings",

  // Communications
  "Communications": "/communications",
  "Tickets": "/communications/tickets",
  "Enquiries": "/communications/enquiries",
  "Broadcast": "/communications/broadcast",
};

/**
 * Get the navigation path for a breadcrumb
 */
const getBreadcrumbPath = (crumb) => {
  return BREADCRUMB_PATHS[crumb] || null;
};

const Breadcrumb = () => {
  const navigate = useNavigate();
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const crumbs = useMemo(() => {
    return breadcrumbs?.length > 0 ? breadcrumbs : ["Dashboard"];
  }, [breadcrumbs]);

  const handleCrumbClick = (crumb, index) => {
    const path = getBreadcrumbPath(crumb);

    if (path) {
      // Update breadcrumbs to show path up to clicked crumb
      const newBreadcrumbs = crumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);

      // Navigate
      navigate(path);
    }
  };

  return (
    <nav
      className="text-sm flex items-center gap-1.5 mb-3"
      aria-label="Breadcrumb"
    >
      {/* Home Icon */}
      <Home size={14} className="text-gray-400 flex-shrink-0" />
      
      {/* Arrow after home icon */}
      <span className="text-gray-300 select-none">›</span>
      
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const path = getBreadcrumbPath(crumb);
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
