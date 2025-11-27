// src/components/purchase/PurchaseHeader.jsx
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

const PurchaseHeader = ({ onSave, onSavePrint }) => {
  const purchaseId = "123456";

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // F5 → Save & Print
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

  return (
    <div className="w-full flex flex-col gap-1">

      {/* ---------------- TOP ROW ---------------- */}
      <div className="flex justify-between items-center">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-6 text-sm text-gray-600">

          <span>
            Billed by{" "}
            <span className="font-medium text-gray-800">Manager</span>
          </span>

          <span className="flex items-center">
            Date :
            <span className="font-medium text-gray-800 px-2 ml-1 py-[2px] bg-gray-100 rounded text-sm shadow-sm">
              {currentDate}
            </span>
          </span>

          <span className="flex items-center">
            Time :
            <span className="font-medium text-gray-800 px-2 ml-1 py-[2px] bg-gray-100 rounded text-sm shadow-sm">
              {currentTime}
            </span>
          </span>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-[#05015A] text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:bg-[#05015Ad1] transition"
          >
            <Save size={14} />
            Save
          </button>

          <button
            onClick={onSavePrint}
            className="bg-[#05015A] text-white text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-[#05015Ad1] transition"
          >
            Save & Print (F5)
          </button>
        </div>
      </div>

      {/* ---------------- SECOND ROW ---------------- */}
      <h1 className="text-[22px] font-bold text-[#05015A]">
        Purchase ID:{" "}
        <span className="font-extrabold">{purchaseId}</span>
      </h1>
    </div>
  );
};

export default PurchaseHeader;
