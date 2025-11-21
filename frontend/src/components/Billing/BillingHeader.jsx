// src/components/Billing/BillingHeader.jsx
import { FiSave } from "react-icons/fi";

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

const BillingHeader = ({ activeMenu }) => {
  const crumbs = MENU_MAP[activeMenu] || ["Dashboard"];

  return (
    <div className="w-full flex flex-col">
      {/* Breadcrumb */}
      <div className="text-sm flex items-center gap-2 text-gray-500 mb-3">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className={i === crumbs.length - 1 ? "text-gray-800 font-medium" : ""}>
              {c}
            </span>
            {i < crumbs.length - 1 && <span className="text-gray-400">›</span>}
          </span>
        ))}
      </div>

      {/* Top row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#000060]">
            Bill No : <span className="font-extrabold">123456</span>
          </h1>

          <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
            <span>
              Billed by <span className="font-medium text-gray-800">Amith</span>
            </span>

            <span>
              Date :
              <span className="font-medium text-gray-800 px-2 ml-1 py-1 bg-gray-100 rounded">
                12/04/25
              </span>
            </span>

            <span>
              Time :
              <span className="font-medium text-gray-800 px-2 ml-1 py-1 bg-gray-100 rounded">
                12:35 PM
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#000060] text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
            <FiSave size={14} />
            Save
          </button>

          <button className="bg-[#000060] text-white text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
            Save &amp; Print (F5)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingHeader;
