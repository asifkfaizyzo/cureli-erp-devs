import { useState, useEffect, useRef } from "react";
import { FiBell, FiChevronDown } from "react-icons/fi";
import success from "../../assets/icons/cureli.svg";

const TopHeader = () => {
  const [time, setTime] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔧 Set role here manually: "super-admin" | "branch-admin" | "staff"
  const [role] = useState("super-admin");

  const [branches] = useState([
    { id: "b1", name: "Kochi Main" },
    { id: "b2", name: "Kottayam Branch" },
    { id: "b3", name: "Thrissur Branch" },
  ]);

  const [selectedBranchId, setSelectedBranchId] = useState("b1");
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isProfileOpen]);

  const isSuperAdmin = role === "super-admin";

  const roleLabel =
    role === "super-admin"
      ? "Super Admin"
      : role === "branch-admin"
      ? "Branch Admin"
      : "Staff";

  // Reusable Branch Selector Component
  const BranchSelector = ({ compact = false }) => {
    if (isSuperAdmin) {
      return (
        <div className="relative">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className={`
              appearance-none
              ${compact ? "h-8 text-[11px] sm:text-xs" : "h-9 text-xs"}
              ${compact ? "pl-2 pr-7 sm:pl-3 sm:pr-8" : "pl-3 pr-8"}
              w-full
              rounded-lg
              border border-slate-200
              bg-gradient-to-b from-white to-slate-50
              text-slate-700 font-medium
              cursor-pointer
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              hover:border-slate-300 hover:shadow-sm
              transition-all duration-200
            `}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <FiChevronDown 
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 
              text-slate-400 pointer-events-none 
              ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}
            `} 
          />
        </div>
      );
    }

    return (
      <div
        className={`
          ${compact ? "h-8 px-2 sm:px-3 text-[11px] sm:text-xs" : "h-9 px-3 text-xs"}
          flex items-center gap-2
          rounded-lg
          border border-slate-200
          bg-slate-50
          text-slate-600 font-medium
          whitespace-nowrap
        `}
      >
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-none">
          {selectedBranch?.name || ""}
        </span>
      </div>
    );
  };

  return (
    <header
      className="
        fixed top-0 left-0 right-0
        h-16 md:h-[72px]
        bg-white/95 backdrop-blur-md
        border-b border-gray-200/80
        shadow-sm shadow-gray-100/50
        flex items-center justify-between
        px-4 sm:px-5 md:px-6 lg:px-8
        z-50
      "
    >
      {/* LEFT SECTION - Logo & Brand */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent rounded-xl opacity-60" />
          <img
            src={success}
            alt="Cureli Logo"
            className="
              relative z-10
              w-10 h-9
              sm:w-12 sm:h-10
              md:w-14 md:h-12
              object-contain
              drop-shadow-sm
            "
          />
        </div>

        <div className="flex flex-col">
          <span
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
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
        
        {/* Branch Selector - Left of Time */}
        <div className="hidden xs:block sm:block">
          <BranchSelector compact={true} />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

        {/* Live Time */}
        <div
          className="
            hidden sm:flex items-center gap-2
            px-3 py-1.5
            rounded-lg
            bg-slate-50/80
            border border-slate-100
          "
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-600 font-semibold tabular-nums text-sm md:text-base">
            {time}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

        {/* Notification Bell */}
        <button
          className="
            relative
            p-2 md:p-2.5
            rounded-xl
            bg-transparent hover:bg-gray-100
            border border-transparent hover:border-gray-200
            transition-all duration-200
            group
          "
        >
          <FiBell
            className="
              text-gray-500 group-hover:text-gray-700
              w-5 h-5 md:w-[22px] md:h-[22px]
              transition-colors duration-200
            "
          />
          <span
            className="
              absolute top-1.5 right-1.5 md:top-2 md:right-2
              flex items-center justify-center
              min-w-[18px] h-[18px]
              px-1
              text-[10px] font-bold text-white
              bg-red-500
              rounded-full
              ring-2 ring-white
              animate-pulse
            "
          >
            3
          </span>
        </button>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

        {/* Profile Button + DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen((o) => !o)}
            className="
              flex items-center gap-2 md:gap-3
              p-1.5 md:p-2
              rounded-xl
              bg-transparent hover:bg-gray-50
              border border-transparent hover:border-gray-200
              transition-all duration-200
              group
            "
          >
            {/* Avatar */}
            <div
              className="
                relative
                w-8 h-8 md:w-10 md:h-10
                rounded-xl
                bg-gradient-to-br from-gray-200 to-gray-300
                overflow-hidden
                ring-2 ring-white
                shadow-sm
              "
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-500 font-semibold text-sm md:text-base">
                  JP
                </span>
              </div>
              <span
                className="
                  absolute -bottom-0.5 -right-0.5
                  w-3 h-3
                  bg-green-500
                  rounded-full
                  ring-2 ring-white
                "
              />
            </div>

            {/* User Info */}
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="font-semibold text-gray-800 text-sm">
                James Philip
              </span>
              <span className="text-gray-500 text-xs">
                {roleLabel}
              </span>
            </div>

            <FiChevronDown
              className={`
                hidden md:block
                w-4 h-4 text-gray-400
                transition-transform duration-200
                ${isProfileOpen ? "rotate-180" : ""}
              `}
            />
          </button>

          {/* DROPDOWN PANEL */}
          {isProfileOpen && (
            <div
              className="
                absolute right-0 mt-2
                w-64
                bg-white
                border border-gray-200
                rounded-xl
                shadow-lg shadow-gray-200/60
                overflow-hidden
                z-50
                animate-in fade-in slide-in-from-top-2 duration-200
              "
            >
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/60">
                <p className="text-sm font-semibold text-gray-800">
                  James Philip
                </p>
                <p className="text-xs text-gray-500">
                  {roleLabel}
                </p>
              </div>

              {/* Branch / Role Controls */}
              <div className="px-4 py-3 space-y-2 text-sm">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Branch
                </p>
                <BranchSelector compact={false} />
              </div>

              {/* Actions */}
              <div className="px-4 py-2 border-t border-gray-100">
                <button 
                  className="
                    w-full text-left 
                    px-2 py-2 
                    text-xs text-gray-500 
                    hover:text-red-500 hover:bg-red-50 
                    rounded-md 
                    transition-colors duration-150
                  "
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;