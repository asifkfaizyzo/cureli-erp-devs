// // src/components/invoice/ViewInvoiceModal.jsx

// import { AnimatePresence, motion } from "framer-motion";
// import { X } from "lucide-react";
// import { useMenuStore } from "../../store/useMenuStore";

// const backdropVariants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1 },
// };

// const panelVariants = {
//   hidden: {
//     opacity: 0,
//     y: -12,
//     scale: 0.98,
//     transition: { duration: 0.18 },
//   },
//   visible: {
//     opacity: 1,
//     y: 0,
//     scale: 1,
//     transition: {
//       type: "spring",
//       stiffness: 500,
//       damping: 30,
//     },
//   },
//   exit: {
//     opacity: 0,
//     y: -6,
//     scale: 0.99,
//     transition: { duration: 0.18 },
//   },
// };

// const ViewInvoiceModal = ({ open, onClose, bill }) => {
//     const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
//   if (!bill) return null;

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           className="fixed inset-0 z-50 flex items-center justify-center px-4"
//           initial="hidden"
//           animate="visible"
//           exit="hidden"
//           variants={backdropVariants}
//           style={{ backdropFilter: "blur(4px)" }}
//         >
//           {/* Backdrop */}
//           <div
//             className="absolute inset-0 bg-black/40"
//             onClick={onClose}
//             aria-hidden="true"
//           />

//           {/* Modal Panel */}
//           <motion.div
//   className="
//     relative bg-white 
//     w-full max-w-5xl 
//     rounded-xl shadow-2xl 
//     overflow-auto 
//     max-h-[92vh]    /* ⬅ HEIGHT FIX */
//     p-3 
//     z-10
//   "
//   variants={panelVariants}
//   initial="hidden"
//   animate="visible"
//   exit="exit"
//   role="dialog"
//   aria-modal="true"
// >

//             {/* Close button */}
//             <button
//               onClick={onClose}
//               aria-label="Close invoice view"
//               className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
//             >
//               <X size={20} />
//             </button>

//             {/* HEADER */}
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
//                   <p>
//                     Billed by{" "}
//                     <span className="font-semibold ml-1">
//                       {bill.billedBy}
//                     </span>
//                   </p>

//                   <div className="flex items-center gap-2">
//                     <span>Date:</span>
//                     <span className="px-3 py-1 bg-white border rounded-md text-xs font-medium shadow-sm">
//                       {bill.date}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <span>Time:</span>
//                     <span className="px-3 py-1 bg-white border rounded-md text-xs font-medium shadow-sm">
//                       {bill.time}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-4">
//                   <h1 className="text-2xl font-semibold text-[#000060]">
//                     Bill No :
//                   </h1>
//                   <span className="px-4 py-2 bg-white border rounded-lg text-xl font-bold text-[#000060] shadow-sm">
//                     {bill.billNo}
//                   </span>
//                 </div>
//               </div>

//               {/* Print Button */}
//               <button className="bg-[#000060] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:brightness-110">
//                 🖨️ Print
//               </button>
//             </div>

//             {/* TABLE */}
// <div className="border rounded-xl p-3">
//   <table
//     className={`
//       w-full font-medium border-collapse transition-all duration-300
//       ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
//     `}
//   >
//     <thead>
//       <tr
//         className={`
//           bg-[#05015A] text-white transition-all duration-300
//           ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
//         `}
//       >
//         {[
//           "Sl.No",
//           "Product Name",
//           "Batch",
//           "Rate",
//           "Qty",
//           "Exp",
//           "Type",
//           "Category",
//           "Stock",
//           "Rack",
//           "Tax%",
//           "Tax Amt",
//           "Dis%",
//           "MRP",
//         ].map((h) => (
//           <th
//             key={h}
//             className={`${sidebarExpanded ? "text-[11px] py-1 px-1" : "text-[13px] py-2 px-2"} text-left`}
//           >
//             {h}
//           </th>
//         ))}
//       </tr>
//     </thead>

//     <tbody>
//       {bill.items.map((item, i) => (
//         <tr
//           key={i}
//           className={`
//             bg-[#F5F6FA] 
//             hover:bg-gray-100 
//             border-4 border-white rounded-xl 
//             transition-all duration-300
//             ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
//           `}
//         >
//           {/* SL.No */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {i + 1}
//           </td>

//           {/* Product Name */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.name}
//           </td>

