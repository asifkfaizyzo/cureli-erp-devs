import { useMenuStore } from "../../store/useMenuStore";
const MENU_MAP = {
  // MAIN PAGES
  dashboard: ["Dashboard"],

  // SALES
  sales: ["Sales"],
  "sales-billing": ["Sales", "Billing"],
  "sales-invoices": ["Sales", "Invoices"],

  // PURCHASE
  purchase: ["Purchase"],
  "purchase-billing": ["Purchase", "Billing"],
  "purchase-invoices": ["Purchase", "Invoices"],

  // INVENTORY & SUPPLIERS
  inventory: ["Inventory"],
  suppliers: ["Suppliers"],

  // REPORTS (✅ UPDATED)
  reports: ["Reports"],
  "sales-report": ["Reports", "Sales Report"],
  "purchase-report": ["Reports", "Purchase Report"],
  "inventory-report": ["Reports", "Inventory Report"],
  "finance-report": ["Reports", "Finance Report"],

  // OTHER MODULES
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

          {/* ALL breadcrumb items same color */}
          <span className="text-[#C3C0C0]">
            {c}
          </span>

          {i < crumbs.length - 1 && (
            <span className="text-[#C3C0C0]">›</span>
          )}
        </span>
      ))}

    </div>
  );
};

export default Breadcrumb;
