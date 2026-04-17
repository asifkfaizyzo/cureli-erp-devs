// cadmin/src/pages/Settings/comps/ChangeEmailModal.jsx

import { useState } from "react";
import { X, Mail, Loader2, AlertCircle } from "lucide-react";
import { updateMyProfile } from "../../../api/cadminProfile";

const ChangeEmailModal = ({ currentEmail, onClose }) => {
  const [email, setEmail] = useState(currentEmail || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    if (trimmed === (currentEmail || "").toLowerCase()) {
      setError("New email is the same as current email");
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile({ email: trimmed });
      onClose("Email updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#000060]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Change Email
            </h3>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {currentEmail && (
            <div>
              <label className="text-xs font-medium text-gray-500">
                Current Email
              </label>
              <p className="text-sm text-gray-700 mt-0.5">{currentEmail}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              New Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter new email"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#000060] hover:bg-[#000080] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Update Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeEmailModal;