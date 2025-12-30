// frontend\src\pages\settings\plans\UpgradePlanPage.jsx

import { motion } from "framer-motion";
import { CreditCard, Zap, TrendingUp, Shield } from "lucide-react";

/**
 * UpgradePlanPage
 * Placeholder upgrade plan page (SA only)
 */
const UpgradePlanPage = () => {
  return (
    <div className="h-full flex flex-col gap-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#000060] flex items-center gap-2">
          <CreditCard size={24} />
          Upgrade Plan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage your subscription
        </p>
      </div>

      {/* Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            <Zap size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            Plan management is under development. Soon you'll be able to:
          </p>
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 text-gray-700">
              <TrendingUp size={18} className="text-amber-500" />
              <span>Upgrade to higher plans</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <CreditCard size={18} className="text-amber-500" />
              <span>Manage billing information</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Shield size={18} className="text-amber-500" />
              <span>View usage and limits</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            For plan changes, please contact support at{" "}
            <a
              href="mailto:support@cureli.com"
              className="text-[#000060] font-medium hover:underline"
            >
              support@cureli.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradePlanPage;