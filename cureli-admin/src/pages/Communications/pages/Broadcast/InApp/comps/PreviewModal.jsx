// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/PreviewModal.jsx
import { Eye, X, Building2, Filter } from 'lucide-react';

function PreviewModal({ data, onClose }) {
  const { total, by_shop, filters_applied } = data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Eye size={20} className="text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">Recipient Preview</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Total Count */}
          <div className="bg-gradient-to-br from-[#05015A] to-[#0a0280] rounded-xl p-6 text-center">
            <div className="text-6xl font-bold text-white mb-2">{total}</div>
            <div className="text-white/80 text-sm font-medium uppercase tracking-wider">
              Total Recipients
            </div>
          </div>

          {/* Breakdown by Shop */}
          {Object.keys(by_shop).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 size={18} />
                <h4 className="font-semibold text-sm uppercase tracking-wide">
                  Breakdown by Shop
                </h4>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(by_shop).map(([shopId, count]) => (
                  <div
                    key={shopId}
                    className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors"
                  >
                    <span className="text-sm text-gray-600 font-mono">
                      {shopId.substring(0, 8)}...
                    </span>
                    <span className="text-sm font-semibold text-[#05015A]">
                      {count} user{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applied Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter size={18} />
              <h4 className="font-semibold text-sm uppercase tracking-wide">
                Applied Filters
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters_applied.shop_ids && (
                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                  {filters_applied.shop_ids.length} shop
                  {filters_applied.shop_ids.length !== 1 ? 's' : ''}
                </span>
              )}
              {filters_applied.plan_ids && (
                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                  {filters_applied.plan_ids.length} plan
                  {filters_applied.plan_ids.length !== 1 ? 's' : ''}
                </span>
              )}
              {filters_applied.registration_date_from && (
                <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                  From: {new Date(filters_applied.registration_date_from).toLocaleDateString()}
                </span>
              )}
              {filters_applied.registration_date_to && (
                <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                  To: {new Date(filters_applied.registration_date_to).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewModal;