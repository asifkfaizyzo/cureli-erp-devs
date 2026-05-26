// src/pages/marketplace-onboarding/components/BranchConfigCard.jsx

import { useState, useRef, useEffect } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
  MapPin,
  Clock,
  Truck,
  Phone,
} from "lucide-react";
import LocationPicker from "./LocationPicker";
import TimePicker from "./TimePicker";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";

const BranchConfigCard = ({
  branch,
  isExpanded,
  onToggleExpand,
  onSave,
  isLoaded,
  loadError,
}) => {
  const branchConfigs = useMarketplaceStore((s) => s.branchConfigs);
  const updateBranchConfig = useMarketplaceStore((s) => s.updateBranchConfig);
  const initBranchConfig = useMarketplaceStore((s) => s.initBranchConfig);
  const submitBranchConfig = useMarketplaceStore((s) => s.submitBranchConfig);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const cardRef = useRef(null);

  initBranchConfig(branch.branch_id);
  const config = branchConfigs[branch.branch_id] || {};
  const isEnabled = config.marketplace_enabled ?? false;
  const hasUnsavedChanges = config._dirty === true;

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [isExpanded]);

  const update = (patch) =>
    updateBranchConfig(branch.branch_id, { ...patch, _dirty: true });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const result = await submitBranchConfig(branch.branch_id);
    if (result.success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      if (onSave) onSave(branch.branch_id);
    } else {
      setSaveError(result.error);
    }
    setIsSaving(false);
  };

  const isContactSet = !!config.contact_override?.trim();

  const isLocationSet =
    config.latitude && config.longitude && config.google_place_id;
  const isTimingValid =
    config.is_24_hours || (config.opening_time && config.closing_time);
  const isFulfillmentSet = config.pickup_enabled || config.delivery_enabled;
  const isConfigComplete =
    !isEnabled ||
    (isLocationSet && isTimingValid && isFulfillmentSet && isContactSet);

  const completionSteps = isEnabled
    ? [isLocationSet, isFulfillmentSet, isTimingValid, isContactSet].filter(
        Boolean,
      ).length
    : 0;

  return (
    <div
      ref={cardRef}
      className={`
        rounded-xl border transition-all duration-200
        ${
          isExpanded
            ? "bg-white/[0.04] border-white/15"
            : isEnabled
              ? "bg-white/[0.025] border-white/10 hover:border-white/15"
              : "bg-white/[0.01] border-white/[0.06] hover:border-white/10"
        }
      `}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
              ${isEnabled ? "bg-white/[0.06]" : "bg-white/[0.03]"}
            `}
          >
            <Building2
              size={14}
              className={isEnabled ? "text-white/70" : "text-white/20"}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-semibold truncate ${
                  isEnabled ? "text-white" : "text-white/30"
                }`}
              >
                {branch.branch_name}
              </p>
              {branch.branch_type === "main" && (
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-blue-500/15 text-blue-300 uppercase">
                  Main
                </span>
              )}
            </div>
            {branch.city && (
              <p className="text-[11px] text-white/20 truncate mt-0.5">
                {branch.city}
                {branch.state && `, ${branch.state}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isEnabled && !isExpanded && (
            <>
              {hasUnsavedChanges ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Unsaved
                </span>
              ) : isConfigComplete ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Check size={8} /> Ready
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/5 text-white/25">
                  {completionSteps}/4 {/* ← was /3 */}
                </span>
              )}
            </>
          )}
          {isExpanded ? (
            <ChevronUp size={14} className="text-white/25" />
          ) : (
            <ChevronDown size={14} className="text-white/25" />
          )}
        </div>
      </button>

      {/* Progress bar when collapsed */}
      {!isExpanded && isEnabled && completionSteps < 4 && (
        <div className="px-4 pb-2.5 -mt-0.5">
          <div className="h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full bg-white/15 transition-all duration-300"
              style={{ width: `${(completionSteps / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Expanded ─────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06] pt-4 space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Enable on Marketplace
              </p>
              <p className="text-[11px] text-white/30 mt-0.5">
                Customers can discover and order from this branch
              </p>
            </div>
            <button
              type="button"
              onClick={() => update({ marketplace_enabled: !isEnabled })}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                ${isEnabled ? "bg-emerald-500" : "bg-white/10"}
              `}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 rounded-full bg-white shadow
                  transform transition-transform
                  ${isEnabled ? "translate-x-4.5" : "translate-x-0.5"}
                `}
              />
            </button>
          </div>

          {isEnabled && (
            <div className="space-y-4">
              {/* Location */}
              <Section
                icon={<MapPin size={12} />}
                title="Location"
                required
                done={!!isLocationSet}
              >
                <LocationPicker
                  value={{
                    google_place_id: config.google_place_id,
                    formatted_address: config.formatted_address,
                    latitude: config.latitude,
                    longitude: config.longitude,
                  }}
                  onChange={(loc) => update(loc)}
                  isLoaded={isLoaded}
                  loadError={loadError}
                />
              </Section>

              {/* Fulfillment + Hours — side by side on wide screens */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Fulfillment */}
                <Section
                  icon={<Truck size={12} />}
                  title="Fulfillment"
                  required
                  done={!!isFulfillmentSet}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleChip
                      icon={<Truck size={12} />}
                      label="Pickup"
                      active={config.pickup_enabled}
                      onClick={() =>
                        update({ pickup_enabled: !config.pickup_enabled })
                      }
                    />
                    <ToggleChip
                      icon={<Truck size={12} />}
                      label="Delivery"
                      active={config.delivery_enabled}
                      onClick={() =>
                        update({ delivery_enabled: !config.delivery_enabled })
                      }
                    />
                  </div>
                </Section>

                {/* Hours */}
                <Section
                  icon={<Clock size={12} />}
                  title="Hours"
                  required
                  done={!!isTimingValid}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          update({ is_24_hours: !config.is_24_hours })
                        }
                        className={`
                          relative inline-flex h-4 w-7 items-center rounded-full transition-colors
                          ${config.is_24_hours ? "bg-emerald-500" : "bg-white/10"}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3 w-3 rounded-full bg-white shadow
                            transform transition-transform
                            ${config.is_24_hours ? "translate-x-3.5" : "translate-x-0.5"}
                          `}
                        />
                      </button>
                      <span className="text-xs text-white/50">24 hours</span>
                    </div>
                    {!config.is_24_hours && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-white/25 mb-1">
                            Opens
                          </label>
                          <TimePicker
                            value={config.opening_time || ""}
                            onChange={(val) => update({ opening_time: val })}
                            placeholder="Open time"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/25 mb-1">
                            Closes
                          </label>
                          <TimePicker
                            value={config.closing_time || ""}
                            onChange={(val) => update({ closing_time: val })}
                            placeholder="Close time"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              </div>

              {/* Contact */}
              <Section
                icon={<Phone size={12} />}
                title="Contact"
                required
                done={!!isContactSet}
              >
                <div className="space-y-1.5">
                  <input
                    type="tel"
                    value={config.contact_override || ""}
                    onChange={(e) =>
                      update({ contact_override: e.target.value || null })
                    }
                    placeholder="e.g. +91 98765 43210"
                    maxLength={15}
                    className={`
        w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border text-white
        placeholder-white/15 text-sm focus:outline-none focus:ring-2
        focus:ring-white/20 transition-all
        ${
          isEnabled && !isContactSet && config.contact_override !== undefined
            ? "border-red-500/30"
            : "border-white/10"
        }
      `}
                  />
                  <p className="text-[10px] text-white/15">
                    Required — customers will use this number to reach the
                    branch
                  </p>
                </div>
              </Section>

              {/* Save error */}
              {saveError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle
                    size={12}
                    className="text-red-400 flex-shrink-0"
                  />
                  <p className="text-xs text-red-400">{saveError}</p>
                </div>
              )}

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isConfigComplete}
                className={`
                  w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                  flex items-center justify-center gap-2
                  ${
                    isSaved
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : isConfigComplete
                        ? "bg-white text-[#010015] hover:bg-white/90"
                        : "bg-white/[0.06] text-white/20 cursor-not-allowed"
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <Check size={14} /> Saved
                  </>
                ) : (
                  "Save Configuration"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────

const Section = ({ icon, title, subtitle, required, done, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <span className="text-white/25">{icon}</span>
      <p className="text-xs font-medium text-white/60">
        {title}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {subtitle && (
          <span className="ml-1 text-[10px] text-white/20 font-normal">
            {subtitle}
          </span>
        )}
      </p>
      {done && <Check size={10} className="text-emerald-400 ml-auto" />}
    </div>
    {children}
  </div>
);

const ToggleChip = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      py-2 px-3 rounded-lg border text-xs font-medium transition-all
      flex items-center justify-center gap-1.5
      ${
        active
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/12"
      }
    `}
  >
    {icon} {label}
  </button>
);

export default BranchConfigCard;
