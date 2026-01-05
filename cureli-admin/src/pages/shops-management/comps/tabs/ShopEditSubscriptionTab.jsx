import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Check,
  Star,
  Plus,
} from "lucide-react";
import DetailRow from "../../../../components/common/DetailRow";
import CustomPlanModal from "../CustomPlanModal";
import { getPlans, updateShopSubscription } from "../../../../api/cadminShops";

const ShopEditSubscriptionTab = ({ shop, onRefresh }) => {
  const currentSub = shop?.currentSubscription;

  // Plans data
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState(null);

  // Selected plan
  const [selectedPlanId, setSelectedPlanId] = useState(
    currentSub?.plan?.plan_id || ""
  );

  // Custom plan modal
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const dropdownTriggerRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch available plans on mount and when shop changes
  useEffect(() => {
    if (shop?.shop_id) {
      fetchPlans();
    }
  }, [shop?.shop_id]);

  // Track changes
  useEffect(() => {
    const originalPlanId = currentSub?.plan?.plan_id || "";
    setHasChanges(selectedPlanId !== originalPlanId && selectedPlanId !== "");
  }, [selectedPlanId, currentSub]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const response = await getPlans();
      const plansData =
        response.data?.data?.plans ||
        response.data?.data ||
        response.data?.plans ||
        [];

      const activePlans = Array.isArray(plansData)
        ? plansData.filter((p) => {
            // For CUSTOM plans: only include if created for THIS shop
            if (p.type === "CUSTOM") {
              return p.created_for_shop_id === shop?.shop_id;
            }
            
            // For PRE_MADE/standard plans: include if ACTIVE or legacy (no status)
            if (p.status === "ACTIVE" || !p.status) {
              return true;
            }
            
            return false;
          })
        : [];

      setPlans(activePlans);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setPlansError(err.response?.data?.message || "Failed to load plans");
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (dropdownTriggerRef.current) {
      const rect = dropdownTriggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300; // Approximate max height
      
      setDropdownPosition({
        top: spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleDropdownToggle = () => {
    if (!isDropdownOpen) {
      updateDropdownPosition();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectOption = (value) => {
    if (value === "custom") {
      setShowCustomPlanModal(true);
      setIsDropdownOpen(false);
    } else {
      setSelectedPlanId(value);
      setIsDropdownOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownTriggerRef.current && !dropdownTriggerRef.current.contains(e.target) &&
        dropdownMenuRef.current && !dropdownMenuRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

// Close on OUTSIDE scroll only, update position on resize
useEffect(() => {
  if (!isDropdownOpen) return;

  const handleScroll = (e) => {
    // Don't close if scrolling inside the dropdown menu
    if (dropdownMenuRef.current && dropdownMenuRef.current.contains(e.target)) {
      return;
    }
    setIsDropdownOpen(false);
  };
  
  const handleResize = () => updateDropdownPosition();

  window.addEventListener("scroll", handleScroll, true);
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("scroll", handleScroll, true);
    window.removeEventListener("resize", handleResize);
  };
}, [isDropdownOpen, updateDropdownPosition]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get plan name
  const getPlanName = (plan) => {
    if (!plan) return "N/A";
    return plan.name || "Unknown Plan";
  };

  // Format users/branches with unlimited handling
  const formatLimit = (value) => {
    if (value === -1) return "Unlimited";
    return value || "N/A";
  };

  // Handle custom plan created and activated
  const handleCustomPlanCreated = (newPlan) => {
    setPlans((prev) => [...prev, newPlan]);
    setSelectedPlanId(newPlan.plan_id);
    setShowCustomPlanModal(false);
    fetchPlans();
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
  const buildPlanOptions = () => {
    const preMadePlans = plans.filter(p => p.type !== "CUSTOM");
    const customPlans = plans.filter(p => p.type === "CUSTOM");
    
    const options = [];
    
    // Add PRE_MADE plans
    if (preMadePlans.length > 0) {
      options.push({ type: "header", label: "Standard Plans" });
      preMadePlans.forEach((p) => {
        options.push({
          type: "option",
          value: p.plan_id,
          label: getPlanName(p),
          sublabel: `${formatLimit(p.max_users)} users, ${formatLimit(p.max_branches)} branches`,
          isCustom: false,
        });
      });
    }
    
    // Add CUSTOM plans if any exist for this shop
    if (customPlans.length > 0) {
      options.push({ type: "header", label: "Custom Plans" });
      customPlans.forEach((p) => {
        options.push({
          type: "option",
          value: p.plan_id,
          label: getPlanName(p),
          sublabel: `${formatLimit(p.max_users)} users, ${formatLimit(p.max_branches)} branches`,
          isCustom: true,
        });
      });
    }
    
    // Add create custom option
    options.push({ type: "divider" });
    options.push({ 
      type: "action", 
      value: "custom", 
      label: "Create Custom Plan...",
    });
    
    return options;
  };

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
  
  // Get display label for dropdown trigger
  const getSelectedLabel = () => {
    if (!selectedPlanId) return null;
    if (selectedPlan) {
      return {
        name: getPlanName(selectedPlan),
        sublabel: `${formatLimit(selectedPlan.max_users)} users, ${formatLimit(selectedPlan.max_branches)} branches`,
        isCustom: selectedPlan.type === "CUSTOM",
      };
    }
    return null;
  };

  const selectedLabel = getSelectedLabel();

  // Render dropdown via portal
  const renderDropdown = () => {
    if (!isDropdownOpen || !dropdownPosition) return null;

    const options = buildPlanOptions();

    return createPortal(
      <div
        ref={dropdownMenuRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl py-2 overflow-hidden max-h-[300px] overflow-y-auto"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        {options.map((option, index) => {
          if (option.type === "header") {
            return (
              <div
                key={`header-${index}`}
                className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50"
              >
                {option.label}
              </div>
            );
          }

          if (option.type === "divider") {
            return (
              <div key={`divider-${index}`} className="my-2 border-t border-gray-100" />
            );
          }

          if (option.type === "action") {
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectOption(option.value)}
                className="w-full px-4 py-3 text-sm text-left flex items-center gap-2
                         text-indigo-600 hover:bg-indigo-50 transition-colors duration-150"
              >
                <Plus size={16} className="text-indigo-500" />
                <span className="font-medium">{option.label}</span>
              </button>
            );
          }

          const isSelected = selectedPlanId === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectOption(option.value)}
              className={`
                w-full px-4 py-3 text-sm text-left flex items-center justify-between
                transition-colors duration-150
                ${isSelected
                  ? "bg-indigo-50 text-indigo-900"
                  : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-2 min-w-0">
                {option.isCustom && (
                  <Star size={14} className="text-purple-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`font-medium truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                    {option.label}
                  </p>
                  <p className={`text-xs truncate ${isSelected ? "text-indigo-600" : "text-gray-500"}`}>
                    {option.sublabel}
                  </p>
                </div>
              </div>
              {isSelected && (
                <Check size={16} className="text-indigo-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>,
      document.body
    );
  };

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
              <DetailRow
                label="Current Plan"
                value={getPlanName(currentSub.plan)}
                isEditing={false}
              />
              <div className="flex flex-col gap-1 py-2">
                <label className="w-36 text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="px-4 py-2.5 rounded-lg bg-white border border-gray-200">
                  {getStatusBadge(currentSub.status, currentSub.is_active)}
                </div>
              </div>
              <DetailRow
                label="Start Date"
                value={formatDate(currentSub.start_date)}
                isEditing={false}
              />
              <DetailRow
                label="End Date"
                value={formatDate(currentSub.end_date)}
                isEditing={false}
              />
              <DetailRow
                label="Max Branches"
                value={formatLimit(currentSub.branch_limit_snapshot)}
                isEditing={false}
              />
              <DetailRow
                label="Max Users"
                value={formatLimit(currentSub.user_limit_snapshot)}
                isEditing={false}
              />
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
            <span className="text-xs text-indigo-500 font-normal ml-2">
              (Editable)
            </span>
          </h3>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span className="ml-2 text-gray-500">Loading plans...</span>
            </div>
          ) : plansError ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle size={32} className="mb-2 opacity-50" />
              <p className="text-sm">{plansError}</p>
              <button
                onClick={fetchPlans}
                className="mt-3 px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Selector - Custom Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Plan
                </label>
                <button
                  ref={dropdownTriggerRef}
                  type="button"
                  onClick={handleDropdownToggle}
                  className={`
                    w-full md:w-1/2 px-4 py-2.5 bg-white border rounded-lg text-left
                    flex items-center justify-between
                    transition-all duration-200
                    ${isDropdownOpen
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="min-w-0 flex-1">
                    {selectedLabel ? (
                      <div className="flex items-center gap-2">
                        {selectedLabel.isCustom && (
                          <Star size={14} className="text-purple-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-900 font-medium truncate text-sm">
                            {selectedLabel.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {selectedLabel.sublabel}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Select a plan...</span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`
                      text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2
                      ${isDropdownOpen ? "rotate-180 text-indigo-500" : ""}
                    `}
                  />
                </button>
                {renderDropdown()}
              </div>

              {/* Selected Plan Preview */}
              {selectedPlan && selectedPlanId !== currentSub?.plan?.plan_id && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                    New Plan Details
                    {selectedPlan.type === "CUSTOM" && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        Custom
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-indigo-600">Plan Name:</span>
                      <p className="font-medium text-indigo-900">
                        {getPlanName(selectedPlan)}
                      </p>
                    </div>
                    <div>
                      <span className="text-indigo-600">Max Users:</span>
                      <p className="font-medium text-indigo-900">
                        {formatLimit(selectedPlan.max_users)}
                      </p>
                    </div>
                    <div>
                      <span className="text-indigo-600">Max Branches:</span>
                      <p className="font-medium text-indigo-900">
                        {formatLimit(selectedPlan.max_branches)}
                      </p>
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
                <AlertTriangle
                  size={16}
                  className="text-amber-600 mt-0.5 shrink-0"
                />
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
                    ${
                      hasChanges && !saving
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
        shopId={shop?.shop_id}
        shopName={shop?.business_name}
      />
    </>
  );
};

export default ShopEditSubscriptionTab;