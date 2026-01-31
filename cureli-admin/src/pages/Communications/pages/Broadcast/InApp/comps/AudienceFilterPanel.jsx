// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/AudienceFilterPanel.jsx
import { useState, useEffect } from "react";
import { Users, Building2, CreditCard, Calendar } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";

function AudienceFilterPanel({ filters, onChange, disabled }) {
  const [filterMode, setFilterMode] = useState("shops"); // 'shops' | 'plans'
  const [selectedShops, setSelectedShops] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  // Load shops when search query changes
  useEffect(() => {
    if (filterMode === "shops") {
      loadShops(searchQuery);
    }
  }, [searchQuery, filterMode]);

  const loadPlans = async () => {
    try {
      const response = await broadcastAPI.getActivePlans();
      if (response.data.success) {
        setPlans(response.data.data.plans || []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  const loadShops = async (query = "") => {
    setLoading(true);
    try {
      const response = await broadcastAPI.searchShops(query, 1, 50);
      if (response.data.success) {
        setShops(response.data.data.shops || []);
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  };

  // Build filters object and notify parent
  useEffect(() => {
    const newFilters = {};

    if (filterMode === "shops" && selectedShops.length > 0) {
      newFilters.shop_ids = selectedShops;
    }

    if (filterMode === "plans" && selectedPlans.length > 0) {
      newFilters.plan_ids = selectedPlans;
    }

    if (dateFrom) newFilters.registration_date_from = dateFrom;
    if (dateTo) newFilters.registration_date_to = dateTo;

    onChange(newFilters);
  }, [filterMode, selectedShops, selectedPlans, dateFrom, dateTo, onChange]);

  const handleShopToggle = (shopId) => {
    setSelectedShops((prev) =>
      prev.includes(shopId)
        ? prev.filter((id) => id !== shopId)
        : [...prev, shopId],
    );
  };

  const handlePlanToggle = (planId) => {
    setSelectedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId],
    );
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center flex-shrink-0">
          <Users size={20} className="text-[#05015A]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Target Audience</h3>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 bg-gray-50 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setFilterMode("shops")}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            filterMode === "shops"
              ? "bg-white text-[#05015A] shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Building2 size={18} />
          Select Shops
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("plans")}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            filterMode === "plans"
              ? "bg-white text-[#05015A] shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <CreditCard size={18} />
          Select by Plan
        </button>
      </div>

      {/* Shops Selection */}
      {filterMode === "shops" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Search & Select Shops
          </label>
          <input
            type="text"
            placeholder="Search shops by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A] transition-all"
          />

          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                Loading shops...
              </p>
            ) : shops.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                No shops found
              </p>
            ) : (
              <div className="p-2 space-y-1">
                {shops.map((shop) => (
                  <label
                    key={shop.shop_id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedShops.includes(shop.shop_id)}
                      onChange={() => handleShopToggle(shop.shop_id)}
                      disabled={disabled}
                      className="w-4 h-4 text-[#05015A] rounded border-gray-300 focus:ring-[#05015A]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {shop.business_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {shop.city}, {shop.state}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedShops.length > 0 && (
            <p className="text-sm text-[#05015A] font-medium">
              {selectedShops.length} shop{selectedShops.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          )}
        </div>
      )}

      {/* Plans Selection */}
      {filterMode === "plans" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Select Plans
          </label>
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
            {plans.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                No active plans available
              </p>
            ) : (
              plans.map((plan) => (
                <label
                  key={plan.plan_id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlans.includes(plan.plan_id)}
                    onChange={() => handlePlanToggle(plan.plan_id)}
                    disabled={disabled}
                    className="w-4 h-4 text-[#05015A] rounded border-gray-300 focus:ring-[#05015A]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {plan.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{(plan.price / 100).toLocaleString()} /{" "}
                      {plan.billing_cycle_months} months
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>

          {selectedPlans.length > 0 && (
            <p className="text-sm text-[#05015A] font-medium">
              {selectedPlans.length} plan{selectedPlans.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          )}
        </div>
      )}

      {/* Date Range */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Calendar size={18} />
          Filter by Registration Date (Optional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-xs text-gray-500 mb-1"
            >
              From
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>
          <div>
            <label
              htmlFor="dateTo"
              className="block text-xs text-gray-500 mb-1"
            >
              To
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudienceFilterPanel;
