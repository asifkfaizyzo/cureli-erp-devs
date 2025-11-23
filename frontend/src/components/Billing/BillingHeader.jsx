import { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";

const BillingHeader = () => {
  const billNo = "123456";
  const billedBy = "Amith";

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
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

  return (
    <div className="w-full flex flex-col gap-1">

      {/* ----------------- TOP ROW ----------------- */}
      <div className="flex justify-between items-center">

        {/* Left Section: Billed by / Date / Time */}
        <div className="flex items-center gap-6 text-sm text-gray-600">

          <span>
            Billed by{" "}
            <span className="font-medium text-gray-800">{billedBy}</span>
          </span>

          <span className="flex items-center">
            Date :
            <span className="font-medium text-gray-800 px-2 ml-1 py-1 bg-gray-100 rounded text-sm">
              {currentDate}
            </span>
          </span>

          <span className="flex items-center">
            Time :
            <span className="font-medium text-gray-800 px-2 ml-1 py-1 bg-gray-100 rounded text-sm">
              {currentTime}
            </span>
          </span>
        </div>

        {/* Right Section: Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#000060] text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
            <FiSave size={14} />
            Save
          </button>

          <button className="bg-[#000060] text-white text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
            Save & Print (F5)
          </button>
        </div>
      </div>

      {/* ----------------- SECOND ROW (Bill No) ----------------- */}
      <h1 className="text-[22px] font-bold text-[#000060]">
        Bill No : <span className="font-extrabold">{billNo}</span>
      </h1>
    </div>
  );
};

export default BillingHeader;
