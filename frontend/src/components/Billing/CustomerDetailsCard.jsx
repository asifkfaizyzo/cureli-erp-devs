// const CustomerDetailsCard = ({ customer, setCustomer }) => {
//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-xs flex-1">

//       <div className="grid grid-cols-12 gap-3 mb-1">

//         {/* CUST ID READ ONLY */}
//         <div className="col-span-2">
//           <label className="block text-[11px] text-gray-500 mb-1">Cust ID</label>
//           <input
//             className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
//             value={customer.id}
//             readOnly
//           />
//         </div>

//         {/* Cust Name */}
//         <div className="col-span-5">
//           <label className="block text-[11px] text-gray-500 mb-1">Cust Name</label>
//           <input
//             className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
//             placeholder="Enter Customer Name"
//             value={customer.name || ""}
//             onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
//           />
//         </div>

//         {/* Phone */}
//         <div className="col-span-3">
//           <label className="block text-[11px] text-gray-500 mb-1">Cust Ph</label>
//           <input
//             className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
//             placeholder="Phone Number"
//             value={customer.phone || ""}
//             onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
//           />
//         </div>

//         {/* eWay Optional */}
//         <div className="col-span-2">
//           <label className="block text-[11px] text-gray-500 mb-1">e-Way</label>
//           <input
//             className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
//             placeholder="Optional"
//             value={customer.eway || ""}
//             onChange={(e) => setCustomer((prev) => ({ ...prev, eway: e.target.value }))}
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-12 gap-3 items-center">
//         <div className="col-span-8">
//           <label className="block text-[11px] text-gray-500 mb-1">Address</label>
//           <input
//             className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
//             placeholder="Customer Address"
//             value={customer.address || ""}
//             onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
//           />
//         </div>

//         <div className="col-span-4">
//           <label className="block text-[11px] text-gray-500 mb-1">Payment Methods</label>
//           <select
//             className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
//             value={customer.payment || "Cash"}
//             onChange={(e) => setCustomer((prev) => ({ ...prev, payment: e.target.value }))}
//           >
//             <option>Cash</option>
//             <option>Card</option>
//             <option>UPI</option>
//             <option>Credit</option>
//           </select>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerDetailsCard;

// src/components/billing/CustomerDetailsCard.jsx
import { User, MapPin, CreditCard, Smartphone, Hash } from "lucide-react";

const CustomerDetailsCard = ({ customer, setCustomer }) => {
  const Label = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-1 mb-0.5 text-gray-500">
      <Icon size={10} />
      <span className="text-[9px] font-bold uppercase tracking-wider">{text}</span>
    </div>
  );

  const inputClasses = "w-full border border-gray-200 rounded px-2 py-1 text-[11px] font-medium text-gray-700 focus:outline-none focus:border-[#05015A] transition-all placeholder:text-gray-300 h-7";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col h-full overflow-hidden">
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
        <User size={12} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-700">Customer Details</h3>
      </div>

      <div className="p-2 flex flex-col justify-center h-full gap-1.5">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-2">
            <Label icon={Hash} text="ID" />
            <input className={`${inputClasses} bg-gray-50`} value={customer.id} readOnly />
          </div>
          <div className="col-span-5">
            <Label icon={User} text="Name" />
            <input className={inputClasses} placeholder="Name" value={customer.name || ""} onChange={(e) => setCustomer(prev => ({...prev, name: e.target.value}))} />
          </div>
          <div className="col-span-3">
            <Label icon={Smartphone} text="Phone" />
            <input className={inputClasses} placeholder="Mobile" value={customer.phone || ""} onChange={(e) => setCustomer(prev => ({...prev, phone: e.target.value}))} />
          </div>
          <div className="col-span-2">
            <Label icon={Hash} text="e-Way" />
            <input className={inputClasses} placeholder="Opt" value={customer.eway || ""} onChange={(e) => setCustomer(prev => ({...prev, eway: e.target.value}))} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8">
            <Label icon={MapPin} text="Address" />
            <input className={inputClasses} placeholder="Address" value={customer.address || ""} onChange={(e) => setCustomer(prev => ({...prev, address: e.target.value}))} />
          </div>
          <div className="col-span-4">
            <Label icon={CreditCard} text="Payment" />
            <select className={`${inputClasses} bg-white`} value={customer.payment} onChange={(e) => setCustomer(prev => ({...prev, payment: e.target.value}))}>
              <option>Cash</option><option>Card</option><option>UPI</option><option>Credit</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomerDetailsCard;