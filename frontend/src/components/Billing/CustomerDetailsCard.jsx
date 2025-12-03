const CustomerDetailsCard = ({ customer, setCustomer }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-xs flex-1">

      <div className="grid grid-cols-12 gap-3 mb-1">

        {/* CUST ID READ ONLY */}
        <div className="col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">Cust ID</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
            value={customer.id}
            readOnly
          />
        </div>

        {/* Cust Name */}
        <div className="col-span-5">
          <label className="block text-[11px] text-gray-500 mb-1">Cust Name</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Enter Customer Name"
            value={customer.name || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        {/* Phone */}
        <div className="col-span-3">
          <label className="block text-[11px] text-gray-500 mb-1">Cust Ph</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Phone Number"
            value={customer.phone || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        {/* eWay Optional */}
        <div className="col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">e-Way</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Optional"
            value={customer.eway || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, eway: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 items-center">
        <div className="col-span-8">
          <label className="block text-[11px] text-gray-500 mb-1">Address</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Customer Address"
            value={customer.address || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="col-span-4">
          <label className="block text-[11px] text-gray-500 mb-1">Payment Methods</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            value={customer.payment || "Cash"}
            onChange={(e) => setCustomer((prev) => ({ ...prev, payment: e.target.value }))}
          >
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
            <option>Credit</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsCard;

// import { User, Phone, MapPin, CreditCard, FileText, Hash } from "lucide-react";

// const CustomerDetailsCard = ({ customer, setCustomer }) => {
  
//   // Ultra-compact styles
//   const labelClass = "block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-0.5 ml-0.5";
//   const inputGroupClass = "relative group";
  
//   // Smaller Icon
//   const iconClass = "absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 group-focus-within:text-[#05015A] transition-colors";
  
//   // Tighter Padding (py-1.5), Smaller Font (text-[11px]), Less Left Padding (pl-7)
//   const inputClass = "w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-[11px] font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#05015A] focus:ring-1 focus:ring-[#05015A]";

//   return (
//     <div className="h-full flex flex-col p-3">
      
//       <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
//         Customer Information
//       </h3>

//       <div className="flex-1 flex flex-col justify-center gap-2">

//         {/* ─── ROW 1 ─── */}
//         <div className="grid grid-cols-12 gap-2">
//           <div className="col-span-2">
//             <label className={labelClass}>ID</label>
//             <div className={inputGroupClass}>
//               <Hash className={iconClass} />
//               <input className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} value={customer.id} readOnly />
//             </div>
//           </div>
//           <div className="col-span-5">
//             <label className={labelClass}>Name</label>
//             <div className={inputGroupClass}>
//               <User className={iconClass} />
//               <input className={inputClass} placeholder="Name" value={customer.name || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))} />
//             </div>
//           </div>
//           <div className="col-span-3">
//             <label className={labelClass}>Phone</label>
//             <div className={inputGroupClass}>
//               <Phone className={iconClass} />
//               <input className={inputClass} placeholder="Mobile" value={customer.phone || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))} />
//             </div>
//           </div>
//           <div className="col-span-2">
//             <label className={labelClass}>E-Way</label>
//             <div className={inputGroupClass}>
//               <FileText className={iconClass} />
//               <input className={inputClass} placeholder="Opt" value={customer.eway || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, eway: e.target.value }))} />
//             </div>
//           </div>
//         </div>

//         {/* ─── ROW 2 ─── */}
//         <div className="grid grid-cols-12 gap-2">
//           <div className="col-span-8">
//             <label className={labelClass}>Address</label>
//             <div className={inputGroupClass}>
//               <MapPin className={iconClass} />
//               <input className={inputClass} placeholder="Full Billing Address" value={customer.address || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))} />
//             </div>
//           </div>
//           <div className="col-span-4">
//             <label className={labelClass}>Payment</label>
//             <div className={inputGroupClass}>
//               <CreditCard className={iconClass} />
//               <select className={`${inputClass} appearance-none cursor-pointer`} value={customer.payment || "Cash"} onChange={(e) => setCustomer((prev) => ({ ...prev, payment: e.target.value }))}>
//                 <option>Cash</option>
//                 <option>Card</option>
//                 <option>UPI</option>
//                 <option>Credit</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerDetailsCard;


// import { User, Phone, MapPin, CreditCard, FileText, Hash } from "lucide-react";

// const CustomerDetailsCard = ({ customer, setCustomer }) => {
  
//   /* ⭐ RESPONSIVE CLASSES ⭐
//      - text-[10px] on laptop -> text-xs on large screens
//      - py-1 on laptop -> py-2 on large screens
//   */
//   const labelClass = "block text-[9px] xl:text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-0.5 ml-0.5";
//   const inputGroupClass = "relative group";
//   const iconClass = "absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 xl:w-3.5 xl:h-3.5 text-gray-400 group-focus-within:text-[#05015A] transition-colors";
  
//   const inputClass = `
//     w-full pl-7 pr-2 
//     py-1 xl:py-2                   /* Taller input on big screens */
//     bg-gray-50 border border-gray-200 rounded 
//     text-[10px] xl:text-xs         /* Larger text on big screens */
//     font-medium text-gray-900 placeholder-gray-400 
//     outline-none transition-all 
//     focus:bg-white focus:border-[#05015A] focus:ring-1 focus:ring-[#05015A]
//   `;

//   return (
//     /* p-2 on laptop -> p-4 on big screens */
//     <div className="h-full flex flex-col p-2 xl:p-4">
      
//       <h3 className="text-[10px] xl:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 border-b border-gray-100 pb-1">
//         Customer Information
//       </h3>

//       <div className="flex-1 flex flex-col justify-center gap-1 xl:gap-3">

//         {/* ROW 1 */}
//         <div className="grid grid-cols-12 gap-2">
//           <div className="col-span-2">
//             <label className={labelClass}>ID</label>
//             <div className={inputGroupClass}>
//               <Hash className={iconClass} />
//               <input className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} value={customer.id} readOnly />
//             </div>
//           </div>
//           <div className="col-span-5">
//             <label className={labelClass}>Name</label>
//             <div className={inputGroupClass}>
//               <User className={iconClass} />
//               <input className={inputClass} placeholder="Name" value={customer.name || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))} />
//             </div>
//           </div>
//           <div className="col-span-3">
//             <label className={labelClass}>Phone</label>
//             <div className={inputGroupClass}>
//               <Phone className={iconClass} />
//               <input className={inputClass} placeholder="Mobile" value={customer.phone || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))} />
//             </div>
//           </div>
//           <div className="col-span-2">
//             <label className={labelClass}>E-Way</label>
//             <div className={inputGroupClass}>
//               <FileText className={iconClass} />
//               <input className={inputClass} placeholder="Opt" value={customer.eway || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, eway: e.target.value }))} />
//             </div>
//           </div>
//         </div>

//         {/* ROW 2 */}
//         <div className="grid grid-cols-12 gap-2">
//           <div className="col-span-8">
//             <label className={labelClass}>Address</label>
//             <div className={inputGroupClass}>
//               <MapPin className={iconClass} />
//               <input className={inputClass} placeholder="Full Billing Address" value={customer.address || ""} onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))} />
//             </div>
//           </div>
//           <div className="col-span-4">
//             <label className={labelClass}>Payment</label>
//             <div className={inputGroupClass}>
//               <CreditCard className={iconClass} />
//               <select className={`${inputClass} appearance-none cursor-pointer`} value={customer.payment || "Cash"} onChange={(e) => setCustomer((prev) => ({ ...prev, payment: e.target.value }))}>
//                 <option>Cash</option>
//                 <option>Card</option>
//                 <option>UPI</option>
//                 <option>Credit</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerDetailsCard;
