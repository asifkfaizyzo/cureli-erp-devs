// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/ConfirmSendModal.jsx
import { AlertTriangle, Send, X } from 'lucide-react';

function ConfirmSendModal({ title, message, recipientCount, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-300" />
              </div>
              <h3 className="text-white text-lg font-semibold">Confirm Send</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            You are about to send the following broadcast:
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <strong className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Title
              </strong>
              <p className="text-sm text-gray-900 font-medium">{title}</p>
            </div>

            <div>
              <strong className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Message
              </strong>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {message}
              </p>
            </div>

            {recipientCount !== null && (
              <div>
                <strong className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Recipients
                </strong>
                <p className="text-lg font-bold text-[#05015A]">
                  {recipientCount} user{recipientCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-amber-800 font-medium">
              This action cannot be undone. The notification will be sent immediately.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280] transition-all"
          >
            <Send size={18} />
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmSendModal;