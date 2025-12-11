// src/components/Shops/tabs/ShopEditSubscriptionTab.jsx

import { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import DetailRow from "../../User/DetailRow";
import CustomPlanModal from "../CustomPlanModal";
import { getPlans, updateShopSubscription } from "../../../api/cadminShops";

const ShopEditSubscriptionTab = ({ shop, onRefresh }) => {
  const currentSub = shop?.currentSubscription;
  
  // Plans data
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Selected plan
  const [selectedPlanId, setSelectedPlanId] = useState(currentSub?.plan?.plan_id || "");
  
  // Custom plan modal
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);
  
  // Save state
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch available plans
  useEffect(() => {
    fetchPlans();
  }, []);

  // Track changes
  useEffect(() => {
    const originalPlanId = currentSub?.plan?.plan_id || "";
    setHasChanges(selectedPlanId !== originalPlanId && selectedPlanId !== "");
  }, [selectedPlanId, currentSub]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await getPlans();
      const plansData = response.data?.data || response.data || [];
      setPlans(plansData);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      // Use dummy plans if API fails
      setPlans([
        { plan_id: "basic", plan_name: "Basic", max_users: 5, max_branches: 1 },
        { plan_id: "standard", plan_name: "Standard", max_users: 15, max_branches: 3 },
        { plan_id: "premium", plan_name: "Premium", max_users: 50, max_branches: 10 },
      ]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Handle plan selection
  const handlePlanChange = (planId) => {
    if (planId === "custom") {
      setShowCustomPlanModal(true);
    } else {
      setSelectedPlanId(planId);
    }
  };

  // Handle custom plan created
  const handleCustomPlanCreated = (newPlan) => {
    setPlans((prev) => [...prev, newPlan]);
    setSelectedPlanId(newPlan.plan_id);
    setShowCustomPlanModal(false);
  };

  // Handle save subscription
  const handleSaveSubscription = async () => {
    if (!hasChanges || !selectedPlanId) return;

    setSaving(true);
    try {
      await updateShopSubscription(shop.shop_id, selectedPlanId);
      onRefresh?.();
    } catch (err) {
      console.error("Failed to update subscription:", err);
      alert(err.response?.data?.message || "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  };

  // Build plan options for dropdown
  const planOptions = [
    { value: "", label: "Select a plan..." },
    ...plans.map((p) => ({
      value: p.plan_id,
      label: `${p.plan_name} (${p.max_users} users, ${p.max_branches} branches)`,
    })),
    { value: "custom", label: "➕ Create Custom Plan..." },
  ];

  // Status badge for subscription
  const getStatusBadge = (status, isActive) => {
    if (isActive && status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle size={10} /> Active
        </span>
      );
    }
    if (status === "expired" || !isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle size={10} /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock size={10} /> {status}
      </span>
    );
  };

  // Get selected plan details
  const selectedPlan = plans.find((p) => p.plan_id === selectedPlanId);

  return (
    <>
      <div className="space-y-6">
        {/* Current Subscription - Read Only */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard size={16} />
            Current Subscription
          </h3>

          {currentSub ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <DetailRow label="Current Plan" value={currentSub.plan?.plan_name || "N/A"} isEditing={false} />
              <div className="flex flex-col gap-1 py-2">
                <label className="w-36 text-sm font-medium text-gray-500">Status</label>
                <div className="px-4 py-2.5 rounded-lg bg-white border border-gray-200">
                  {getStatusBadge(currentSub.status, currentSub.is_active)}
                </div>
              </div>
              <DetailRow label="Start Date" value={formatDate(currentSub.start_date)} isEditing={false} />
              <DetailRow label="End Date" value={formatDate(currentSub.end_date)} isEditing={false} />
              <DetailRow label="Max Branches" value={currentSub.branch_limit_snapshot || "N/A"} isEditing={false} />
              <DetailRow label="Max Users" value={currentSub.user_limit_snapshot || "N/A"} isEditing={false} />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
              <p>No active subscription</p>
            </div>
          )}
        </div>

        {/* Change Subscription */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={16} />
            Change Subscription
            <span className="text-xs text-indigo-500 font-normal ml-2">(Editable)</span>
          </h3>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span className="ml-2 text-gray-500">Loading plans...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow
                  label="Select New Plan"
                  value={selectedPlanId}
                  isEditing={true}
                  fieldName="plan_id"
                  type="select"
                  options={planOptions}
                  onChange={handlePlanChange}
                />
              </div>

              {/* Selected Plan Preview */}
              {selectedPlan && selectedPlanId !== currentSub?.plan?.plan_id && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-indigo-900 mb-2">New Plan Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-indigo-600">Plan Name:</span>
                      <p className="font-medium text-indigo-900">{selectedPlan.plan_name}</p>
                    </div>
                    <div>
                      <span className="text-indigo-600">Max Users:</span>
                      <p className="font-medium text-indigo-900">{selectedPlan.max_users}</p>
                    </div>
                    <div>
                      <span className="text-indigo-600">Max Branches:</span>
                      <p className="font-medium text-indigo-900">{selectedPlan.max_branches}</p>
                    </div>
                    <div>
                      <span className="text-indigo-600">Duration:</span>
                      <p className="font-medium text-indigo-900">1 Year</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Changing subscription will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Create a new subscription starting from today</li>
                    <li>Set expiry date to 1 year from now</li>
                    <li>End the current subscription (if any)</li>
                  </ul>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSubscription}
                  disabled={!hasChanges || saving}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${hasChanges && !saving
                      ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Update Subscription
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Plan Modal */}
      <CustomPlanModal
        isOpen={showCustomPlanModal}
        onClose={() => setShowCustomPlanModal(false)}
        onPlanCreated={handleCustomPlanCreated}
      />
    </>
  );
};

export default ShopEditSubscriptionTab;