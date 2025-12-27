// src/pages/settings/ProfilePage.jsx

import { motion } from "framer-motion";
import { UserCircle, Settings, Lock, Bell } from "lucide-react";

/**
 * ProfilePage
 * Placeholder profile settings page
 */
const ProfilePage = () => {
  return (
    <div className="h-full flex flex-col gap-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#000060] flex items-center gap-2">
          <UserCircle size={24} />
          Profile Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#000060]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings size={40} className="text-[#000060]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            Profile settings are under development. Soon you'll be able to:
          </p>
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 text-gray-700">
              <UserCircle size={18} className="text-[#000060]" />
              <span>Update your personal information</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Lock size={18} className="text-[#000060]" />
              <span>Change your password</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Bell size={18} className="text-[#000060]" />
              <span>Manage notification preferences</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;