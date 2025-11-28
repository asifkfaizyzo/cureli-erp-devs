import { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import success from "../../assets/icons/cureli.png";

const TopHeader = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="
        fixed top-0 left-0 right-0
        h-16 bg-white border-b border-gray-200
        flex items-center justify-between
        /* ✅ responsive padding */
        px-3 sm:px-4 md:px-5 lg:px-6
        z-50
        overflow-hidden
      "
    >
      {/* ✅ LEFT SECTION RESPONSIVE */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-3.5 lg:gap-4">
        <img
          src={success}
          alt="success"
          /* ✅ responsive size only */
          className="w-9 sm:w-12 md:w-12.5 lg:w-13 h-8 sm:h-10 md:h-11 lg:h-12 mb-1.5 sm:mb-2"
        />
        <span
          /* ✅ Cureli text scales responsively */
          className="font-bold text-[#000060] mb-[2%] ml-[-8%]
            text-[clamp(18px,4vw,34px)]
            sm:text-[clamp(20px,3.8vw,36px)]
            md:text-[clamp(22px,3.2vw,38px)]
            lg:text-[clamp(26px,2.5vw,42px)]
            xl:text-[clamp(30px,2vw,48px)]
          "
        >
          Cureli
        </span>
      </div>

      {/* ✅ RIGHT SECTION RESPONSIVE */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">

        {/* Live time responsive */}
        <div
          className="text-gray-600 font-medium
            text-[clamp(10px,2.5vw,14px)] sm:text-sm md:text-base lg:text-lg"
        >
          {time}
        </div>

        {/* Bell button responsive */}
        <button className="relative p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-gray-100 rounded-full transition">
          <FiBell className="text-gray-600 text-[clamp(12px,2.5vw,18px)] sm:text-lg md:text-xl" size={16} />
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile button responsive */}
        <button className="flex items-center gap-2 sm:gap-3 md:gap-3.5 lg:gap-4 hover:bg-gray-100 p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg transition">
          <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-gray-300 overflow-hidden"></div>

          <div className="leading-tight text-left">
            <p className="font-semibold text-gray-800 text-[clamp(9px,2vw,13px)] sm:text-xs md:text-sm lg:text-base">James Philip</p>
            <p className="text-gray-500 text-[clamp(8px,1.8vw,12px)] sm:text-[11px] md:text-[12px] lg:text-sm">Manager</p>
          </div>
        </button>

      </div>
    </header>
  );
};

export default TopHeader;
