// src/pages/Communications/pages/Broadcast/Email/comps/EmailAudienceFilterPanel.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  CreditCard,
  Calendar,
  Shield,
  X,
  Search,
  ChevronDown,
  Check,
  Filter,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import StyledDateFilter from "../../../../../../components/common/StyledDateFilter";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

function EmailAudienceFilterPanel({
  filters,
  onChange,
  disabled,
  showUserFilters = true,
  showCAdminFilters = false,
  recipientPreview,
}) {
  // Data states
  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [cadminRoles, setCAdminRoles] = useState([]);

  // UI states
  const [shopSearch, setShopSearch] = useState("");
  const [loadingShops, setLoadingShops] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  // Selected values
  const [selectedShops, setSelectedShops] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedCAdminRoles, setSelectedCAdminRoles] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterMode, setFilterMode] = useState("OR"); // AND or OR

  const debouncedShopSearch = useDebounce(shopSearch, 300);

  // Load initial data
  useEffect(() => {
    loadPlans();
    loadCAdminRoles();
  }, []);

  // Load shops on search
  useEffect(() => {
    if (showUserFilters) {
      loadShops(debouncedShopSearch);
    }
  }, [debouncedShopSearch, showUserFilters]);

  const loadShops = async (search = "") => {
    setLoadingShops(true);
    try {
      const res = await emailBroadcastAPI.getShopsForFilter(search);
      if (res.data.success) {
        setShops(res.data.data.shops || []);
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoadingShops(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await emailBroadcastAPI.getActivePlans();
      if (res.data.success) {
        setPlans(res.data.data.plans || []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  const loadCAdminRoles = async () => {
    try {
      const res = await emailBroadcastAPI.getCAdminRoles();
      if (res.data.success) {
        setCAdminRoles(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load CAdmin roles:", err);
    }
  };

  const updateFilters = useCallback(
    (updates) => {
      const newFilters = { ...filters, ...updates };
      
      // Clean up empty arrays and null values
      Object.keys(newFilters).forEach((key) => {
        if (Array.isArray(newFilters[key]) && newFilters[key].length === 0) {
          delete newFilters[key];
        }
        if (newFilters[key] === "" || newFilters[key] === null) {
          delete newFilters[key];
        }
      });
      
      onChange(newFilters);
    },
    [filters, onChange]
  );

  const handleShopToggle = (shop) => {
    const isSelected = selectedShops.some((s) => s.shop_id === shop.shop_id);
    let newSelected = isSelected
      ? selectedShops.filter((s) => s.shop_id !== shop.shop_id)
      : [...selectedShops, shop];

    setSelectedShops(newSelected);
    updateFilters({ 
      shop_ids: newSelected.map((s) => s.shop_id),
      filter_mode: filterMode,
    });
  };

  const handlePlanToggle = (plan) => {
    const isSelected = selectedPlans.includes(plan.plan_id);
    let newSelected = isSelected
      ? selectedPlans.filter((id) => id !== plan.plan_id)
      : [...selectedPlans, plan.plan_id];

    setSelectedPlans(newSelected);
    updateFilters({ 
      plan_ids: newSelected,
      filter_mode: filterMode,
    });
  };

  const handleCAdminRoleToggle = (role) => {
    let newSelected = selectedCAdminRoles.includes(role)
      ? selectedCAdminRoles.filter((r) => r !== role)
      : [...selectedCAdminRoles, role];

    setSelectedCAdminRoles(newSelected);
    updateFilters({ cadmin_roles: newSelected });
  };

  const handleFilterModeToggle = () => {
    const newMode = filterMode === "OR" ? "AND" : "OR";
    setFilterMode(newMode);
    updateFilters({ filter_mode: newMode });
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    updateFilters({ registration_date_from: value || undefined });
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    updateFilters({ registration_date_to: value || undefined });
  };

  const clearAllFilters = () => {
    setSelectedShops([]);
    setSelectedPlans([]);
    setSelectedCAdminRoles([]);
    setDateFrom("");
    setDateTo("");
    setFilterMode("OR");
    onChange({});
  };

  const hasActiveFilters =
    selectedShops.length > 0 ||
    selectedPlans.length > 0 ||
    selectedCAdminRoles.length > 0 ||
    dateFrom ||
    dateTo;

  if (!showUserFilters && !showCAdminFilters) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        <Filter size={20} className="mx-auto mb-2 opacity-50" />
        Select an audience type above to configure filters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Filter Options
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {showUserFilters && (
        <div className="space-y-4">
          {/* Filter Mode Toggle - Only show when both shop and plan filters could apply */}
          {(selectedShops.length > 0 || selectedPlans.length > 0) && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xs font-medium text-blue-700">Filter Mode:</span>
              <button
                onClick={handleFilterModeToggle}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                {filterMode === "OR" ? (
                  <>
                    <ToggleLeft size={16} />
                    <span>OR</span>
                  </>
                ) : (
                  <>
                    <ToggleRight size={16} />
                    <span>AND</span>
                  </>
                )}
              </button>
              <span className="text-xs text-blue-600">
                {filterMode === "OR"
                  ? "Match shops OR plans (broader)"
                  : "Match shops AND plans (stricter)"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shops Dropdown */}
            <div className="relative">
              <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
                <Building2 size={12} />
                Shops
              </label>
              <button
                type="button"
                onClick={() => setShowShopDropdown(!showShopDropdown)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={selectedShops.length ? "text-gray-900" : "text-gray-400"}>
                  {selectedShops.length ? `${selectedShops.length} selected` : "All shops"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform duration-200 ${
                    showShopDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showShopDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowShopDropdown(false)}
                  />
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={shopSearch}
                          onChange={(e) => setShopSearch(e.target.value)}
                          placeholder="Search shops..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-1">
                      {loadingShops ? (
                        <div className="p-3 text-center text-xs text-gray-400">
                          Loading...
                        </div>
                      ) : shops.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-400">
                          No shops found
                        </div>
                      ) : (
                        shops.slice(0, 15).map((shop) => {
                          const isSelected = selectedShops.some(
                            (s) => s.shop_id === shop.shop_id
                          );
                          return (
                            <button
                              key={shop.shop_id}
                              onClick={() => handleShopToggle(shop)}
                              className={`w-full px-3 py-2 text-left text-xs rounded flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                isSelected ? "bg-[#05015A]/5" : ""
                              }`}
                            >
                              <div>
                                <span className="font-medium text-gray-900">
                                  {shop.business_name}
                                </span>
                                <span className="text-gray-400 ml-2">
                                  ({shop.owner_email})
                                </span>
                              </div>
                              {isSelected && <Check size={14} className="text-[#05015A]" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => setShowShopDropdown(false)}
                        className="w-full py-1.5 text-xs font-medium text-[#05015A] hover:bg-[#05015A]/5 rounded transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Selected tags */}
              {selectedShops.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedShops.slice(0, 3).map((shop) => (
                    <span
                      key={shop.shop_id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#05015A]/10 text-[#05015A] rounded text-[10px]"
                    >
                      {shop.business_name}
                      <button
                        onClick={() => handleShopToggle(shop)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {selectedShops.length > 3 && (
                    <span className="text-[10px] text-gray-400 py-0.5">
                      +{selectedShops.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Plans Dropdown */}
            <div className="relative">
              <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
                <CreditCard size={12} />
                Plans
              </label>
              <button
                type="button"
                onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={selectedPlans.length ? "text-gray-900" : "text-gray-400"}>
                  {selectedPlans.length ? `${selectedPlans.length} selected` : "All plans"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform duration-200 ${
                    showPlanDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showPlanDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPlanDropdown(false)}
                  />
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="max-h-40 overflow-y-auto p-1">
                      {plans.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-400">
                          No plans available
                        </div>
                      ) : (
                        plans.map((plan) => {
                          const isSelected = selectedPlans.includes(plan.plan_id);
                          return (
                            <button
                              key={plan.plan_id}
                              onClick={() => handlePlanToggle(plan)}
                              className={`w-full px-3 py-2 text-left text-xs rounded flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                isSelected ? "bg-[#05015A]/5" : ""
                              }`}
                            >
                              <span className="font-medium text-gray-900">{plan.name}</span>
                              {isSelected && <Check size={14} className="text-[#05015A]" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => setShowPlanDropdown(false)}
                        className="w-full py-1.5 text-xs font-medium text-[#05015A] hover:bg-[#05015A]/5 rounded transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Registration Date */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
                <Calendar size={12} />
                Shop Registration Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <StyledDateFilter
                  date={dateFrom}
                  setDate={handleDateFromChange}
                  placeholder="From"
                />
                <StyledDateFilter
                  date={dateTo}
                  setDate={handleDateToChange}
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAdmin Filters */}
      {showCAdminFilters && (
        <div className={`transition-all duration-200 ${showUserFilters ? "pt-4 border-t border-gray-100" : ""}`}>
          <label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5 block">
            <Shield size={12} />
            CAdmin Roles
          </label>
          <div className="flex flex-wrap gap-1.5">
            {cadminRoles.length === 0 ? (
              <span className="text-xs text-gray-400">Loading roles...</span>
            ) : (
              cadminRoles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleCAdminRoleToggle(role.value)}
                  disabled={disabled}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-150 disabled:opacity-50 ${
                    selectedCAdminRoles.includes(role.value)
                      ? "bg-[#05015A] border-[#05015A] text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {role.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recipients by Shop Preview */}
      {recipientPreview && Object.keys(recipientPreview.by_shop || {}).length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Building2 size={12} />
              Recipients by Shop
            </span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {Object.keys(recipientPreview.by_shop).length} shops
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {Object.entries(recipientPreview.by_shop)
              .slice(0, 9)
              .map(([shopId, shopData]) => (
                <div
                  key={shopId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-xs text-gray-700 truncate flex-1">
                    {shopData.name || `Shop`}
                  </span>
                  <span className="text-xs font-semibold text-[#05015A] ml-2">
                    {shopData.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailAudienceFilterPanel;