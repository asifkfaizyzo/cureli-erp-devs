// src/components/Shops/CustomPlanModal.jsx

import { useState } from "react";
import { X, Users, GitBranch, Loader2, Sparkles } from "lucide-react";
import { createCustomPlan } from "../../api/cadminShops";

const CustomPlanModal = ({ isOpen, onClose, onPlanCreated }) => {
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxBranches, setMaxBranches] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useState(() => {
    if (isOpen) {
      setMaxUsers(10);
      setMaxBranches(2);
      setError("");
    }
  }, [isOpen]);

  const handleCreate = async () => {
    // Validation
    if (maxUsers < 1 || maxUsers > 1000) {
      setError("Users must be between 1 and 1000");
      return;
    }
    if (maxBranches < 1 || maxBranches > 100) {
      setError("Branches must be between 1 and 100");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createCustomPlan({
        max_users: maxUsers,
        max_branches: maxBranches,
      });

      const newPlan = response.data?.data || response.data;
      onPlanCreated(newPlan);
    } catch (err) {
      console.error("Failed to create custom plan:", err);
      setError(err.response?.data?.message || "Failed to create custom plan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Generate plan name preview
  const planNamePreview = `Custom - ${maxUsers}U/${maxBranches}B`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Create Custom Plan</h3>
                <p className="text-white/70 text-sm">Set custom limits for this shop</p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Name Preview */}
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
            <p className="text-xs text-indigo-600 uppercase tracking-wider mb-1">Plan Name</p>
            <p className="text-lg font-bold text-indigo-900">{planNamePreview}</p>
          </div>

          {/* Max Users Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="text-indigo-500" />
              Maximum Users
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={maxUsers}
              onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-medium
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         transition-all"
              placeholder="Enter max users"
            />
            <p className="mt-1 text-xs text-gray-400">Minimum: 1, Maximum: 1000</p>
          </div>

          {/* Max Branches Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <GitBranch size={16} className="text-indigo-500" />
              Maximum Branches
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxBranches}
              onChange={(e) => setMaxBranches(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-medium
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         transition-all"
              placeholder="Enter max branches"
            />
            <p className="mt-1 text-xs text-gray-400">Minimum: 1, Maximum: 100</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <Users size={24} className="mx-auto text-indigo-500 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{maxUsers}</p>
              <p className="text-xs text-gray-500">Users</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <GitBranch size={24} className="mx-auto text-indigo-500 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{maxBranches}</p>
              <p className="text-xs text-gray-500">Branches</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={() => onClose()}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#0a0280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Create Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPlanModal;