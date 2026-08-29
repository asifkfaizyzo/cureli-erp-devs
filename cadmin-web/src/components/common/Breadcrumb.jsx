// cadmin-web/src/components/common/Breadcrumb.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

const BREADCRUMB_PATHS = {
  // ── Admin ─────────────────────────────────────────────────────────────────
  Dashboard: "/dashboard",
  Users: "/users",
  Shops: "/shops",
  Verification: "/verification",
  Subscriptions: "/subscriptions",
  Plans: "/subscriptions/manage",
  Audits: "/audits",
  Admins: "/admins",
  Settings: "/settings",

  // ── Communications ────────────────────────────────────────────────────────
  Communications: "/communications",
  Tickets: "/communications/tickets",
  "Customer Tickets": "/communications/customer-tickets", // ◄ Added Customer Tickets mapping
  Enquiries: "/communications/enquiries",
  Broadcast: "/communications/broadcast",
  "In-App": "/communications/broadcast/in-app",
  "In-App Broadcast": "/communications/broadcast/in-app",
  "Email Broadcast": "/communications/broadcast/email",
  "Mobile Push": "/communications/broadcast/mobile",

  // ── Notifications ─────────────────────────────────────────────────────────
  Notifications: "/notifications",

  // ── Marketplace ───────────────────────────────────────────────────────────
  Marketplace: "/marketplace/dashboard",
  "Master Medicines": "/marketplace/master-medicines",
  Orders: "/marketplace/orders",
  Pricing: "/marketplace/pricing",

  // ── App Config ────────────────────────────────────────────────────────────
  "App Config": "/marketplace/app-config",
  Categories: "/marketplace/app-config/categories",
  Banners: "/marketplace/app-config/banners",
  "Home Layout": "/marketplace/app-config/home-screen",
  loyalty: "/marketplace/app-config/loyalty",
  coupons: "/marketplace/app-config/coupons",
};

const getBreadcrumbPath = (crumb) => BREADCRUMB_PATHS[crumb] ?? null;

const Breadcrumb = () => {
  const navigate = useNavigate();
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const crumbs = useMemo(
    () => (breadcrumbs?.length > 0 ? breadcrumbs : ["Dashboard"]),
    [breadcrumbs],
  );

  const handleCrumbClick = (crumb, index) => {
    const path = getBreadcrumbPath(crumb);
    if (!path) return;
    setBreadcrumbs(crumbs.slice(0, index + 1));
    navigate(path);
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
        const path = getBreadcrumbPath(crumb);
        const isClickable = !isLast && !!path;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {isClickable ? (
              <button
                onClick={() => handleCrumbClick(crumb, index)}
                className="text-gray-400 hover:text-gray-800 transition-colors duration-150"
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