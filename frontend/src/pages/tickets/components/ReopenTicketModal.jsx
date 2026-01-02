// frontend/src/pages/tickets/components/ReopenTicketModal.jsx

import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const ReopenTicketModal = ({ isOpen, onClose, ticket, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ FIXED: Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setLoading(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    // ✅ FIXED: Use toast instead of alert
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      console.error("Failed to reopen ticket:", err);
      setError(err.message || "Failed to reopen ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      {/* ✅ COMPACT HORIZONTAL LAYOUT */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <RotateCcw size={20} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Reopen Ticket</h3>
            <p className="text-sm text-gray-500">{ticket?.ticket_number}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5">
          <p className="text-sm text-gray-600 mb-3">
            Please explain why you need to reopen this ticket:
          </p>

          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            placeholder="e.g., Issue not fully resolved, problem persists..."
            maxLength={500}
            rows={3}
            disabled={loading}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          
          <div className="flex items-center justify-between mt-1">
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : (
              <p className="text-xs text-gray-500">Minimum 10 characters</p>
            )}
            <p className="text-xs text-gray-400">{reason.length}/500</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 10}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Reopening...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Reopen Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReopenTicketModal;