import { useState, useEffect } from "react";
import { X, Users, GitBranch, Loader2, Sparkles, DollarSign, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { createCustomPlan, activatePlan } from "../../api/cadminShops";

const CustomPlanModal = ({ isOpen, onClose, onPlanCreated, shopName = "" }) => {
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxBranches, setMaxBranches] = useState(2);
  const [price, setPrice] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Create, 2: Activate
  const [createdPlan, setCreatedPlan] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPlanName("");
      setDescription("");
      setMaxUsers(10);
      setMaxBranches(2);
      setPrice(0);
      setError("");
      setStep(1);
      setCreatedPlan(null);
    }
  }, [isOpen]);

  // Auto-generate name and description
  useEffect(() => {
    if (!planName && maxUsers && maxBranches) {
      setPlanName(`Custom - ${maxUsers}U/${maxBranches}B`);
    }
    if (!description && maxUsers && maxBranches) {
      const shopPart = shopName ? ` for ${shopName}` : "";
      setDescription(`Custom plan with ${maxUsers} users and ${maxBranches} branches${shopPart}`);
    }
  }, [maxUsers, maxBranches, shopName]);

  const handleCreate = async () => {
    // Validation
    if (!planName.trim()) {
      setError("Plan name is required");
      return;
    }
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
        name: planName.trim(),
        description: description.trim() || `Custom plan with ${maxUsers} users and ${maxBranches} branches`,
        max_users: maxUsers,
        max_branches: maxBranches,
        price: price * 100, // Convert to paisa
      });

      const newPlan = response.data?.data || response.data;
      setCreatedPlan(newPlan);
      setStep(2); // Move to activation step
    } catch (err) {
      console.error("Failed to create custom plan:", err);
      setError(err.response?.data?.message || "Failed to create custom plan");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!createdPlan?.plan_id) return;

    setActivating(true);
    setError("");

    try {
      const response = await activatePlan(createdPlan.plan_id);
      const activatedPlan = response.data?.data || { ...createdPlan, status: "ACTIVE" };
      onPlanCreated(activatedPlan);
    } catch (err) {
      console.error("Failed to activate plan:", err);
      setError(err.response?.data?.message || "Failed to activate plan. You may need to activate it from the Subscription Plans page.");
    } finally {
      setActivating(false);
    }
  };

  const handleSkipActivation = () => {
    // Close modal without activating - plan remains as DRAFT
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !loading && !activating && onClose()}
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
                <h3 className="text-white font-semibold">
                  {step === 1 ? "Create Custom Plan" : "Activate Plan"}
                </h3>
                <p className="text-white/70 text-sm">
                  {step === 1 ? "Set custom limits for this shop" : "Make the plan available for use"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              disabled={loading || activating}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step 1: Create Plan */}
        {step === 1 && (
          <>
            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Plan Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="text-indigo-500" />
                  Plan Name
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                           transition-all"
                  placeholder="e.g., Custom - 10U/2B"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="text-indigo-500" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                           transition-all"
                  placeholder="Describe the plan..."
                />
              </div>

              {/* Max Users & Branches */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="text-indigo-500" />
                    Max Users
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
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <GitBranch size={16} className="text-indigo-500" />
                    Max Branches
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
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign size={16} className="text-indigo-500" />
                  Yearly Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 pl-8 border border-gray-200 rounded-xl text-lg font-medium
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all"
                    placeholder="0 for custom pricing"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Enter 0 for custom/negotiated pricing</p>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">This will create a DRAFT plan</p>
                  <p className="mt-0.5">You'll need to activate it in the next step to use it for this shop.</p>
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
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
          </>
        )}

        {/* Step 2: Activate Plan */}
        {step === 2 && createdPlan && (
          <>
            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Success Message */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-800">Plan Created Successfully!</p>
                  <p className="text-sm text-emerald-600 mt-0.5">"{createdPlan.name}" is now in DRAFT status</p>
                </div>
              </div>

              {/* Plan Preview */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-3">Plan Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{createdPlan.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium text-amber-600">DRAFT</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Users:</span>
                    <p className="font-medium">{createdPlan.max_users}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Branches:</span>
                    <p className="font-medium">{createdPlan.max_branches}</p>
                  </div>
                </div>
              </div>

              {/* Activation Warning */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700">
                  <p className="font-medium">Activate to use this plan</p>
                  <p className="mt-0.5">Once activated, this plan becomes <strong>immutable</strong> and cannot be edited.</p>
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
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button
                onClick={handleSkipActivation}
                disabled={activating}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Skip (Keep as Draft)
              </button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Activate & Use
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomPlanModal;