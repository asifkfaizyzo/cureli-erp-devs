import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import success from "../../assets/icons/cureli.png";

const AdminHeader = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        h-16 bg-white border-b border-gray-200
        flex items-center justify-between
        px-4 sm:px-6 md:px-8
      "
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <img
          src={success}
          alt="Cureli"
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />

        <span
          className="
            font-bold text-[#000060]
            text-[clamp(20px,3vw,36px)]
            leading-none
          "
        >
          Cureli-admin
        </span>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4 sm:gap-6">

        {/* TIME */}
        <div
          className="
            text-gray-600 font-medium
            text-[clamp(12px,2vw,16px)]
          "
        >
          {time}
        </div>

        {/* BELL NOTIFICATION */}
        <button
          className="
            relative rounded-full p-2
            hover:bg-gray-100 transition
          "
        >
          <Bell size={20} className="text-gray-600" />
          <span
            className="
              absolute top-1 right-1
              w-2 h-2 bg-red-500 rounded-full
            "
          ></span>
        </button>

        {/* PROFILE */}
        <button
          className="
            flex items-center gap-3
            rounded-lg px-2 py-1.5
            hover:bg-gray-100 transition
          "
        >
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden" />

          <div className="leading-tight text-left hidden sm:block">
            <p className="font-semibold text-gray-800 text-sm">
              James Philip
            </p>
            <p className="text-gray-500 text-xs">Manager</p>
          </div>
        </button>

      </div>
    </header>
  );
};

export default AdminHeader;
