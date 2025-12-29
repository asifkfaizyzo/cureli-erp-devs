// frontend/src/pages/tickets/components/CancelTicketModal.jsx

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cancelTicket } from "../../../api/tickets";

const CancelTicketModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      setError("Please provide a reason (at least 10 characters)");
      return;
    }

    setLoading(true);
    try {
      await cancelTicket(ticket.ticket_id, reason.trim());
      onSuccess();
      setReason("");
      setError("");
    } catch (err) {
      console.error("Failed to cancel ticket:", err);
      setError(err.response?.data?.message || "Failed to cancel ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Ticket</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ticket: {ticket.ticket_number}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to cancel this ticket? This action cannot be undone.
              Please provide a reason for cancellation.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explain why you're cancelling this ticket..."
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500/20 
                         resize-none ${error ? "border-red-500" : "border-gray-300"}`}
            />
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Minimum 10 characters ({reason.length}/500)
            </p>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Important Notice
                </p>
                <p className="text-xs text-amber-700">
                  Once cancelled, this ticket will be marked as closed. You can create a
                  new ticket if you need further assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg 
                         hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Keep Ticket
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg 
                         hover:bg-red-700 transition-all disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <X size={18} />
                  <span>Cancel Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelTicketModal;
