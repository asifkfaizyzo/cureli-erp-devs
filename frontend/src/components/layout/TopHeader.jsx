import { FiBell, FiClock } from "react-icons/fi";

const TopHeader = () => {
  return (
    <header className="h-16 w-full border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Left side – page title placeholder */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-800">Sales</span>
        <span className="mx-1">›</span>
        <span>Billing</span>
      </div>

      {/* Right side – time + profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiClock />
          <span>12:35 PM</span>
        </div>

        <button className="relative">
          <FiBell className="text-gray-500" size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden" />
          <div className="text-xs leading-tight">
            <p className="font-semibold text-gray-800">James Philip</p>
            <p className="text-gray-500">Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
