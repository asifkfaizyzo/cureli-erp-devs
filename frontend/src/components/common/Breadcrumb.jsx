import { useMenuStore } from "../../store/useMenuStore";

const MENU_MAP = {
  dashboard: ["Dashboard"],

  sales: ["Sales"],
  "sales-billing": ["Sales", "Billing"],
  "sales-invoices": ["Sales", "Invoices"],

  purchase: ["Purchase"],
  "purchase-billing": ["Purchase", "Billing"],
  "purchase-invoices": ["Purchase", "Invoices"],

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
    <div className="text-sm flex mt-[-1%] items-center gap-2 mb-3">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-[#C3C0C0]">{c}</span>
          {i < crumbs.length - 1 && (
            <span className="text-[#C3C0C0]">›</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumb;
