// src/pages/marketplace-listings/components/BulkActionBar.jsx

import { Eye, EyeOff, PackageX, PackageCheck, X, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BulkActionBar = ({
  selectedCount,
  onHide,
  onShow,
  onOutOfStock,
  onRestoreStock,
  onClear,
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3.5 bg-[#080720] border-t border-white/[0.1] shadow-2xl shadow-black/80"
        >
          {/* Left: Selection Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Layers size={13} className="text-blue-400" />
              <span className="text-sm font-bold text-blue-400">
                {selectedCount}
              </span>
              <span className="text-xs text-blue-400/60 font-medium">
                {selectedCount === 1 ? "medicine" : "medicines"} selected
              </span>
            </div>
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={11} />
              Clear
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <BulkButton
              icon={Eye}
              label="Show"
              onClick={onShow}
              variant="ghost"
            />
            <BulkButton
              icon={EyeOff}
              label="Hide"
              onClick={onHide}
              variant="ghost"
            />
            <div className="h-6 w-px bg-white/[0.08] mx-1" />
            <BulkButton
              icon={PackageX}
              label="Mark Out of Stock"
              onClick={onOutOfStock}
              variant="warning"
            />
            <BulkButton
              icon={PackageCheck}
              label="Restore Stock"
              onClick={onRestoreStock}
              variant="success"
            />
            <div className="h-6 w-px bg-white/[0.08] mx-1" />
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#05015A] hover:bg-[#0a0280] border border-white/[0.1] text-xs font-semibold text-white transition-all">
              Enable Listing
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white/50 hover:text-white/70 transition-all">
              Disable Listing
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const BULK_VARIANTS = {
  ghost:
    "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-white/50 hover:text-white/80",
  warning:
    "bg-amber-500/[0.08] hover:bg-amber-500/[0.15] border-amber-500/20 text-amber-400/70 hover:text-amber-400",
  success:
    "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] border-emerald-500/20 text-emerald-400/70 hover:text-emerald-400",
};

const BulkButton = ({ icon: Icon, label, onClick, variant = "ghost" }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-all ${BULK_VARIANTS[variant]}`}
  >
    <Icon size={13} />
    {label}
  </button>
);

export default BulkActionBar;