import { Pencil } from "lucide-react";

const ShopDetailRow = ({ label, value, isEditing }) => {
  return (
    <div className="flex items-center gap-4 py-2">
      {/* Label */}
      <label className="w-32 text-sm font-medium text-gray-500 flex-shrink-0">
        {label}
      </label>

      {/* Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          defaultValue={value}
          readOnly={!isEditing}
          className={`
            w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200
            ${isEditing 
              ? "bg-white border-2 border-indigo-500 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
              : "bg-white border border-gray-200 text-gray-700 cursor-default"
            }
          `}
        />
        {isEditing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Pencil size={14} className="text-indigo-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetailRow;