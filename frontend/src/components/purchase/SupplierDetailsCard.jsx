// src/components/purchase/SupplierDetailsCard.jsx
import { Building2 } from "lucide-react";

const SupplierDetailsCard = ({ supplier, setSupplier }) => {
  const handle = (field, value) =>
    setSupplier((prev) => ({ ...prev, [field]: value }));

  const supplierNames = [
    "Apex Distributors",
    "Metro Pharma",
    "Alfa Medicos",
    "City Drug House",
    "Prime Healthcare",
    "Medilife Traders",
    "Sunrise Pharma",
    "Global Medical Co.",
  ];

  // Global input style
  const inputBase =
    "border border-gray-300 rounded-md bg-white text-black placeholder:text-[#000060] placeholder:opacity-100";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 w-full flex flex-col overflow-hidden">

      {/* ---------- Header (Matches BillingSummaryCard) ---------- */}
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
        <Building2 size={12} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-700">Supplier Details</h3>
      </div>

      {/* ---------- Body ---------- */}
      <div className="p-4 flex flex-col gap-4 text-[11px]">

        {/* ---------------- ROW 1 ---------------- */}
        <div className="flex items-center gap-6">

          {/* Sup ID */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">Sup ID:</label>
            <input
              value={supplier.purchaseId}
              readOnly
              className={`${inputBase} px-2 py-[3px] text-[11px] w-[70px] bg-gray-100`}
            />
          </div>

          {/* Invoice No */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">Invoice No:</label>
            <input
              value={supplier.invoiceNo}
              onChange={(e) => handle("invoiceNo", e.target.value)}
              className={`${inputBase} px-2 py-[3px] text-[11px] w-[110px]`}
              placeholder="INV-2025-001"
            />
          </div>

          {/* Supplier GST */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">Supplier GST:</label>
            <input
              value={supplier.supplierGST || ""}
              onChange={(e) => handle("supplierGST", e.target.value)}
              className={`${inputBase} px-2 py-[3px] text-[11px] w-[130px]`}
              placeholder="29ABCDE1234F1Z5"
            />
          </div>

          {/* Received On */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">Received on:</label>
            <input
              type="date"
              value={supplier.receivedOn || ""}
              onChange={(e) => handle("receivedOn", e.target.value)}
              className={`${inputBase} px-2 py-[3px] text-[11px] w-[130px]`}
            />
          </div>
        </div>

        {/* ---------------- ROW 2 ---------------- */}
        <div className="flex items-center gap-6">

          {/* Address */}
          <div className="flex items-center gap-2 flex-1">
            <label className="text-[10px] text-gray-700">Address:</label>
            <input
              value={supplier.address || ""}
              onChange={(e) => handle("address", e.target.value)}
              className={`${inputBase} px-3 py-[6px] text-[11px] flex-1`}
              placeholder="Bank Road, Super bazar complex, Ernakulam"
            />
          </div>

          {/* Supplier Name Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">Supplier:</label>
            <select
              value={supplier.supplierName || ""}
              onChange={(e) => handle("supplierName", e.target.value)}
              className={`${inputBase} px-2 py-[6px] text-[11px] w-[150px] bg-white`}
            >
              <option value="">Enter supplier name</option>
              {supplierNames.map((name, idx) => (
                <option key={idx} className="text-black">
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Paid Amount */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">P.Amount:</label>
            <input
              value={supplier.amountPaid || ""}
              onChange={(e) => handle("amountPaid", e.target.value)}
              className={`${inputBase} px-2 py-[6px] text-[11px] w-[90px] text-right`}
              placeholder="2500"
            />
          </div>

          {/* Balance */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-700">Balance:</label>
            <input
              value={supplier.balance || ""}
              onChange={(e) => handle("balance", e.target.value)}
              className={`${inputBase} px-2 py-[6px] text-[11px] w-[90px] text-right`}
              placeholder="4000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailsCard;
