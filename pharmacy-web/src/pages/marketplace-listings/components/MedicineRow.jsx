// src/pages/marketplace-listings/components/MedicineRow.jsx

import { useState, useRef } from "react";
import {
  Eye, EyeOff, MoreHorizontal, ExternalLink, Pencil,
  AlertTriangle, RefreshCw, CheckCircle2, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import Toggle from "../../marketplace-storefront/components/primitives/Toggle";

// ─── Branch status config ─────────────────────────────────────────────────────

const BRANCH_STATUS = {
  SYNCED: {
    icon: CheckCircle2,
    label: "Synced",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  NEEDS_REVIEW: {
    icon: AlertTriangle,
    label: "Needs Review",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  RECENTLY_UPDATED: {
    icon: RefreshCw,
    label: "Updated",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

// ─── Row visual state resolver ────────────────────────────────────────────────

const getRowClasses = (medicine, isSelected, index) => {
  const base = "border-b border-white/[0.04] transition-all duration-150";
  const even = index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent";
  const selected = isSelected ? "bg-blue-500/[0.07] border-blue-500/10" : even;
  const hidden = !medicine.marketplaceVisible ? "opacity-60" : "";
  const outOfStock =
    medicine.marketplaceStock === "OUT_OF_STOCK" && medicine.marketplaceVisible
      ? "border-l-2 border-l-amber-500/40"
      : "";
  const recentlyUpdated =
    medicine.branchStatus === "RECENTLY_UPDATED"
      ? "shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]"
      : "";

  return [base, selected, hidden, outOfStock, recentlyUpdated]
    .filter(Boolean)
    .join(" ");
};

// ─── Component ────────────────────────────────────────────────────────────────

const MedicineRow = ({
  medicine,
  index,
  isSelected,
  onToggleSelect,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
  onView,
  onEdit,
  globalEnabled,
}) => {
  const [priceEditing, setPriceEditing] = useState(false);
  const [priceInput, setPriceInput] = useState(String(medicine.marketplacePrice));
  const [moreOpen, setMoreOpen] = useState(false);
  const priceRef = useRef(null);

  const commitPrice = () => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val > 0) {
      onSetPrice(val);
    } else {
      setPriceInput(String(medicine.marketplacePrice));
    }
    setPriceEditing(false);
  };

  const statusConfig = BRANCH_STATUS[medicine.branchStatus] ?? BRANCH_STATUS.SYNCED;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={getRowClasses(medicine, isSelected, index)}
    >
      {/* ── Checkbox ── */}
      <td className="px-3 py-0 border-r border-white/[0.04]" style={{ height: "52px" }}>
        <div className="flex items-center justify-center h-full">
          <CheckboxCell checked={isSelected} onChange={onToggleSelect} />
        </div>
      </td>

      {/* ── Medicine Info ── */}
      <td className="px-3 py-2 border-r border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border border-white/[0.08] ${medicine.avatarColor}`}
          >
            {medicine.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate leading-tight">
              {medicine.name}
            </p>
            <p className="text-[10px] text-white/30 truncate mt-0.5">
              {medicine.manufacturer} · {medicine.packSize}
            </p>
            <span className="inline-block mt-0.5 text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-full">
              {medicine.category}
            </span>
          </div>
        </div>
      </td>

      {/* ── ERP Stock ── */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex flex-col items-center gap-1">
          <span
            className={`text-sm font-bold ${
              medicine.isLowStock ? "text-red-400" : "text-white/70"
            }`}
          >
            {medicine.erpStock}
          </span>
          {medicine.isLowStock && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-medium">
              <AlertTriangle size={8} />
              Low
            </span>
          )}
        </div>
      </td>

      {/* ── Marketplace Visibility ── */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            enabled={medicine.marketplaceVisible}
            onChange={onToggleVisibility}
            size="sm"
            disabled={!globalEnabled}
          />
          <span
            className={`text-[9px] font-medium ${
              medicine.marketplaceVisible ? "text-emerald-400" : "text-white/25"
            }`}
          >
            {medicine.marketplaceVisible ? "Visible" : "Hidden"}
          </span>
        </div>
      </td>

      {/* ── Stock Status ── */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex justify-center">
          <StockStatusSelector
            value={medicine.marketplaceStock}
            onChange={onSetStockStatus}
          />
        </div>
      </td>

      {/* ── Marketplace Price ── */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex flex-col items-center gap-1">
          {priceEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/40">₹</span>
              <input
                ref={priceRef}
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitPrice();
                  if (e.key === "Escape") {
                    setPriceInput(String(medicine.marketplacePrice));
                    setPriceEditing(false);
                  }
                }}
                autoFocus
                className="w-16 text-center text-sm font-bold text-white bg-white/[0.08] border border-white/20 rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setPriceEditing(true);
                setPriceInput(String(medicine.marketplacePrice));
              }}
              className="group text-sm font-bold text-white/80 hover:text-white flex items-center gap-1 transition-colors"
            >
              ₹{medicine.marketplacePrice}
              <Pencil
                size={9}
                className="text-white/20 group-hover:text-white/50 transition-colors"
              />
            </button>
          )}
          <span className="text-[10px] text-white/20">
            ERP: ₹{medicine.erpPrice}
          </span>
        </div>
      </td>

      {/* ── Branch Status ── */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.color}`}
        >
          <StatusIcon size={9} />
          {statusConfig.label}
        </span>
      </td>

      {/* ── Actions ── */}
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <ActionButton
            icon={ExternalLink}
            title="View"
            onClick={onView}
            colorClass="hover:text-blue-400 hover:bg-blue-500/10"
          />
          <ActionButton
            icon={Pencil}
            title="Edit"
            onClick={onEdit}
            colorClass="hover:text-amber-400 hover:bg-amber-500/10"
          />
          <div className="relative">
            <ActionButton
              icon={MoreHorizontal}
              title="More"
              onClick={() => setMoreOpen((v) => !v)}
              colorClass="hover:text-white/60 hover:bg-white/[0.06]"
            />
            {moreOpen && (
              <MoreMenu
                onClose={() => setMoreOpen(false)}
                onView={onView}
                onEdit={onEdit}
                visible={medicine.marketplaceVisible}
                onToggleVisibility={onToggleVisibility}
              />
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  );
};

// ─── StockStatusSelector ──────────────────────────────────────────────────────

const StockStatusSelector = ({ value, onChange }) => (
  <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
    <button
      onClick={() => onChange("IN_STOCK")}
      className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
        value === "IN_STOCK"
          ? "bg-emerald-500/20 text-emerald-400 border-r border-emerald-500/20"
          : "text-white/25 hover:text-white/50 hover:bg-white/[0.04] border-r border-white/[0.06]"
      }`}
    >
      In Stock
    </button>
    <button
      onClick={() => onChange("OUT_OF_STOCK")}
      className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
        value === "OUT_OF_STOCK"
          ? "bg-amber-500/20 text-amber-400"
          : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
      }`}
    >
      Out of Stock
    </button>
  </div>
);

// ─── Action Button ────────────────────────────────────────────────────────────

const ActionButton = ({ icon: Icon, title, onClick, colorClass }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg text-white/25 transition-all ${colorClass}`}
  >
    <Icon size={13} />
  </button>
);

// ─── More Menu ────────────────────────────────────────────────────────────────

const MoreMenu = ({ onClose, onView, onEdit, visible, onToggleVisibility }) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#0d0b2e] border border-white/[0.1] shadow-2xl shadow-black/60 z-50 overflow-hidden">
      <MenuOption icon={ExternalLink} label="View Details" onClick={() => { onView(); onClose(); }} />
      <MenuOption icon={Pencil} label="Edit Listing" onClick={() => { onEdit(); onClose(); }} />
      <MenuOption
        icon={visible ? EyeOff : Eye}
        label={visible ? "Hide from App" : "Show in App"}
        onClick={() => { onToggleVisibility(); onClose(); }}
      />
    </div>
  </>
);

const MenuOption = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-colors border-b border-white/[0.05] last:border-0"
  >
    <Icon size={12} />
    {label}
  </button>
);

// ─── Checkbox ────────────────────────────────────────────────────────────────

const CheckboxCell = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
      checked
        ? "bg-blue-500 border-blue-500"
        : "bg-white/[0.04] border-white/20 hover:border-white/40"
    }`}
  >
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path
          d="M1 3.5L3.5 6L8 1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
);

export default MedicineRow;