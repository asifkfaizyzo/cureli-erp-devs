// src/pages/marketplace-listings/components/ListingDetailsDrawer.jsx

import { useState, useEffect } from "react";
import {
  X, Eye, EyeOff, Smartphone, Tag,
  TrendingUp, Info, Package, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Toggle from "../../marketplace-storefront/components/primitives/Toggle";

const ListingDetailsDrawer = ({
  open,
  listing,
  onClose,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
  isUpdating,
}) => {
  const [localPrice, setLocalPrice] = useState("");
  const [priceEditing, setPriceEditing] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (listing) {
      setLocalPrice(String(listing.marketplace_price ?? ""));
      setImgError(false);
    }
  }, [listing]);

  const commitPrice = () => {
    const val = parseFloat(localPrice);
    if (!isNaN(val) && val > 0) {
      onSetPrice(listing.listing_id, val);
    } else {
      setLocalPrice(String(listing.marketplace_price ?? ""));
    }
    setPriceEditing(false);
  };

  return (
    <>
      {/* Backdrop */}
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

      {/* Drawer */}
      <AnimatePresence>
        {open && listing && (
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
                {/* Image */}
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0 bg-white/[0.04] flex items-center justify-center">
                  {listing.image_url && !imgError ? (
                    <img
                      src={listing.image_url}
                      alt={listing.catalog_name}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-sm font-bold text-white/40">
                      {listing.catalog_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">
                    {listing.catalog_name}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {listing.manufacturer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUpdating && (
                  <Loader2 size={14} className="text-white/30 animate-spin" />
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Medicine Details */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Info} label="Catalog Details" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {listing.generic_name && (
                    <DetailField label="Generic Name" value={listing.generic_name} />
                  )}
                  {listing.primary_category && (
                    <DetailField label="Category" value={listing.primary_category} />
                  )}
                  {listing.pack_size && (
                    <DetailField label="Pack Size" value={listing.pack_size} />
                  )}
                  {listing.form && (
                    <DetailField label="Form" value={listing.form} />
                  )}
                  <DetailField
                    label="ERP Stock"
                    value={`${listing.erp_stock} units`}
                    highlight={listing.is_low_stock ? "warning" : null}
                  />
                </div>

                {/* ERP name reference */}
                <div className="mt-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-white/20 font-medium mb-1">
                    ERP Medicine Name
                  </p>
                  <p className="text-xs text-white/40 font-mono">
                    {listing.erp_name}
                  </p>
                </div>
              </div>

              {/* Marketplace Controls */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Smartphone} label="Marketplace Controls" />

                <div className="space-y-3 mt-3">
                  {/* Visibility */}
                  <ControlRow
                    label="Visible in App"
                    sublabel="Show this medicine to customers in the Cureli app"
                  >
                    <Toggle
                      enabled={listing.is_visible}
                      onChange={() => onToggleVisibility(listing.listing_id)}
                      size="md"
                      disabled={isUpdating}
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
                        active={listing.stock_status === "IN_STOCK"}
                        onClick={() =>
                          onSetStockStatus(listing.listing_id, "IN_STOCK")
                        }
                        activeClass="bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        disabled={isUpdating}
                      />
                      <StockButton
                        label="Out of Stock"
                        active={listing.stock_status === "OUT_OF_STOCK"}
                        onClick={() =>
                          onSetStockStatus(listing.listing_id, "OUT_OF_STOCK")
                        }
                        activeClass="bg-amber-500/20 border-amber-500/30 text-amber-400"
                        disabled={isUpdating}
                      />
                    </div>
                    {listing.stock_status === "OUT_OF_STOCK" && (
                      <p className="text-[10px] text-amber-400/60 mt-2">
                        Medicine remains visible but shows "Out of Stock" to customers
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Tag} label="Marketplace Pricing" />
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] text-white/40 font-medium">
                        Marketplace Price
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">
                        Independent from ERP pricing
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
                                setLocalPrice(
                                  String(listing.marketplace_price ?? "")
                                );
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
                          {listing.marketplace_price != null
                            ? `₹${listing.marketplace_price}`
                            : <span className="text-base text-white/30">Not set</span>}
                        </button>
                      )}
                    </div>
                  </div>
                  {listing.marketplace_price != null && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.05]">
                      <TrendingUp size={10} className="text-blue-400" />
                      <span className="text-[10px] text-blue-400">
                        ERP stock: {listing.erp_stock} units available
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* App Preview */}
              <div className="px-5 py-4">
                <SectionLabel icon={Smartphone} label="Cureli App Preview" />
                <AppPreviewCard listing={listing} imgError={imgError} onImgError={() => setImgError(true)} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.07] bg-white/[0.01]">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white/50 hover:text-white/70 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ── Sub-components ──

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

const StockButton = ({ label, active, onClick, activeClass, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${
      active
        ? activeClass
        : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-white/50 hover:bg-white/[0.06]"
    }`}
  >
    {label}
  </button>
);

const AppPreviewCard = ({ listing, imgError, onImgError }) => (
  <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border-b border-white/[0.05]">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
      <span className="text-[10px] text-white/30 font-medium">
        Cureli App · Medicine Card
      </span>
    </div>
    <div className="p-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0 bg-white/[0.04] flex items-center justify-center">
          {listing.image_url && !imgError ? (
            <img
              src={listing.image_url}
              alt={listing.catalog_name}
              className="w-full h-full object-cover"
              onError={onImgError}
            />
          ) : (
            <Package size={18} className="text-white/20" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white/80 leading-tight">
                {listing.catalog_name}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {listing.manufacturer}
              </p>
              {listing.pack_size && (
                <p className="text-[10px] text-white/20 mt-0.5">
                  {listing.pack_size}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-white/90">
                {listing.marketplace_price != null
                  ? `₹${listing.marketplace_price}`
                  : "—"}
              </p>
              {listing.stock_status === "OUT_OF_STOCK" && (
                <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            listing.is_visible
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : "text-white/20 bg-white/[0.04] border border-white/[0.07]"
          }`}
        >
          {listing.is_visible ? "Visible in App" : "Hidden from App"}
        </span>
        {listing.is_visible && listing.stock_status === "IN_STOCK" && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#05015A]/60 border border-white/[0.1]">
            <span className="text-[10px] text-white/60 font-medium">
              Add to Cart
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default ListingDetailsDrawer;