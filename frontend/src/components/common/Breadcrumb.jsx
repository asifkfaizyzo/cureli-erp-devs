import { useMenuStore } from "../../store/useMenuStore";

const MENU_MAP = {
  dashboard: ["Dashboard"],
  sales: ["Sales"],
  billing: ["Sales", "Billing"],
  invoices: ["Sales", "Invoices"],
  purchase: ["Purchase"],
  inventory: ["Inventory"],
  suppliers: ["Suppliers"],
  reports: ["Reports"],
  orders: ["Orders"],
  settings: ["Settings"],
};

const Breadcrumb = () => {
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const crumbs = MENU_MAP[activeMenu] || ["Dashboard"];

  return (
    <div className="text-sm flex mt-2 items-center gap-2 text-gray-500 mb-3">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className={
              i === crumbs.length - 1 ? "text-gray-800 font-medium" : ""
            }
          >
            {c}
          </span>
          {i < crumbs.length - 1 && <span className="text-gray-400">›</span>}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumb;
