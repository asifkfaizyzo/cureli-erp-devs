// pharmacy-web/src/pages/marketplace-orders/components/RejectModal.jsx
// Change: add useEffect to reset form state whenever modal closes.
// Everything else unchanged.

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const REJECTION_REASONS = [
  { value: 'OUT_OF_STOCK',         label: 'Out of Stock'         },
  { value: 'PRESCRIPTION_INVALID', label: 'Prescription Invalid' },
  { value: 'STORE_CLOSED',         label: 'Store Closed'         },
  { value: 'OTHER',                label: 'Other'                },
];

const RejectModal = ({ open, onClose, onSubmit, isLoading, error }) => {
  const [reason,      setReason]      = useState('');
  const [reasonOther, setReasonOther] = useState('');

  // Reset form state whenever the modal closes — regardless of how it closes
  // (user clicks Cancel, clicks backdrop, or parent closes it programmatically
  // after a successful rejection).
  useEffect(() => {
    if (!open) {
      setReason('');
      setReasonOther('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    onSubmit(reason, reason === 'OTHER' ? reasonOther : '');
  };

  const handleClose = () => {
    // State reset is handled by the useEffect above on the next render
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d0a3a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">Reject Order</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-white/50">
            Select a reason for rejecting this order. The customer will be notified.
          </p>

          {/* Reason selection */}
          <div className="space-y-2">
            {REJECTION_REASONS.map((r) => (
              <label
                key={r.value}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
                  ${
                    reason === r.value
                      ? 'bg-red-500/15 border-red-500/30 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:border-white/20 hover:text-white/80'
                  }
                `}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    reason === r.value ? 'border-red-400' : 'border-white/20'
                  }`}
                >
                  {reason === r.value && (
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                  )}
                </div>
                <span className="text-sm font-medium">{r.label}</span>
              </label>
            ))}
          </div>

          {/* Other text */}
          {reason === 'OTHER' && (
            <textarea
              value={reasonOther}
              onChange={(e) => setReasonOther(e.target.value)}
              placeholder="Please describe the reason..."
              rows={3}
              required
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder-white/20 text-sm resize-none focus:outline-none focus:border-white/20 transition-colors"
            />
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-white/60 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isLoading || (reason === 'OTHER' && !reasonOther.trim())}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : null}
              Reject Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;