//           {/* Batch */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.batch}
//           </td>

//           {/* Rate */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             ₹ {item.rate}
//           </td>

//           {/* Qty */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} text-center border-4 border-white rounded-xl`}>
//             {item.qty}
//           </td>

//           {/* Exp */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.exp}
//           </td>

//           {/* Type */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.type}
//           </td>

//           {/* Category */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.category}
//           </td>

//           {/* Stock */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} text-center border-4 border-white rounded-xl`}>
//             {item.stock}
//           </td>

//           {/* Rack */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.rack}
//           </td>

//           {/* Tax% */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} text-center border-4 border-white rounded-xl`}>
//             {item.tax}%
//           </td>

//           {/* Tax Amount */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.taxAmt}
//           </td>

//           {/* Discount */}
//           <td className={`${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} border-4 border-white rounded-xl`}>
//             {item.disc}
//           </td>

//           {/* MRP */}
//           <td
//             className={`
//               ${sidebarExpanded ? "py-1 px-1" : "py-2 px-2"} 
//               border-4 border-white rounded-xl 
//               font-semibold
//             `}
//           >
//             ₹ {item.mrp}
//           </td>
//         </tr>
//       ))}
//     </tbody>
//   </table>
// </div>


//             {/* BOTTOM SECTION */}
//             <div className="mt-6 grid grid-cols-12 gap-4">
//               {/* CUSTOMER CARD */}
//               <div className="col-span-9 bg-[#F5F6FA] rounded-xl p-4">
//                 <div className="grid grid-cols-12 gap-y-4 gap-x-6 text-sm">
//                   {/* Cust ID */}
//                   <div className="col-span-3 flex items-center gap-2">
//                     <span className="font-medium">Cust ID :</span>
//                     <div className="bg-white border rounded-md px-3 py-1">
//                       {bill.customer.id}
//                     </div>
//                   </div>

//                   {/* Cust Name */}
//                   <div className="col-span-4 flex items-center gap-2">
//                     <span className="font-medium">Cust Name :</span>
//                     <div className="bg-white border rounded-md px-3 py-1">
//                       {bill.customer.name}
//                     </div>
//                   </div>

//                   {/* Phone */}
//                   <div className="col-span-3 flex items-center gap-2">
//                     <span className="font-medium">Cust Ph :</span>
//                     <div className="bg-white border rounded-md px-3 py-1">
//                       {bill.customer.phone}
//                     </div>
//                   </div>

//                   {/* e-Way */}
//                   <div className="col-span-2 flex items-center gap-2">
//                     <span className="font-medium">e-Way :</span>
//                     <div className="bg-white border rounded-md px-3 py-1">
//                       {bill.customer.eway}
//                     </div>
//                   </div>

//                   {/* Address */}
//                   <div className="col-span-12 flex items-center gap-2">
//                     <span className="font-medium">Address :</span>
//                     <div className="bg-white border rounded-md px-3 py-1 w-full">
//                       {bill.customer.address}
//                     </div>
//                   </div>

//                   {/* Doc Name */}
//                   <div className="col-span-4 flex items-center gap-2">
//                     <span className="font-medium">Doc Name :</span>
//                     <div className="bg-white border rounded-md px-3 py-1">
//                       {bill.customer.docName}
//                     </div>
//                   </div>

//                   {/* Pay by */}
//                   <div className="col-span-3 flex items-center gap-2">
//                     <span className="font-medium">Pay by :</span>
//                     <div className="bg-white border rounded-md px-3 py-1">
//                       {bill.customer.payment}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* TOTALS CARD */}
//               <div className="col-span-3 bg-[#F5F6FA] rounded-xl p-4 text-sm">
//                 <p className="flex justify-between mb-2">
//                   <span>Sub Total</span>
//                   <span>₹ {bill.summary.subTotal}</span>
//                 </p>
//                 <p className="flex justify-between mb-2">
//                   <span>SGST</span>
//                   <span>₹ {bill.summary.sgst}</span>
//                 </p>
//                 <p className="flex justify-between mb-4">
//                   <span>CGST</span>
//                   <span>₹ {bill.summary.cgst}</span>
//                 </p>

//                 <hr className="my-2" />

//                 <p className="flex justify-between text-lg font-semibold">
//                   <span>Total Amount:</span>
//                   <span>₹ {bill.summary.total}</span>
//                 </p>
//               </div>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// export default ViewInvoiceModal;


