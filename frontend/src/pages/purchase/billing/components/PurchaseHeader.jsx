// src/components/purchase/PurchaseHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Save, Printer, Clock, Calendar, User, Upload } from "lucide-react";

const PurchaseHeader = ({ onSave, onSavePrint, onImportCSV }) => {
  const purchaseId = "123456";
  const billedBy = "Manager";
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  // F5 Shortcut
  useEffect(() => {
    const handleF5 = (e) => {
      if (e.key === "F5") {
        e.preventDefault();
        onSavePrint();
      }
    };
    window.addEventListener("keydown", handleF5);
    return () => window.removeEventListener("keydown", handleF5);
  }, [onSavePrint]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      // Reset input so same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 flex flex-col md:flex-row justify-between items-center gap-2">
      
      {/* LEFT */}
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-[#05015A] flex items-baseline gap-1">
            Purchase ID: <span className="font-extrabold text-xl">{purchaseId}</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-medium text-gray-600">
            <User size={10} className="text-[#05015A]" />
            <span>Billed by: <span className="text-gray-900 font-semibold">{billedBy}</span></span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-medium text-indigo-700">
            <Calendar size={10} /> <span>{date}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-medium text-indigo-700">
            <Clock size={10} /> <span>{time}</span>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {/* CSV Import Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="flex items-center gap-1 bg-emerald-600 text-white border border-transparent text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <Upload size={14} /> <span>Import CSV</span>
        </label>

        <button 
          onClick={onSave} 
          className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-gray-50 transition-all"
        >
          <Save size={14} /> <span>Save</span>
        </button>

        <button 
          onClick={onSavePrint} 
          className="flex items-center gap-1 bg-[#05015A] text-white border border-transparent text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm hover:bg-[#060142] transition-all"
        >
          <Printer size={14} /> <span>Save & Print</span>
          <span className="opacity-70 font-normal text-[10px]">(F5)</span>
        </button>
      </div>
    </div>
  );
};

export default PurchaseHeader;
