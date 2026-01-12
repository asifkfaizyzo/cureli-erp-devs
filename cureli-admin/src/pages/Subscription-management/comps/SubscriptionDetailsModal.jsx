import { X, Clock, Ban, CheckCircle } from "lucide-react";

export default function SubscriptionDetailsModal({ open, onClose, shop }) {
  if (!open || !shop) return null;

  const isSuspENDED = shop.status === "SUSPENDED";
  const isGrace = shop.status === "GRACE";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{shop.name}</h3>
            <p className="text-sm text-gray-500">Subscription details</p>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3 text-sm">
          <InfoRow label="Status" value={shop.status} />
          {shop.expires_at && <InfoRow label="Expires On" value={shop.expires_at} />}
          {shop.grace_expires_at && (
            <InfoRow label="Grace Ends" value={shop.grace_expires_at} />
          )}
          {shop.suspended_at && (
            <InfoRow label="Suspended On" value={shop.suspended_at} />
          )}
          {shop.reason && <InfoRow label="Reason" value={shop.reason} />}
          {shop.days_left !== undefined && (
            <InfoRow label="Days Remaining" value={shop.days_left} />
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          {isGrace && (
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded text-sm">
              <Clock size={14} />
              Extend Grace
            </button>
          )}

          {!isSuspENDED && (
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded text-sm">
              <Ban size={14} />
              Suspend Now
            </button>
          )}

          {isSuspENDED && (
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-sm">
              <CheckCircle size={14} />
              Reactivate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