import { AnimatePresence, motion } from "framer-motion";
import { X, Printer, Calendar, Clock, User, MapPin, CreditCard, FileText } from "lucide-react";
import { useMenuStore } from "../../../../store/useMenuStore";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 25 } 
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const ViewInvoiceModal = ({ open, onClose, bill }) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  if (!bill) return null;

  // Dynamic Text Sizing based on sidebar state
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const labelSize = sidebarExpanded ? "text-[10px]" : "text-xs";
  
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative bg-white w-full max-w-6xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ring-1 ring-gray-200"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            
            {/* --- 1. MODAL HEADER (Fixed) --- */}
            <div className="flex justify-between items-start px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-xs">
                    <FileText size={14} />
                    <span>Tax Invoice</span>
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    #{bill.billNo}
                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                      Paid
                    </span>
                 </h1>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm">
                  <Printer size={16} />
                  <span>Print</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* --- 2. MODAL BODY (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              
              {/* Meta Data Bar */}
              <div className="flex flex-wrap gap-6 mb-8 text-sm text-gray-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                 <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-gray-500">Billed By:</span>
                    <span className="font-semibold text-gray-900">{bill.billedBy}</span>
                 </div>
                 <div className="w-px h-4 bg-blue-200 hidden sm:block"></div>
                 <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-gray-500">Date:</span>
                    <span className="font-semibold text-gray-900">{bill.date}</span>
                 </div>
                 <div className="w-px h-4 bg-blue-200 hidden sm:block"></div>
                 <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-gray-500">Time:</span>
                    <span className="font-semibold text-gray-900">{bill.time}</span>
                 </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="border rounded-lg overflow-hidden mb-8 shadow-sm ring-1 ring-gray-100">
                <table className={`w-full text-left border-collapse ${textSize}`}>
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      {["#", "Item Name", "Batch", "Rate", "Qty", "Exp", "Type", "Cat.", "Stk", "Rack", "Tax%", "Tax Amt", "Disc%", "MRP"].map((h, i) => (
                        <th key={i} className="px-3 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {bill.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{item.name}</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.batch}</td>
                        <td className="px-3 py-2.5 text-gray-900">₹{item.rate}</td>
                        <td className="px-3 py-2.5 font-semibold text-blue-600">{item.qty}</td>
                        <td className="px-3 py-2.5 text-red-500 text-[10px]">{item.exp}</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.type}</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.category}</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.stock}</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.rack}</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.tax}%</td>
                        <td className="px-3 py-2.5 text-gray-500">{item.taxAmt}</td>
                        <td className="px-3 py-2.5 text-green-600">{item.disc}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-900">₹{item.mrp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FOOTER INFO GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Customer Details */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                    <User size={16} /> Customer Details
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    <DetailItem label="Customer ID" value={bill.customer.id} size={labelSize} />
                    <DetailItem label="Name" value={bill.customer.name} size={labelSize} />
                    <DetailItem label="Phone" value={bill.customer.phone} size={labelSize} />
                    <DetailItem label="Doctor" value={bill.customer.docName} size={labelSize} />
                    <DetailItem label="Payment Mode" value={bill.customer.payment} size={labelSize} />
                    <DetailItem label="E-Way Bill" value={bill.customer.eway || "-"} size={labelSize} />
                    
                    <div className="col-span-2 md:col-span-3 mt-2 pt-2 border-t border-gray-200">
                      <div className="flex gap-2 items-start text-gray-600">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className={`${textSize} leading-snug`}>{bill.customer.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                    <CreditCard size={16} /> Payment Summary
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Sub Total</span>
                      <span className="font-medium text-gray-900">₹{bill.summary.subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>SGST</span>
                      <span className="font-medium text-gray-900">₹{bill.summary.sgst}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>CGST</span>
                      <span className="font-medium text-gray-900">₹{bill.summary.cgst}</span>
                    </div>
                    
                    <div className="border-t border-dashed border-gray-300 my-2"></div>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-[#000060]">₹{bill.summary.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper Component for Customer Details
const DetailItem = ({ label, value, size }) => (
  <div className="flex flex-col">
    <span className={`${size} uppercase text-gray-400 font-semibold tracking-wider`}>{label}</span>
    <span className="text-sm font-medium text-gray-800 mt-0.5">{value}</span>
  </div>
);

export default ViewInvoiceModal;