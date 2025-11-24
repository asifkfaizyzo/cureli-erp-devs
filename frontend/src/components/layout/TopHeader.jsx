import { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import success from "../../assets//icons/cureli.png";

const TopHeader = () => {
  const [time, setTime] = useState("");

  // Live clock updater
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
        px-6 z-50
      "
    >
      {/* LEFT: Cureli Logo */}
      <div className="flex items-center gap-3">
        <img
                            src={success}
                            alt="success"
                            className="w-12 h-10 mb-2"
                        />
        <span className="text-4xl mb-[2%] ml-[-8%] font-bold text-[#000060]">Cureli</span>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">

        {/* Live time */}
        <div className="text-sm text-gray-600 font-medium">
          {time}
        </div>

        {/* Bell button */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
          <FiBell className="text-gray-600" size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile button */}
        <button className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden"></div>

          <div className="text-xs leading-tight text-left">
            <p className="font-semibold text-gray-800">James Philip</p>
            <p className="text-gray-500">Manager</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
