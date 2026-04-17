// cadmin/src/pages/Settings/comps/ChangePhoneModal.jsx

import { useState } from "react";
import { X, Phone, Loader2, AlertCircle } from "lucide-react";
import { updateMyProfile } from "../../../api/cadminProfile";

const ChangePhoneModal = ({ currentPhone, onClose }) => {
  const [phone, setPhone] = useState(currentPhone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!/^[6-9]/.test(phone)) {
      setError("Phone number must start with 6, 7, 8, or 9");
      return;
    }

    if (phone === currentPhone) {
      setError("New phone number is the same as current");
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile({ phone_number: phone });
      onClose("Phone number updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update phone number");
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
            <Phone size={18} className="text-[#000060]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Change Phone Number
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
          {currentPhone && (
            <div>
              <label className="text-xs font-medium text-gray-500">
                Current Phone
              </label>
              <p className="text-sm text-gray-700 mt-0.5">
                +91 {currentPhone.slice(0, 5)} {currentPhone.slice(5)}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              New Phone Number
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#000060]/20 focus-within:border-[#000060]">
              <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-300 select-none">
                +91
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit number"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
                autoFocus
              />
            </div>
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
              Update Phone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePhoneModal;