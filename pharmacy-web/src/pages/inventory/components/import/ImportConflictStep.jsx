// src/pages/inventory/components/import/ImportConflictStep.jsx

import React from "react";
import { ArrowRight, Loader2, Layers } from "lucide-react";

const DECISION_CONFIG = {
  merge:   {
    label: "Add to existing",
    desc:  "Add import quantity to current stock",
    style: "bg-emerald-600 text-white border-emerald-600",
    idle:  "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
  },
  replace: {
    label: "Replace",
    desc:  "Overwrite with import quantity",
    style: "bg-amber-600 text-white border-amber-600",
    idle:  "bg-white text-amber-700 border-amber-300 hover:bg-amber-50",
  },
  skip: {
    label: "Skip",
    desc:  "Do not change existing stock",
    style: "bg-gray-600 text-white border-gray-600",
    idle:  "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
  },
};

const ImportConflictStep = ({
  conflictReport,
  userConflictDecisions,
  onSetDecision,
  onSetAll,
  resolvedCount,
  totalCount,
  allDone,
  onProceed,
  loading,
  error,
}) => {
  const entries = Object.entries(conflictReport);

  return (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="shrink-0 px-6 py-4 bg-amber-50 border-b border-amber-200">
        <div className="flex items-start gap-3">
          <Layers size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {totalCount} batch conflict{totalCount !== 1 ? "s" : ""} found
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              These batches already exist in your inventory. Choose what to do
              with the imported quantity for each.
            </p>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-amber-700 font-medium">
            Apply to all:
          </span>
          {["merge", "replace", "skip"].map((action) => (
            <button
              key={action}
              onClick={() => onSetAll(action)}
              className="px-3 py-1 text-xs font-medium rounded-lg border
                         bg-white text-amber-800 border-amber-300
                         hover:bg-amber-100 transition-colors capitalize"
            >
              {action === "merge"   ? "Add all"
               : action === "replace" ? "Replace all"
               : "Skip all"}
            </button>
          ))}
        </div>
      </div>

      {/* Conflict list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {entries.map(([key, entry]) => {
          const currentDecision = userConflictDecisions[key];

          return (
            <div
              key={key}
              className={`
                border rounded-xl p-4 transition-all
                ${currentDecision
                  ? "border-gray-200 bg-white"
                  : "border-amber-200 bg-amber-50"
                }
              `}
            >
              {/* Medicine + batch info */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {entry.medicineName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Batch: <span className="font-mono font-medium">
                      {entry.batchNumber}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">
                    Current stock:{" "}
                    <span className="font-bold text-gray-900">
                      {entry.existingStock}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Import qty:{" "}
                    <span className="font-bold text-indigo-700">
                      +{entry.importQuantity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision buttons */}
              <div className="flex gap-2">
                {["merge", "replace", "skip"].map((action) => {
                  const config    = DECISION_CONFIG[action];
                  const isChosen  = currentDecision === action;

                  // Show projected result for merge
                  const projection =
                    action === "merge"
                      ? `→ ${entry.existingStock + entry.importQuantity} units`
                      : action === "replace"
                      ? `→ ${entry.importQuantity} units`
                      : "→ No change";

                  return (
                    <button
                      key={action}
                      onClick={() => onSetDecision(key, action)}
                      title={projection}
                      className={`
                        flex-1 py-2 text-xs font-medium rounded-lg border
                        transition-all
                        ${isChosen ? config.style : config.idle}
                      `}
                    >
                      <div>{config.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isChosen ? "opacity-80" : "opacity-60"}`}>
                        {projection}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            {resolvedCount} of {totalCount} resolved
          </span>
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{
                width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <button
          onClick={onProceed}
          disabled={!allDone || loading}
          className={`
            w-full flex items-center justify-center gap-2 py-3 px-6
            rounded-xl font-semibold text-sm transition-all
            ${allDone && !loading
              ? "bg-[#000060] text-white hover:bg-indigo-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" />Saving...</>
            : <>Continue <ArrowRight size={16} /></>
          }
        </button>
      </div>
    </div>
  );
};

export default ImportConflictStep;