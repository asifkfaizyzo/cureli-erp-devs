// src/pages/settings/ProfilePage.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

import PersonalInfoCard from "./comps/PersonalInfoCard";
import BusinessInfoCard from "./comps/BusinessInfoCard";
import SubscriptionCard from "./comps/SubscriptionCard";
import SessionsCard from "./comps/SessionsCard";

import { getProfile } from "../../../api/profile";

/**
 * ProfilePage
 * Super Admin profile settings page
 */
const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProfile();
      setProfileData(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load profile</h3>
            <p className="text-gray-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchProfile}
            className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { user, shop, subscription, sessions } = profileData;

  return (
    <div className="h-full overflow-auto p-1">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#000060]">Profile Settings</h1>
          <p className="text-gray-500 mt-1">
            Manage your account, business information, and security settings
          </p>
        </div>

        {/* Personal Information */}
        <PersonalInfoCard user={user} onUpdate={fetchProfile} />

        {/* Business Information */}
        <BusinessInfoCard shop={shop} onUpdate={fetchProfile} />

        {/* Subscription & Plan */}
        <SubscriptionCard subscription={subscription} />

        {/* Active Sessions */}
        <SessionsCard sessions={sessions} onUpdate={fetchProfile} />
      </motion.div>
    </div>
  );
};

export default ProfilePage;