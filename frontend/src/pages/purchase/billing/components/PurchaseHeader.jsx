// src/components/purchase/PurchaseHeader.jsx
// import { useState, useEffect, useRef } from "react";
// import { Save, Printer, Clock, Calendar, User, Upload } from "lucide-react";

// const PurchaseHeader = ({ onSave, onSavePrint, onImportFile }) => {
//   const purchaseId = "123456";
//   const billedBy = "Manager";
//   const [time, setTime] = useState("");
//   const [date, setDate] = useState("");
//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     const update = () => {
//       const now = new Date();
//       setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
//       setDate(now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }));
//     };
//     update();
//     const t = setInterval(update, 1000);
//     return () => clearInterval(t);
//   }, []);

//   // F5 Shortcut
//   useEffect(() => {
//     const handleF5 = (e) => {
//       if (e.key === "F5") {
//         e.preventDefault();
//         onSavePrint();
//       }
//     };
//     window.addEventListener("keydown", handleF5);
//     return () => window.removeEventListener("keydown", handleF5);
//   }, [onSavePrint]);

//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       onImportFile(file);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   };

//   return (
//     <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 flex flex-col md:flex-row justify-between items-center gap-2">
      
//       {/* LEFT */}
//       <div className="flex flex-col gap-1 w-full md:w-auto">
//         <div className="flex items-center gap-2">
//           <h1 className="text-sm font-bold text-[#05015A] flex items-baseline gap-1">
//             Purchase ID: <span className="font-extrabold text-xl">{purchaseId}</span>
//           </h1>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-medium text-gray-600">
//             <User size={10} className="text-[#05015A]" />
//             <span>Billed by: <span className="text-gray-900 font-semibold">{billedBy}</span></span>
//           </div>
//           <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-medium text-indigo-700">
//             <Calendar size={10} /> <span>{date}</span>
//           </div>
//           <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-medium text-indigo-700">
//             <Clock size={10} /> <span>{time}</span>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT */}
//       <div className="flex items-center gap-2">
//         {/* File Import Button */}
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept=".csv,.xlsx,.xls"
//           onChange={handleFileChange}
//           className="hidden"
//           id="file-upload"
//         />
//         <label
//           htmlFor="file-upload"
//           className="flex items-center gap-1 bg-emerald-600 text-white border border-transparent text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
//         >
//           <Upload size={14} /> <span>Import CSV/xlxs</span>
//         </label>

//         <button 
//           onClick={onSave} 
//           className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-gray-50 transition-all"
//         >
//           <Save size={14} /> <span>Save</span>
//         </button>

//         <button 
//           onClick={onSavePrint} 
//           className="flex items-center gap-1 bg-[#05015A] text-white border border-transparent text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm hover:bg-[#060142] transition-all"
//         >
//           <Printer size={14} /> <span>Save & Print</span>
//           <span className="opacity-70 font-normal text-[10px]">(F5)</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default PurchaseHeader;



// src/components/purchase/PurchaseHeader.jsx
import { useRef } from "react";

const PurchaseHeader = ({ 
  onSave, 
  onSavePrint, 
  onImportFile,
  onExportExcel 
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-[#05015A] to-[#0a0280] rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-[#05015A] font-bold text-lg">Purchase Entry</h1>
          <p className="text-slate-500 text-xs">Manage your purchase invoices</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Import Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-200"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </button>

        {/* Export Button */}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-sm font-medium border border-emerald-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-1" />

        {/* Save Button */}
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#05015A] hover:bg-[#0a0280] text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save
        </button>

        {/* Save & Print Button */}
        <button
          onClick={onSavePrint}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-[#05015A] hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium border border-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Save & Print
        </button>
      </div>
    </div>
  );
};

export default PurchaseHeader;