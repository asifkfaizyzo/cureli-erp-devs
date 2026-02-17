// src/pages/suppliers/components/ManageSupplierBranchesModal.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Building2, Check, Save, Loader2, AlertTriangle,
  Layers, Shield, RefreshCw, Minus, Plus, Info
} from "lucide-react";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.15 } },
};

const ManageSupplierBranchesModal = ({
  open,
  supplier,
  onClose,
  onSave,
  getSupplierBranches,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchData, setBranchData] = useState(null);
  const [selectedBranches, setSelectedBranches] = useState(new Set());
  const [originalBranches, setOriginalBranches] = useState(new Set()); // ✅ Track original state
  const [error, setError] = useState(null);

  // ✅ Reset state when modal opens/closes
  useEffect(() => {
    if (open && supplier?.supplier_id) {
      // Reset state before fetching
      setBranchData(null);
      setSelectedBranches(new Set());
      setOriginalBranches(new Set());
      setError(null);
      fetchBranchData();
    } else if (!open) {
      // Clean up when modal closes
      setBranchData(null);
      setSelectedBranches(new Set());
      setOriginalBranches(new Set());
      setError(null);
      setLoading(true);
    }
  }, [open, supplier?.supplier_id]);

  const fetchBranchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("📍 Fetching branches for supplier:", supplier.supplier_id);
      const result = await getSupplierBranches(supplier.supplier_id);
      
      console.log("📦 Branch data received:", result);
      
      if (result.success) {
        setBranchData(result.data);
        
        // Initialize selected branches with currently linked ones
        const linkedIds = new Set(
          result.data.branches
            .filter(b => b.is_linked)
            .map(b => b.branch_id)
        );
        
        console.log("✅ Linked branches:", Array.from(linkedIds));
        
        setSelectedBranches(linkedIds);
        setOriginalBranches(new Set(linkedIds)); // ✅ Store original for comparison
      } else {
        setError(result.error || "Failed to load branch data");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBranch = (branchId) => {
    setSelectedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  // ✅ Select all branches
  const selectAll = () => {
    if (branchData?.branches) {
      setSelectedBranches(new Set(branchData.branches.map(b => b.branch_id)));
    }
  };

  // ✅ Deselect all branches
  const deselectAll = () => {
    setSelectedBranches(new Set());
  };

  // ✅ Calculate changes
  const changes = useMemo(() => {
    const toAdd = [];
    const toRemove = [];

    // Branches to add (selected but not in original)
    selectedBranches.forEach(id => {
      if (!originalBranches.has(id)) {
        const branch = branchData?.branches.find(b => b.branch_id === id);
        if (branch) toAdd.push(branch);
      }
    });

    // Branches to remove (in original but not selected)
    originalBranches.forEach(id => {
      if (!selectedBranches.has(id)) {
        const branch = branchData?.branches.find(b => b.branch_id === id);
        if (branch) toRemove.push(branch);
      }
    });

    return { toAdd, toRemove, hasChanges: toAdd.length > 0 || toRemove.length > 0 };
  }, [selectedBranches, originalBranches, branchData]);

  const handleSave = async () => {
    // ✅ Allow saving even with 0 selected (will fail on backend)
    if (selectedBranches.size === 0) {
      setError("Supplier must be linked to at least one branch");
      return;
    }

    if (!changes.hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log("💾 Saving branches:", Array.from(selectedBranches));
      
      const result = await onSave(supplier.supplier_id, Array.from(selectedBranches));
      
      console.log("📦 Save result:", result);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to save changes");
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#05015A] to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Layers size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Manage Branches</h2>
                    <p className="text-indigo-200 text-sm truncate max-w-[200px]">
                      {supplier?.name || "Supplier"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Refresh Button */}
                  <button
                    onClick={fetchBranchData}
                    disabled={loading}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
                  <p className="text-gray-500">Loading branches...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <AlertTriangle size={24} className="text-red-500" />
                  </div>
                  <p className="text-red-600 font-medium text-center">{error}</p>
                  <button
                    onClick={fetchBranchData}
                    className="mt-3 text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {/* Info Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Shield size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Branch Access Control</p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Select which branches this supplier should be available in for purchase orders.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Available Branches ({branchData?.total_branches || 0})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAll}
                        disabled={selectedBranches.size === branchData?.branches.length}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} />
                        Select All
                      </button>
                      <div className="w-px h-4 bg-gray-200" />
                      <button
                        onClick={deselectAll}
                        disabled={selectedBranches.size === 0}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={12} />
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Branch List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {branchData?.branches.map((branch) => {
                      const isSelected = selectedBranches.has(branch.branch_id);
                      const isMain = branch.branch_type === "main";
                      const wasOriginallyLinked = originalBranches.has(branch.branch_id);
                      const isNewlyAdded = isSelected && !wasOriginallyLinked;
                      const isBeingRemoved = !isSelected && wasOriginallyLinked;

                      return (
                        <motion.button
                          key={branch.branch_id}
                          onClick={() => toggleBranch(branch.branch_id)}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            w-full p-3 rounded-xl border-2 transition-all duration-200
                            flex items-center justify-between group
                            ${isSelected
                              ? "border-indigo-500 bg-indigo-50/80"
                              : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
                            }
                            ${isBeingRemoved ? "border-red-300 bg-red-50/50" : ""}
                            ${isNewlyAdded ? "border-green-400 bg-green-50/50" : ""}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div className={`
                              w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200
                              ${isSelected 
                                ? isNewlyAdded 
                                  ? "bg-green-500" 
                                  : "bg-indigo-500" 
                                : isBeingRemoved 
                                  ? "bg-red-200 border-2 border-red-300" 
                                  : "bg-gray-100 border-2 border-gray-200 group-hover:border-gray-300"
                              }
                            `}>
                              {isSelected ? (
                                <Check size={14} className="text-white" strokeWidth={3} />
                              ) : isBeingRemoved ? (
                                <Minus size={14} className="text-red-500" strokeWidth={3} />
                              ) : null}
                            </div>

                            {/* Branch Info */}
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-sm ${
                                  isSelected 
                                    ? isNewlyAdded ? "text-green-700" : "text-indigo-700" 
                                    : isBeingRemoved ? "text-red-600" : "text-gray-700"
                                }`}>
                                  {branch.branch_name}
                                </span>
                                {isMain && (
                                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase">
                                    Main
                                  </span>
                                )}
                              </div>
                              {wasOriginallyLinked && branch.linked_at && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Linked since {new Date(branch.linked_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center">
                            {isNewlyAdded && (
                              <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                + Adding
                              </span>
                            )}
                            {isBeingRemoved && (
                              <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                − Removing
                              </span>
                            )}
                            {isSelected && !isNewlyAdded && (
                              <span className="text-[10px] font-medium text-indigo-500">
                                Active
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Validation Warning */}
                  {selectedBranches.size === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                    >
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        Supplier must be linked to at least one branch. Select at least one branch to continue.
                      </p>
                    </motion.div>
                  )}

                  {/* Changes Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-indigo-600">{selectedBranches.size}</div>
                          <div className="text-[10px] text-gray-500 uppercase">Selected</div>
                        </div>
                        {changes.hasChanges && (
                          <>
                            <div className="h-8 w-px bg-gray-200" />
                            {changes.toAdd.length > 0 && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">+{changes.toAdd.length}</div>
                                <div className="text-[10px] text-green-600 uppercase">Adding</div>
                              </div>
                            )}
                            {changes.toRemove.length > 0 && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-red-600">−{changes.toRemove.length}</div>
                                <div className="text-[10px] text-red-600 uppercase">Removing</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {changes.hasChanges && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Changes */}
                    {changes.hasChanges && (
                      <div className="mt-3 space-y-2">
                        {changes.toAdd.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-green-600 font-medium">Adding:</span>
                            {changes.toAdd.map(b => (
                              <span key={b.branch_id} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {b.branch_name}
                              </span>
                            ))}
                          </div>
                        )}
                        {changes.toRemove.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-red-600 font-medium">Removing:</span>
                            {changes.toRemove.map(b => (
                              <span key={b.branch_id} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                {b.branch_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!loading && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {branchData && (
                    <span>
                      Originally linked to <strong>{originalBranches.size}</strong> branch(es)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !changes.hasChanges || selectedBranches.size === 0}
                    className={`
                      flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                      transition-all duration-200 shadow-sm
                      ${saving || !changes.hasChanges || selectedBranches.size === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#05015A] to-indigo-600 text-white hover:shadow-md"
                      }
                    `}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManageSupplierBranchesModal;