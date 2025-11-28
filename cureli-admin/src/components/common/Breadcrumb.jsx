// src/components/common/Breadcrumb.jsx
import { useMenuStore } from "../../store/useMenuStore";
import { ChevronRight } from "lucide-react";

const Breadcrumb = () => {
  const breadcrumbs = useMenuStore((s) => s.breadcrumbs);

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium select-none mt-1">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <span className={`${index === breadcrumbs.length - 1 ? "text-[#05015A] font-semibold" : ""}`}>
            {crumb}
          </span>

          {index !== breadcrumbs.length - 1 && (
            <ChevronRight size={14} className="mx-2 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
