// cadmin/src/pages/Settings/comps/ChangePasswordModal.jsx

import { useState } from "react";
import { X, Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import { changePassword } from "../../../api/cadminProfile";

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const passwordChecks = [
    { label: "At least 8 characters", pass: form.newPassword.length >= 8 },
    { label: "Contains a number", pass: /\d/.test(form.newPassword) },
    {
      label: "Contains uppercase letter",
      pass: /[A-Z]/.test(form.newPassword),
    },
    { label: "Passwords match", pass: form.newPassword === form.confirmPassword && form.confirmPassword.length > 0 },
  ];

  const allValid =
    form.currentPassword.length > 0 &&
    passwordChecks.every((c) => c.pass);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.currentPassword) {
      setError("Current password is required");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      onClose("Password changed successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const PasswordInput = ({ label, field, showKey }) => (
    <div>
      <label className="text-xs font-medium text-gray-700 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPasswords[showKey] ? "text" : "password"}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] outline-none"
        />
        <button
          type="button"
          onClick={() =>
            setShowPasswords((prev) => ({
              ...prev,
              [showKey]: !prev[showKey],
            }))
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          {showPasswords[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[#000060]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Change Password
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
          <PasswordInput
            label="Current Password"
            field="currentPassword"
            showKey="current"
          />

          <PasswordInput
            label="New Password"
            field="newPassword"
            showKey="new"
          />

          <PasswordInput
            label="Confirm New Password"
            field="confirmPassword"
            showKey="confirm"
          />

          {/* Password strength checks */}
          {form.newPassword.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {passwordChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      check.pass
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Check size={10} />
                  </div>
                  <span
                    className={
                      check.pass ? "text-green-700" : "text-gray-500"
                    }
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}

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
              disabled={saving || !allValid}
              className="px-4 py-2 text-sm font-medium text-white bg-[#000060] hover:bg-[#000080] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;