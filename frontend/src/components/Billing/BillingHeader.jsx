import { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";

const BillingHeader = ({ onSave, onSavePrint }) => {
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
      <div
        className="
          flex
          flex-col sm:flex-row
          justify-between
          items-start sm:items-center
          gap-2 sm:gap-3
        "
      >
        {/* Left Section: Billed by / Date / Time */}
        <div
          className="
            flex flex-wrap items-center
            gap-x-4 sm:gap-x-6 gap-y-1
            text-[11px] sm:text-sm text-gray-600
          "
        >
          <span>
            Billed by{" "}
            <span className="font-medium text-gray-800">{billedBy}</span>
          </span>

          <span className="flex items-center">
            Date :
            <span
              className="
                font-medium text-gray-800
                px-2 ml-1 py-1
                bg-gray-100 rounded
                text-[11px] sm:text-sm
              "
            >
              {currentDate}
            </span>
          </span>

          <span className="flex items-center">
            Time :
            <span
              className="
                font-medium text-gray-800
                px-2 ml-1 py-1
                bg-gray-100 rounded
                text-[11px] sm:text-sm
              "
            >
              {currentTime}
            </span>
          </span>
        </div>

        {/* Right Section: Buttons */}
        <div
          className="
            flex flex-wrap
            gap-2 sm:gap-3
            justify-start sm:justify-end
          "
        >
          <button
            onClick={onSave}
            className="
              flex items-center justify-center gap-2
              bg-[#000060] text-white
              text-[11px] sm:text-sm
              px-3 sm:px-4 py-1.5 sm:py-2
              rounded-lg shadow-sm
              hover:bg-[#000060d1] transition
              w-full xs:w-auto sm:w-auto
            "
          >
            <FiSave size={14} />
            Save
          </button>

          <button
            onClick={onSavePrint}
            className="
              bg-[#000060] text-white
              text-[11px] sm:text-sm
              px-3 sm:px-5 py-1.5 sm:py-2
              rounded-lg shadow-sm
              hover:bg-[#000060d1] transition
              w-full xs:w-auto sm:w-auto
            "
          >
            Save &amp; Print (F5)
          </button>
        </div>
      </div>

      {/* ----------------- SECOND ROW (Bill No) ----------------- */}
      <h1
        className="
          text-[18px] sm:text-[20px] md:text-[22px]
          font-bold text-[#000060]
        "
      >
        Bill No : <span className="font-extrabold">{billNo}</span>
      </h1>
    </div>
  );
};

export default BillingHeader;
