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


// import { useState, useEffect } from "react";
// // Using Lucide icons to match your Sidebar's icon set
// import { Save, Printer, Clock, Calendar, User } from "lucide-react";

// const BillingHeader = ({ onSave, onSavePrint }) => {
//   const billNo = "123456";
//   const billedBy = "Amith";

//   const [currentTime, setCurrentTime] = useState("");
//   const [currentDate, setCurrentDate] = useState("");

//   useEffect(() => {
//     const updateClock = () => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
//       setCurrentDate(now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }));
//     };
//     updateClock();
//     const timer = setInterval(updateClock, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
      
//       {/* LEFT: Bill No & Metadata */}
//       <div className="flex flex-col gap-1 w-full md:w-auto">
//         <div className="flex items-center gap-3">
//           <h1 className="text-xl font-bold text-[#05015A] tracking-tight">
//             Bill No: <span className="font-extrabold text-2xl">{billNo}</span>
//           </h1>
//         </div>

//         {/* Meta Tags Row */}
//         <div className="flex flex-wrap gap-2 mt-1">
//           {/* User Badge */}
//           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600">
//             <User size={12} className="text-[#05015A]" />
//             <span>Billed by: <span className="text-gray-900">{billedBy}</span></span>
//           </div>

//           {/* Date Badge */}
//           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-800">
//             <Calendar size={12} />
//             <span>{currentDate}</span>
//           </div>

//           {/* Time Badge */}
//           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-800">
//             <Clock size={12} />
//             <span>{currentTime}</span>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT: Action Buttons */}
//       <div className="flex items-center gap-2 w-full md:w-auto justify-end">
//         <button
//           onClick={onSave}
//           className="
//             flex items-center justify-center gap-2
//             bg-white border border-[#05015A] text-[#05015A]
//             text-sm font-medium px-4 py-2 rounded-lg
//             hover:bg-blue-50 transition-colors duration-200
//             focus:outline-none focus:ring-2 focus:ring-[#05015A] focus:ring-offset-1
//           "
//         >
//           <Save size={16} />
//           <span>Save</span>
//         </button>

//         <button
//           onClick={onSavePrint}
//           className="
//             flex items-center justify-center gap-2
//             bg-[#05015A] text-white
//             text-sm font-medium px-5 py-2 rounded-lg
//             shadow-lg shadow-blue-900/20
//             hover:bg-[#060142] hover:shadow-blue-900/30
//             transition-all duration-200 transform active:scale-95
//             focus:outline-none focus:ring-2 focus:ring-[#05015A] focus:ring-offset-1
//           "
//         >
//           <Printer size={16} />
//           <span>Save & Print</span>
//           <span className="hidden lg:inline ml-1 opacity-60 text-xs font-normal">(F5)</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default BillingHeader;