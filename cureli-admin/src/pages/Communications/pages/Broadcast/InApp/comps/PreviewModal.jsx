// src/pages/Communications/pages/Broadcast/InApp/comps/PreviewModal.jsx
import { Eye, X, Building2, Users, Shield, UserCog, Calendar, Link2 } from "lucide-react";

function PreviewModal({ data, formData, onClose }) {
  const { total, by_type, by_shop, by_role, filters_applied } = data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold">Broadcast Preview</h3>
              <p className="text-white/70 text-xs">{formData.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            
            {/* Left: Recipient Summary */}
            <div className="space-y-4">
              {/* Total Count */}
              <div className="bg-gradient-to-br from-[#05015A] to-[#0a0280] rounded-xl p-5 text-center">
                <div className="text-5xl font-bold text-white mb-1">{total}</div>
                <div className="text-white/80 text-sm">Total Recipients</div>
              </div>

              {/* By Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">ERP Users</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{by_type?.users || 0}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-800">CAdmins</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">{by_type?.cadmins || 0}</div>
                </div>
              </div>

              {/* By Role */}
              {by_role && Object.keys(by_role).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog size={14} className="text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">By Role</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(by_role).map(([role, count]) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                      >
                        <span className="text-gray-600">{role}:</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Message Preview & Shop Breakdown */}
            <div className="space-y-4">
              {/* Message Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Message Preview</h4>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <h5 className="font-semibold text-gray-900 mb-1">{formData.title}</h5>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.message}</p>
                  
                  {/* Attachments */}
                  {formData.attachments?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {formData.attachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          <Link2 size={10} />
                          {att.label || att.type}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  {formData.action_url && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium">
                        {formData.action_label || "View Details"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shop Breakdown */}
              {by_shop && Object.keys(by_shop).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={14} className="text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Recipients by Shop ({Object.keys(by_shop).length})
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {Object.entries(by_shop).map(([shopId, data]) => (
                      <div
                        key={shopId}
                        className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-gray-100"
                      >
                        <span className="text-xs text-gray-700 truncate flex-1">
                          {data.name || `Shop ${shopId.slice(0, 8)}...`}
                        </span>
                        <span className="text-xs font-medium text-indigo-600 ml-2">
                          {data.count} users
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewModal;