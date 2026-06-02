// cadmin-web/src/pages/marketplace/Shops/comps/BranchMarketplaceModal.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  MapPin,
  Clock,
  Phone,
  Package,
  Truck,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldOff,
  ShieldCheck,
  Store,
} from "lucide-react";
import {
  searchPlaces,
  getPlaceDetails,
  updateBranchMarketplaceConfig,
  blockMarketplaceBranch,
} from "../../../../api/cadminMarketplaceShops";

// ── Helpers ────────────────────────────────────────────────────
const isLinked = (branch) => !!branch.marketplaceSettings;
const isEnabled = (branch) =>
  branch.marketplaceSettings?.marketplace_enabled === true;

// ── Places search input ────────────────────────────────────────
const PlacesSearchInput = ({ value, onChange, onSelect }) => {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(val.trim());
        setResults(res.data?.data || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelect = async (prediction) => {
    setOpen(false);
    setQuery(prediction.description);
    setSearching(true);
    try {
      const res = await getPlaceDetails(prediction.place_id);
      const detail = res.data?.data;
      if (detail) {
        onSelect(detail);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search location on Google Maps..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40"
        />
        {searching && (
          <Loader2
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-medium text-gray-800 truncate">
                {r.main_text}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {r.secondary_text}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Toggle ─────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, disabled = false }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#05015A]" : "bg-gray-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ── Time Input ─────────────────────────────────────────────────
const TimeInput = ({ label, value, onChange, error }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <input
      type="time"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 ${
        error ? "border-red-400" : "border-gray-200"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// ── Main Modal ─────────────────────────────────────────────────
const BranchMarketplaceModal = ({ branch, shop, onClose, onSaved }) => {
  const linked = isLinked(branch);
  const ms = branch.marketplaceSettings;

  // Form state
  const [form, setForm] = useState({
    marketplace_enabled: ms?.marketplace_enabled ?? false,
    pickup_enabled: ms?.pickup_enabled ?? false,
    delivery_enabled: ms?.delivery_enabled ?? false,
    is_24_hours: ms?.is_24_hours ?? false,
    opening_time: ms?.opening_time ?? "",
    closing_time: ms?.closing_time ?? "",
    contact_override: ms?.contact_override ?? "",
    latitude: ms?.latitude ?? null,
    longitude: ms?.longitude ?? null,
    google_place_id: ms?.google_place_id ?? null,
    formatted_address: ms?.formatted_address ?? "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const set = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Validate ──
  const validate = () => {
    const errs = {};
    if (form.marketplace_enabled) {
      if (!form.latitude || !form.longitude) {
        errs.location = "Location is required when marketplace is enabled";
      }
      if (!form.google_place_id) {
        errs.location = "Select a location from the search results";
      }
      if (!form.pickup_enabled && !form.delivery_enabled) {
        errs.fulfillment = "Enable at least pickup or delivery";
      }
      if (!form.is_24_hours) {
        if (!form.opening_time) errs.opening_time = "Opening time is required";
        if (!form.closing_time) errs.closing_time = "Closing time is required";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save config ──
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateBranchMarketplaceConfig(shop.shop_id, branch.branch_id, {
        marketplace_enabled: form.marketplace_enabled,
        pickup_enabled: form.pickup_enabled,
        delivery_enabled: form.delivery_enabled,
        is_24_hours: form.is_24_hours,
        opening_time: form.is_24_hours ? null : form.opening_time || null,
        closing_time: form.is_24_hours ? null : form.closing_time || null,
        contact_override: form.contact_override || null,
        latitude: form.latitude,
        longitude: form.longitude,
        google_place_id: form.google_place_id,
        formatted_address: form.formatted_address || null,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved();
      }, 1000);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to save configuration";
      setErrors({ submit: msg });
    } finally {
      setSaving(false);
    }
  };

  // ── Block/unblock branch ──
  const handleBlockBranch = async () => {
    setBlocking(true);
    try {
      await blockMarketplaceBranch(
        shop.shop_id,
        branch.branch_id,
        branch.is_active // block = true means we're blocking an active branch
      );
      onSaved();
    } catch (err) {
      setErrors({
        submit:
          err.response?.data?.message || "Failed to update branch status",
      });
    } finally {
      setBlocking(false);
    }
  };

  // ── Place selected from search ──
  const handlePlaceSelect = (detail) => {
    set("latitude", detail.latitude);
    set("longitude", detail.longitude);
    set("google_place_id", detail.place_id);
    set("formatted_address", detail.formatted_address);
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-[#05015A] flex-shrink-0" />
              <h3 className="font-semibold text-gray-800 truncate">
                {branch.branch_name}
              </h3>
              {/* Linked indicator */}
              {linked ? (
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle2 size={10} />
                  Linked
                </span>
              ) : (
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                  Not Linked
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {branch.city || "—"}
              {branch.state ? `, ${branch.state}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Branch status warning */}
          {!branch.is_active && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                This branch is currently blocked. Unblock it to enable
                marketplace.
              </p>
            </div>
          )}

          {/* ── Enable marketplace toggle ── */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Toggle
              checked={form.marketplace_enabled}
              onChange={(v) => set("marketplace_enabled", v)}
              label="Enable on Marketplace"
              disabled={!branch.is_active}
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-13 pl-0.5">
              When enabled, this branch will be discoverable by customers on the
              app.
            </p>
          </div>

          {/* ── Location ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Location
            </label>
            <PlacesSearchInput
              value={form.formatted_address}
              onChange={(v) => set("formatted_address", v)}
              onSelect={handlePlaceSelect}
            />
            {form.formatted_address && form.google_place_id && (
              <div className="flex items-start gap-2 mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <MapPin size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-emerald-700 font-medium">
                    Location selected
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    {form.formatted_address}
                  </p>
                  {form.latitude && form.longitude && (
                    <p className="text-[10px] text-emerald-500 mt-0.5">
                      {Number(form.latitude).toFixed(6)},{" "}
                      {Number(form.longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            )}
            {errors.location && (
              <p className="text-xs text-red-500 mt-1">{errors.location}</p>
            )}
          </div>

          {/* ── Fulfillment ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Fulfillment
            </label>
            <div className="space-y-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Toggle
                checked={form.pickup_enabled}
                onChange={(v) => set("pickup_enabled", v)}
                label="Pickup enabled"
              />
              <Toggle
                checked={form.delivery_enabled}
                onChange={(v) => set("delivery_enabled", v)}
                label="Delivery enabled"
              />
            </div>
            {errors.fulfillment && (
              <p className="text-xs text-red-500 mt-1">{errors.fulfillment}</p>
            )}
          </div>

          {/* ── Timings ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Timings
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
              <Toggle
                checked={form.is_24_hours}
                onChange={(v) => set("is_24_hours", v)}
                label="Open 24 hours"
              />
              {!form.is_24_hours && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <TimeInput
                    label="Opening time"
                    value={form.opening_time}
                    onChange={(v) => set("opening_time", v)}
                    error={errors.opening_time}
                  />
                  <TimeInput
                    label="Closing time"
                    value={form.closing_time}
                    onChange={(v) => set("closing_time", v)}
                    error={errors.closing_time}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Contact override ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Contact Override{" "}
              <span className="text-gray-400 font-normal normal-case">
                (optional)
              </span>
            </label>
            <input
              type="tel"
              value={form.contact_override}
              onChange={(e) => set("contact_override", e.target.value)}
              placeholder="Override phone shown to customers"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20"
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          {/* Block/unblock branch */}
          <button
            onClick={handleBlockBranch}
            disabled={blocking || saving}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
              branch.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {blocking ? (
              <Loader2 size={13} className="animate-spin" />
            ) : branch.is_active ? (
              <ShieldOff size={13} />
            ) : (
              <ShieldCheck size={13} />
            )}
            {branch.is_active ? "Block Branch" : "Unblock Branch"}
          </button>

          {/* Save */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-[#05015A] hover:bg-[#0a0280] text-white"
              }`}
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={13} />
              ) : null}
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Config"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchMarketplaceModal;