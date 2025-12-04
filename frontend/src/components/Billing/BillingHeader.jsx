// import { useState, useEffect } from "react";
// import { FiSave } from "react-icons/fi";

// const BillingHeader = ({ onSave, onSavePrint }) => {
//   const billNo = "123456";
//   const billedBy = "Amith";

//   const [currentTime, setCurrentTime] = useState("");
//   const [currentDate, setCurrentDate] = useState("");

//   useEffect(() => {
//     const updateClock = () => {
//       const now = new Date();

//       setCurrentTime(
//         now.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })
//       );

//       setCurrentDate(
//         now.toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "2-digit",
//           year: "2-digit",
//         })
//       );
//     };

//     updateClock();
//     const timer = setInterval(updateClock, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div className="w-full flex flex-col gap-1">
//       {/* ----------------- TOP ROW ----------------- */}
//       <div
//         className="
//           flex
//           flex-col sm:flex-row
//           justify-between
//           items-start sm:items-center
//           gap-2 sm:gap-3
//         "
//       >
//         {/* Left Section: Billed by / Date / Time */}
//         <div
//           className="
//             flex flex-wrap items-center
//             gap-x-4 sm:gap-x-6 gap-y-1
//             text-[11px] sm:text-sm text-gray-600
//           "
//         >
//           <span>
//             Billed by{" "}
//             <span className="font-medium text-gray-800">{billedBy}</span>
//           </span>

//           <span className="flex items-center">
//             Date :
//             <span
//               className="
//                 font-medium text-gray-800
//                 px-2 ml-1 py-1
//                 bg-gray-100 rounded
//                 text-[11px] sm:text-sm
//               "
//             >
//               {currentDate}
//             </span>
//           </span>

//           <span className="flex items-center">
//             Time :
//             <span
//               className="
//                 font-medium text-gray-800
//                 px-2 ml-1 py-1
//                 bg-gray-100 rounded
//                 text-[11px] sm:text-sm
//               "
//             >
//               {currentTime}
//             </span>
//           </span>
//         </div>

//         {/* Right Section: Buttons */}
//         <div
//           className="
//             flex flex-wrap
//             gap-2 sm:gap-3
//             justify-start sm:justify-end
//           "
//         >
//           <button
//             onClick={onSave}
//             className="
//               flex items-center justify-center gap-2
//               bg-[#000060] text-white
//               text-[11px] sm:text-sm
//               px-3 sm:px-4 py-1.5 sm:py-2
//               rounded-lg shadow-sm
//               hover:bg-[#000060d1] transition
//               w-full xs:w-auto sm:w-auto
//             "
//           >
//             <FiSave size={14} />
//             Save
//           </button>

//           <button
//             onClick={onSavePrint}
//             className="
//               bg-[#000060] text-white
//               text-[11px] sm:text-sm
//               px-3 sm:px-5 py-1.5 sm:py-2
//               rounded-lg shadow-sm
//               hover:bg-[#000060d1] transition
//               w-full xs:w-auto sm:w-auto
//             "
//           >
//             Save &amp; Print (F5)
//           </button>
//         </div>
//       </div>

//       {/* ----------------- SECOND ROW (Bill No) ----------------- */}
//       <h1
//         className="
//           text-[18px] sm:text-[20px] md:text-[22px]
//           font-bold text-[#000060]
//         "
//       >
//         Bill No : <span className="font-extrabold">{billNo}</span>
//       </h1>
//     </div>
//   );
// };

// export default BillingHeader;


// src/components/billing/BillingHeader.jsx
import { useState, useEffect } from "react";
import { Save, Printer, Clock, Calendar, User } from "lucide-react";

const BillingHeader = ({ onSave, onSavePrint }) => {
  const billNo = "123456";
  const billedBy = "Amith";
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

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

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 flex flex-col md:flex-row justify-between items-center gap-2">
      
      {/* LEFT */}
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-[#05015A] flex items-baseline gap-1">
            Bill No: <span className="font-extrabold text-xl">{billNo}</span>
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
        <button onClick={onSave} className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-gray-50 transition-all">
          <Save size={14} /> <span>Save</span>
        </button>

        <button onClick={onSavePrint} className="flex items-center gap-1 bg-[#05015A] text-white border border-transparent text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm hover:bg-[#060142] transition-all">
          <Printer size={14} /> <span>Save & Print</span>
          <span className="opacity-70 font-normal text-[10px]">(F5)</span>
        </button>
      </div>
    </div>
  );
};

export default BillingHeader;