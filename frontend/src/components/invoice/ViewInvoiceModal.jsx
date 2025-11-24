// src/components/invoice/ViewInvoiceModal.jsx

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: 0.18 },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.99,
    transition: { duration: 0.18 },
  },
};

const ViewInvoiceModal = ({ open, onClose, bill }) => {
    const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  if (!bill) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          style={{ backdropFilter: "blur(4px)" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <motion.div
  className="
    relative bg-white 
    w-full max-w-5xl 
    rounded-xl shadow-2xl 
    overflow-auto 
    max-h-[92vh]    /* ⬅ HEIGHT FIX */
    p-3 
    z-10
  "
  variants={panelVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  role="dialog"
  aria-modal="true"
>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close invoice view"
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            {/* HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <p>
                    Billed by{" "}
                    <span className="font-semibold ml-1">
                      {bill.billedBy}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <span>Date:</span>
                    <span className="px-3 py-1 bg-white border rounded-md text-xs font-medium shadow-sm">
                      {bill.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Time:</span>
                    <span className="px-3 py-1 bg-white border rounded-md text-xs font-medium shadow-sm">
                      {bill.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-semibold text-[#000060]">
                    Bill No :
                  </h1>
                  <span className="px-4 py-2 bg-white border rounded-lg text-xl font-bold text-[#000060] shadow-sm">
                    {bill.billNo}
                  </span>
                </div>
              </div>

              {/* Print Button */}
              <button className="bg-[#000060] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:brightness-110">
                🖨️ Print
              </button>
            </div>

            {/* TABLE */}
<div className="border rounded-xl p-3">
  <table
    className={`
      w-full font-medium border-collapse transition-all duration-300
      ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
    `}
  >
    <thead>
      <tr
        className={`
          bg-[#05015A] text-white transition-all duration-300
          ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
        `}
      >
        {[
          "Sl.No",
          "Product Name",
          "Batch",
          "Rate",
          "Qty",
          "Exp",
          "Type",
          "Category",
          "Stock",
          "Rack",
          "Tax%",
          "Tax Amt",
          "Dis%",
          "MRP",
        ].map((h) => (
          <th
            key={h}
            className={`${sidebarExpanded ? "text-[11px] py-1 px-1" : "text-[13px] py-2 px-2"} text-left`}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {bill.items.map((item, i) => (
        <tr
          key={i}
          className={`
            bg-[#F5F6FA] 
            hover:bg-gray-100 
            border-4 border-white rounded-xl 
            transition-all duration-300
            ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
          `}
        >
          {/* SL.No */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {i + 1}
          </td>

          {/* Product Name */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.name}
          </td>

          {/* Batch */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.batch}
          </td>

          {/* Rate */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            ₹ {item.rate}
          </td>

          {/* Qty */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} text-center border-4 border-white rounded-xl`}>
            {item.qty}
          </td>

          {/* Exp */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.exp}
          </td>

          {/* Type */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.type}
          </td>

          {/* Category */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.category}
          </td>

          {/* Stock */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} text-center border-4 border-white rounded-xl`}>
            {item.stock}
          </td>

          {/* Rack */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.rack}
          </td>

          {/* Tax% */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} text-center border-4 border-white rounded-xl`}>
            {item.tax}%
          </td>

          {/* Tax Amount */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.taxAmt}
          </td>

          {/* Discount */}
          <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
            {item.disc}
          </td>

          {/* MRP */}
          <td
            className={`
              ${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} 
              border-4 border-white rounded-xl 
              font-semibold
            `}
          >
            ₹ {item.mrp}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


            {/* BOTTOM SECTION */}
            <div className="mt-6 grid grid-cols-12 gap-4">
              {/* CUSTOMER CARD */}
              <div className="col-span-9 bg-[#F5F6FA] rounded-xl p-4">
                <div className="grid grid-cols-12 gap-y-4 gap-x-6 text-sm">
                  {/* Cust ID */}
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="font-medium">Cust ID :</span>
                    <div className="bg-white border rounded-md px-3 py-1">
                      {bill.customer.id}
                    </div>
                  </div>

                  {/* Cust Name */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="font-medium">Cust Name :</span>
                    <div className="bg-white border rounded-md px-3 py-1">
                      {bill.customer.name}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="font-medium">Cust Ph :</span>
                    <div className="bg-white border rounded-md px-3 py-1">
                      {bill.customer.phone}
                    </div>
                  </div>

                  {/* e-Way */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="font-medium">e-Way :</span>
                    <div className="bg-white border rounded-md px-3 py-1">
                      {bill.customer.eway}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-span-12 flex items-center gap-2">
                    <span className="font-medium">Address :</span>
                    <div className="bg-white border rounded-md px-3 py-1 w-full">
                      {bill.customer.address}
                    </div>
                  </div>

                  {/* Doc Name */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="font-medium">Doc Name :</span>
                    <div className="bg-white border rounded-md px-3 py-1">
                      {bill.customer.docName}
                    </div>
                  </div>

                  {/* Pay by */}
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="font-medium">Pay by :</span>
                    <div className="bg-white border rounded-md px-3 py-1">
                      {bill.customer.payment}
                    </div>
                  </div>
                </div>
              </div>

              {/* TOTALS CARD */}
              <div className="col-span-3 bg-[#F5F6FA] rounded-xl p-4 text-sm">
                <p className="flex justify-between mb-2">
                  <span>Sub Total</span>
                  <span>₹ {bill.summary.subTotal}</span>
                </p>
                <p className="flex justify-between mb-2">
                  <span>SGST</span>
                  <span>₹ {bill.summary.sgst}</span>
                </p>
                <p className="flex justify-between mb-4">
                  <span>CGST</span>
                  <span>₹ {bill.summary.cgst}</span>
                </p>

                <hr className="my-2" />

                <p className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹ {bill.summary.total}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewInvoiceModal;
