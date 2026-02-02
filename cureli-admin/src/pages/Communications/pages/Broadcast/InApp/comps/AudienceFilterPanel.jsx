// src/pages/Communications/pages/Broadcast/InApp/comps/AudienceFilterPanel.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Building2, CreditCard, Calendar, UserCog, Shield, 
  X, Search, ChevronDown, Save, Bookmark, Users
} from "lucide-react";
import StyledSelect from "../../../../../../components/common/StyledSelect";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

function AudienceFilterPanel({ 
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
  const [userRoles, setUserRoles] = useState([]);
  const [cadminRoles, setCAdminRoles] = useState([]);
  const [savedSegments, setSavedSegments] = useState([]);
  
  // UI states
  const [shopSearch, setShopSearch] = useState("");
  const [loadingShops, setLoadingShops] = useState(false);
  const [showSaveSegment, setShowSaveSegment] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  
  // Selected values (local state for multi-select)
  const [selectedShops, setSelectedShops] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedCAdminRoles, setSelectedCAdminRoles] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debouncedShopSearch = useDebounce(shopSearch, 300);

  // Load initial data
  useEffect(() => {
    loadPlans();
    loadUserRoles();
    loadCAdminRoles();
    loadSegments();
  }, []);

  // Load shops on search
  useEffect(() => {
    loadShops(debouncedShopSearch);
  }, [debouncedShopSearch]);

  // Sync local state with parent filters
  useEffect(() => {
    if (filters.shop_ids) {
      // Load shop details for selected IDs
      loadSelectedShopDetails(filters.shop_ids);
    }
    if (filters.plan_ids) setSelectedPlans(filters.plan_ids);
    if (filters.roles) setSelectedRoles(filters.roles);
    if (filters.cadmin_roles) setSelectedCAdminRoles(filters.cadmin_roles);
    if (filters.registration_date_from) setDateFrom(filters.registration_date_from);
    if (filters.registration_date_to) setDateTo(filters.registration_date_to);
  }, []);

  const loadShops = async (search = "") => {
    setLoadingShops(true);
    try {
      const res = await broadcastAPI.getShopsForFilter(search);
      if (res.data.success) {
        setShops(res.data.data.shops);
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoadingShops(false);
    }
  };

  const loadSelectedShopDetails = async (shopIds) => {
    // If we have shop IDs but no shop details, load them
    if (shopIds.length > 0 && selectedShops.length === 0) {
      try {
        const res = await broadcastAPI.getShopsForFilter("");
        if (res.data.success) {
          const allShops = res.data.data.shops;
          const selected = allShops.filter(s => shopIds.includes(s.shop_id));
          setSelectedShops(selected);
        }
      } catch (err) {
        console.error("Failed to load shop details:", err);
      }
    }
  };

  const loadPlans = async () => {
    try {
      const res = await broadcastAPI.getActivePlans();
      if (res.data.success) {
        setPlans(res.data.data.plans || res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  const loadUserRoles = async () => {
    try {
      const res = await broadcastAPI.getUserRoles();
      if (res.data.success) {
        setUserRoles(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  const loadCAdminRoles = async () => {
    try {
      const res = await broadcastAPI.getCAdminRoles();
      if (res.data.success) {
        setCAdminRoles(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load CAdmin roles:", err);
    }
  };

  const loadSegments = async () => {
    try {
      const res = await broadcastAPI.getSegments();
      if (res.data.success) {
        setSavedSegments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load segments:", err);
    }
  };

  // Update parent when local state changes
  const updateFilters = useCallback((updates) => {
    const newFilters = { ...filters, ...updates };
    
    // Clean up empty arrays
    Object.keys(newFilters).forEach(key => {
      if (Array.isArray(newFilters[key]) && newFilters[key].length === 0) {
        delete newFilters[key];
      }
      if (newFilters[key] === "" || newFilters[key] === null) {
        delete newFilters[key];
      }
    });
    
    onChange(newFilters);
  }, [filters, onChange]);

  const handleShopSelect = (shop) => {
    const isSelected = selectedShops.some(s => s.shop_id === shop.shop_id);
    let newSelected;
    
    if (isSelected) {
      newSelected = selectedShops.filter(s => s.shop_id !== shop.shop_id);
    } else {
      newSelected = [...selectedShops, shop];
    }
    
    setSelectedShops(newSelected);
    updateFilters({ shop_ids: newSelected.map(s => s.shop_id) });
  };

  const handleShopRemove = (shopId) => {
    const newSelected = selectedShops.filter(s => s.shop_id !== shopId);
    setSelectedShops(newSelected);
    updateFilters({ shop_ids: newSelected.map(s => s.shop_id) });
  };

  const handlePlanToggle = (planId) => {
    let newSelected;
    if (selectedPlans.includes(planId)) {
      newSelected = selectedPlans.filter(id => id !== planId);
    } else {
      newSelected = [...selectedPlans, planId];
    }
    setSelectedPlans(newSelected);
    updateFilters({ plan_ids: newSelected });
  };

  const handleRoleToggle = (role) => {
    let newSelected;
    if (selectedRoles.includes(role)) {
      newSelected = selectedRoles.filter(r => r !== role);
    } else {
      newSelected = [...selectedRoles, role];
    }
    setSelectedRoles(newSelected);
    updateFilters({ roles: newSelected });
  };

  const handleCAdminRoleToggle = (role) => {
    let newSelected;
    if (selectedCAdminRoles.includes(role)) {
      newSelected = selectedCAdminRoles.filter(r => r !== role);
    } else {
      newSelected = [...selectedCAdminRoles, role];
    }
    setSelectedCAdminRoles(newSelected);
    updateFilters({ cadmin_roles: newSelected });
  };

  const handleDateChange = (type, value) => {
    if (type === "from") {
      setDateFrom(value);
      updateFilters({ registration_date_from: value || undefined });
    } else {
      setDateTo(value);
      updateFilters({ registration_date_to: value || undefined });
    }
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) return;
    
    try {
      await broadcastAPI.createSegment({
        name: segmentName,
        filters: filters,
      });
      setShowSaveSegment(false);
      setSegmentName("");
      loadSegments();
    } catch (err) {
      console.error("Failed to save segment:", err);
    }
  };

  const handleLoadSegment = (segment) => {
    onChange(segment.filters);
    // Sync local state
    if (segment.filters.shop_ids) loadSelectedShopDetails(segment.filters.shop_ids);
    if (segment.filters.plan_ids) setSelectedPlans(segment.filters.plan_ids);
    if (segment.filters.roles) setSelectedRoles(segment.filters.roles);
  };

  const clearAllFilters = () => {
    setSelectedShops([]);
    setSelectedPlans([]);
    setSelectedRoles([]);
    setSelectedCAdminRoles([]);
    setDateFrom("");
    setDateTo("");
    onChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      {/* Saved Segments & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {savedSegments.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <Bookmark size={12} />
                Saved Segments
                <ChevronDown size={12} />
              </button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {savedSegments.map((seg) => (
                  <button
                    key={seg.segment_id}
                    onClick={() => handleLoadSegment(seg)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {seg.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <button
                onClick={() => setShowSaveSegment(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Save size={12} />
                Save as Segment
              </button>
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700"
              >
                <X size={12} />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Segment Input */}
      {showSaveSegment && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <input
            type="text"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="Segment name..."
            className="flex-1 px-3 py-1.5 text-sm border border-indigo-200 rounded-lg"
          />
          <button
            onClick={handleSaveSegment}
            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            onClick={() => setShowSaveSegment(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Grid - Horizontal layout */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* ERP User Filters */}
        {showUserFilters && (
          <>
            {/* Shop Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Building2 size={12} />
                Filter by Shops
              </label>
              
              {/* Selected Shops Tags */}
              {selectedShops.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedShops.map((shop) => (
                    <span
                      key={shop.shop_id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {shop.business_name}
                      <button
                        onClick={() => handleShopRemove(shop.shop_id)}
                        className="hover:text-blue-900"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Shop Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="Search shops..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>

              {/* Shop List */}
              {(shopSearch || shops.length > 0) && (
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {loadingShops ? (
                    <div className="p-3 text-center text-xs text-gray-400">Loading...</div>
                  ) : shops.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400">No shops found</div>
                  ) : (
                    shops.slice(0, 10).map((shop) => (
                      <button
                        key={shop.shop_id}
                        onClick={() => handleShopSelect(shop)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between ${
                          selectedShops.some(s => s.shop_id === shop.shop_id) 
                            ? "bg-blue-50" 
                            : ""
                        }`}
                      >
                        <div>
                          <span className="font-medium text-gray-900">{shop.business_name}</span>
                          <span className="text-gray-400 ml-1">• {shop.city}</span>
                        </div>
                        <span className="text-gray-400">{shop.user_count} users</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <CreditCard size={12} />
                Filter by Plans
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {plans.map((plan) => (
                  <button
                    key={plan.plan_id}
                    onClick={() => handlePlanToggle(plan.plan_id)}
                    className={`px-2 py-1.5 text-xs rounded-lg border transition-all text-left ${
                      selectedPlans.includes(plan.plan_id)
                        ? "bg-purple-100 border-purple-300 text-purple-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>

            {/* User Roles */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <UserCog size={12} />
                Filter by User Roles
              </label>
              <div className="flex flex-wrap gap-1.5">
                {userRoles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleToggle(role.value)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                      selectedRoles.includes(role.value)
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {role.label}
                    <span className="text-gray-400 ml-1">({role.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Calendar size={12} />
                Registration Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </>
        )}

        {/* CAdmin Filters */}
        {showCAdminFilters && (
          <div className="col-span-2 pt-3 border-t border-gray-200">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-2">
              <Shield size={12} />
              Filter CAdmins by Role
            </label>
            <div className="flex flex-wrap gap-2">
              {cadminRoles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleCAdminRoleToggle(role.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    selectedCAdminRoles.includes(role.value)
                      ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipient Breakdown */}
      {recipientPreview && Object.keys(recipientPreview.by_shop || {}).length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Recipients by Shop</span>
            <span className="text-xs text-gray-400">
              {Object.keys(recipientPreview.by_shop).length} shops
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-24 overflow-y-auto">
            {Object.entries(recipientPreview.by_shop).slice(0, 9).map(([shopId, data]) => (
              <div
                key={shopId}
                className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded text-xs"
              >
                <span className="text-gray-700 truncate flex-1">
                  {data.name || shopId.slice(0, 8)}
                </span>
                <span className="font-medium text-indigo-600 ml-2">{data.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudienceFilterPanel;