// cadmin/src/pages/Settings/SettingsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Shield,
  Key,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

import ProfileCard from "./comps/ProfileCard";
import { getMyProfile } from "../../api/cadminProfile";
import { useToast } from "../../components/common/Toast";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  // Future tabs:
  // { id: "security", label: "Security", icon: Shield },
  // { id: "permissions", label: "Permissions", icon: Key },
];

const SettingsPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(
    async (showToast = false) => {
      try {
        if (!profileData) setLoading(true);
        else setRefreshing(true);

        setError(null);
        const res = await getMyProfile();
        const data = res.data?.data;
        setProfileData(data);

        if (showToast) {
          toast.success("Refreshed", "Profile data updated");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        const msg = err.response?.data?.message || "Failed to load profile";
        setError(msg);
        if (showToast) toast.error("Load Failed", msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profileData, toast],
  );

  useEffect(() => {
    fetchProfile(false);
  }, []); // eslint-disable-line

  const handleRefresh = () => fetchProfile(true);

  const handleUpdateSuccess = useCallback(
    (message) => {
      toast.success("Update Successful", message);
      fetchProfile(false);
    },
    [toast, fetchProfile],
  );

  // Loading state
  if (loading && !profileData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Error state (only on initial load)
  if (error && !profileData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to load settings
            </h3>
            <p className="text-gray-500 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="flex-shrink-0 px-1 py-3">
        <div className="flex items-center justify-between">
          {/* Title + Tabs */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-xs text-gray-500">
                  Manage your account and preferences
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white text-[#000060] shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === "profile" && profileData?.profile && (
            <ProfileCard
              profile={profileData.profile}
              onUpdate={handleUpdateSuccess}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;