import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const AlertsBanner = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800">
            3 shops require urgent document verification
          </p>
          <p className="text-xs text-amber-600">
            Licenses expiring within 7 days
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors">
          Review Now
        </button>
        <button
          onClick={() => setVisible(false)}
          className="p-1 text-amber-600 hover:text-amber-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default AlertsBanner;