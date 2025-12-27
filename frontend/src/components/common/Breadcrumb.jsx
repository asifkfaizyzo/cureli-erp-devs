// src/components/layout/Breadcrumb.jsx

import { useMenuStore } from "../../store/useMenuStore";

const Breadcrumb = () => {
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);
  const crumbs = breadcrumbs?.length > 0 ? breadcrumbs : ["Dashboard"];

  return (
    <nav className="text-sm flex items-center gap-2 mb-3" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            <span className={isLast ? "text-gray-600 font-medium" : "text-[#C3C0C0]"}>
              {crumb}
            </span>
            {!isLast && <span className="text-[#C3C0C0]">›</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;