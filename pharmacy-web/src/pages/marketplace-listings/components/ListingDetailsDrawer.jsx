// src/pages/marketplace-listings/components/ListingDetailsDrawer.jsx

import { useState, useEffect } from "react";
import {
  X, Eye, EyeOff, Package, Smartphone, CheckCircle2,
  AlertTriangle, RefreshCw, Tag, TrendingUp, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Toggle from "../../marketplace-storefront/components/primitives/Toggle";

const BRANCH_STATUS_CONFIG = {
  SYNCED: { icon: CheckCircle2, label: "Synced", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  NEEDS_REVIEW: { icon: AlertTriangle, label: "Needs Review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  RECENTLY_UPDATED: { icon: RefreshCw, label: "Recently Updated", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

const ListingDetailsDrawer = ({
  open,
  medicine,
  onClose,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
}) => {
  const [localPrice, setLocalPrice] = useState("");
  const [priceEditing, setPriceEditing] = useState(false);

  useEffect(() => {
    if (medicine) setLocalPrice(String(medicine.marketplacePrice));
  }, [medicine]);

  const commitPrice = () => {
    const val = parseFloat(localPrice);
    if (!isNaN(val) && val > 0) {
      onSetPrice(medicine.id, val);
    } else {
      setLocalPrice(String(medicine.marketplacePrice));
    }
    setPriceEditing(false);
  };

  const statusConfig = medicine
    ? (BRANCH_STATUS_CONFIG[medicine.branchStatus] ?? BRANCH_STATUS_CONFIG.SYNCED)
    : null;

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── Drawer Panel ── */}
      <AnimatePresence>
        {open && medicine && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[420px] z-50 flex flex-col bg-[#080720] border-l border-white/[0.08] shadow-2xl shadow-black/80"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border border-white/[0.08] ${medicine.avatarColor}`}
                >
                  {medicine.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">
                    {medicine.name}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {medicine.manufacturer}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Medicine Details */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Info} label="Medicine Details" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <DetailField label="Category" value={medicine.category} />
                  <DetailField label="Pack Size" value={medicine.packSize} />
                  <DetailField label="ERP Stock" value={`${medicine.erpStock} units`} highlight={medicine.isLowStock ? "warning" : null} />
                  <DetailField label="ERP Price" value={`₹${medicine.erpPrice}`} />
                </div>

                {/* Branch Status */}
                {statusConfig && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                      <statusConfig.icon size={10} />
                      {statusConfig.label}
                    </span>
                    {medicine.isLowStock && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full font-medium">
                        <AlertTriangle size={10} />
                        Low Stock
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Marketplace Controls */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Smartphone} label="Marketplace Controls" />

                <div className="space-y-3 mt-3">
                  {/* Visibility */}
                  <ControlRow label="Visible in App" sublabel="Show this medicine in Cureli mobile app">
                    <Toggle
                      enabled={medicine.marketplaceVisible}
                      onChange={() => onToggleVisibility(medicine.id)}
                      size="md"
                    />
                  </ControlRow>

                  {/* Stock Status */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[11px] text-white/40 font-medium mb-2.5">
                      Marketplace Stock Status
                    </p>
                    <div className="flex gap-2">
                      <StockButton
                        label="In Stock"
                        active={medicine.marketplaceStock === "IN_STOCK"}
                        onClick={() => onSetStockStatus(medicine.id, "IN_STOCK")}
                        activeClass="bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      />
                      <StockButton
                        label="Out of Stock"
                        active={medicine.marketplaceStock === "OUT_OF_STOCK"}
                        onClick={() => onSetStockStatus(medicine.id, "OUT_OF_STOCK")}
                        activeClass="bg-amber-500/20 border-amber-500/30 text-amber-400"
                      />
                    </div>
                    {medicine.marketplaceStock === "OUT_OF_STOCK" && (
                      <p className="text-[10px] text-amber-400/60 mt-2">
                        Medicine remains visible but shows "Out of Stock" badge
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Marketplace Price */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Tag} label="Marketplace Pricing" />
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] text-white/40 font-medium">
                        Marketplace Price
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">
                        Separate from ERP selling price
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {priceEditing ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-white/40">₹</span>
                          <input
                            type="number"
                            value={localPrice}
                            onChange={(e) => setLocalPrice(e.target.value)}
                            onBlur={commitPrice}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitPrice();
                              if (e.key === "Escape") {
                                setLocalPrice(String(medicine.marketplacePrice));
                                setPriceEditing(false);
                              }
                            }}
                            autoFocus
                            className="w-20 text-right text-lg font-bold text-white bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setPriceEditing(true)}
                          className="text-2xl font-bold text-white hover:text-white/80 transition-colors"
                        >
                          ₹{medicine.marketplacePrice}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
                    <span className="text-[11px] text-white/25">ERP Price</span>
                    <span className="text-sm text-white/30 font-medium">
                      ₹{medicine.erpPrice}
                    </span>
                  </div>
                  {medicine.marketplacePrice !== medicine.erpPrice && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp size={10} className="text-blue-400" />
                      <span className="text-[10px] text-blue-400">
                        {medicine.marketplacePrice > medicine.erpPrice ? "+" : ""}
                        ₹{medicine.marketplacePrice - medicine.erpPrice} vs ERP
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* App Preview Card */}
              <div className="px-5 py-4">
                <SectionLabel icon={Smartphone} label="Cureli App Preview" />
                <AppPreviewCard medicine={medicine} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.07] bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white/50 hover:text-white/70 transition-all"
                >
                  Close
                </button>
                <button className="flex-1 py-2 rounded-lg bg-[#05015A] hover:bg-[#0a0280] border border-white/[0.1] text-xs font-semibold text-white transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2">
    <Icon size={12} className="text-white/30" />
    <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">
      {label}
    </p>
  </div>
);

const DetailField = ({ label, value, highlight }) => (
  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
    <p className="text-[10px] text-white/25 font-medium">{label}</p>
    <p
      className={`text-xs font-semibold mt-0.5 ${
        highlight === "warning" ? "text-amber-400" : "text-white/70"
      }`}
    >
      {value}
    </p>
  </div>
);

const ControlRow = ({ label, sublabel, children }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
    <div>
      <p className="text-sm font-medium text-white/70">{label}</p>
      {sublabel && (
        <p className="text-[10px] text-white/25 mt-0.5">{sublabel}</p>
      )}
    </div>
    {children}
  </div>
);

const StockButton = ({ label, active, onClick, activeClass }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
      active
        ? activeClass
        : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-white/50 hover:bg-white/[0.06]"
    }`}
  >
    {label}
  </button>
);

const AppPreviewCard = ({ medicine }) => (
  <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
    {/* Mock App Header */}
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border-b border-white/[0.05]">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
      <span className="text-[10px] text-white/30 font-medium">
        Cureli App · Medicine Card
      </span>
    </div>

    {/* Card Body */}
    <div className="p-3">
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border border-white/[0.08] flex-shrink-0 ${medicine.avatarColor}`}
        >
          {medicine.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white/80 leading-tight">
                {medicine.name}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {medicine.manufacturer}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">
                {medicine.packSize}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-white/90">
                ₹{medicine.marketplacePrice}
              </p>
              {medicine.marketplaceStock === "OUT_OF_STOCK" && (
                <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mock Add Button */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            medicine.marketplaceVisible
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : "text-white/20 bg-white/[0.04] border border-white/[0.07]"
          }`}
        >
          {medicine.marketplaceVisible ? "Visible in App" : "Hidden from App"}
        </span>
        {medicine.marketplaceVisible &&
          medicine.marketplaceStock === "IN_STOCK" && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#05015A]/60 border border-white/[0.1]">
              <span className="text-[10px] text-white/60 font-medium">Add to Cart</span>
            </div>
          )}
      </div>
    </div>
  </div>
);

export default ListingDetailsDrawer;