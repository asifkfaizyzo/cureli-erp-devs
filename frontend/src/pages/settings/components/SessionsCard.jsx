// src/pages/settings/components/SessionsCard.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Monitor,
  Smartphone,
  Globe,
  LogOut,
  Loader2,
  CheckCircle,
} from "lucide-react";

import { logoutSession, logoutOtherSessions } from "../../../api/profile";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

/**
 * SessionsCard
 * Displays active sessions with logout options
 */
const SessionsCard = ({ sessions = [], onUpdate }) => {
  const [logoutingId, setLogoutingId] = useState(null);
  const [logoutingAll, setLogoutingAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [error, setError] = useState(null);

  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo) return Monitor;
    const lower = deviceInfo.toLowerCase();
    if (lower.includes("android") || lower.includes("iphone") || lower.includes("ios")) {
      return Smartphone;
    }
    return Monitor;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleLogoutSession = async (sessionId) => {
    setLogoutingId(sessionId);
    setError(null);

    try {
      await logoutSession(sessionId);
      onUpdate();
    } catch (err) {
      console.error("Failed to logout session:", err);
      setError(err.response?.data?.message || "Failed to logout session");
    } finally {
      setLogoutingId(null);
    }
  };

  const handleLogoutAllOthers = async () => {
    setLogoutingAll(true);
    setError(null);

    try {
      await logoutOtherSessions();
      setShowLogoutAllConfirm(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to logout other sessions:", err);
      setError(err.response?.data?.message || "Failed to logout sessions");
    } finally {
      setLogoutingAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.is_current);
  const currentSession = sessions.find((s) => s.is_current);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-[#000060]" />
            <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
            <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
              {sessions.length}
            </span>
          </div>
          {otherSessions.length > 0 && (
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              disabled={logoutingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {logoutingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              Logout All Others
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active sessions found
            </div>
          ) : (
            <div className="space-y-3">
              {/* Current Session First */}
              {currentSession && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      {(() => {
                        const Icon = getDeviceIcon(currentSession.device_info);
                        return <Icon size={20} className="text-emerald-600" />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {currentSession.device_info || "Unknown Device"}
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-700 text-xs font-medium rounded-full">
                          <CheckCircle size={10} />
                          This Device
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Globe size={12} />
                          {currentSession.ip_address || "Unknown IP"}
                        </span>
                        <span>•</span>
                        <span>{formatTimeAgo(currentSession.last_active_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Sessions */}
              {otherSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_info);
                const isLoggingOut = logoutingId === session.id;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <DeviceIcon size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.device_info || "Unknown Device"}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Globe size={12} />
                            {session.ip_address || "Unknown IP"}
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(session.last_active_at)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLogoutSession(session.id)}
                      disabled={isLoggingOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogOut size={14} />
                      )}
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Logout All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
        onConfirm={handleLogoutAllOthers}
        title="Logout All Other Sessions?"
        message={
          <span>
            This will log you out from <strong>{otherSessions.length}</strong> other device
            {otherSessions.length > 1 ? "s" : ""}. You will remain logged in on this device.
          </span>
        }
        confirmText="Logout All Others"
        cancelText="Cancel"
        type="warning"
        loading={logoutingAll}
      />
    </>
  );
};

export default SessionsCard;