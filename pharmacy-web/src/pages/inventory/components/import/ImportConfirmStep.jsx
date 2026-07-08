import React, { useMemo, useState } from "react";
import {
  Loader2,
  Package,
  CheckCircle,
  Link2,
  HelpCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";

const SummaryRow = ({ label, value, color = "gray" }) => {
  if (!value && value !== 0) return null;
  if (value === 0) return null;

  const colors = {
    gray: "text-gray-900",
    green: "text-emerald-700",
    amber: "text-amber-700",
    blue: "text-blue-700",
    red: "text-red-700",
    slate: "text-slate-600",
    indigo: "text-indigo-700",
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${colors[color]}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
};

const MedicineGroup = ({
  title,
  icon: Icon,
  colorClass,
  badgeClass,
  items,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  if (!items || items.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={15} className={colorClass} />
          <span className="text-sm font-medium text-gray-800 truncate">
            {title}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {items.length}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 max-h-60 overflow-y-auto divide-y divide-gray-100">
          {items.map((item, index) => (
            <div key={`${item.key}-${index}`} className="px-4 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.inputName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <Building2 size={11} className="shrink-0" />
                    <span className="truncate">
                      {item.inputCompany || "Unknown manufacturer"}
                    </span>
                    <span>•</span>
                    <span>
                      {item.rowCount} {item.rowCount === 1 ? "batch" : "batches"}
                    </span>
                  </div>
                </div>

                {typeof item.confidence === "number" && item.confidence > 0 && (
                  <span className="text-xs font-semibold text-gray-500 shrink-0">
                    {item.confidence}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ImportConfirmStep = ({
  summary,
  autoSummary,
  medicinePlans,
  fileName,
  detectedSoftware,
  validRows,
  errorRows,
  onConfirm,
  loading,
  error,
}) => {
  const willImport = summary?.willImport || validRows || 0;
  const willMerge = summary?.willMerge || 0;
  const willReplace = summary?.willReplace || 0;
  const willSkip = summary?.willSkip || 0;
  const blocked = summary?.blockedByError || errorRows || 0;

  const totalWritten = willImport + willMerge + willReplace;

  const groupedPlans = useMemo(() => {
    const plans = Object.values(medicinePlans || {});

    return {
      existing: plans.filter((p) => p.medicineAction === "use_existing"),
      linked: plans.filter((p) => p.medicineAction === "create_linked"),
      suggested: plans.filter((p) => p.medicineAction === "create_suggested"),
      unlinked: plans.filter((p) => p.medicineAction === "create_unlinked"),
    };
  }, [medicinePlans]);

  return (
    <div className="p-6 space-y-5">
      {/* File info */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
        <Package size={18} className="text-gray-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
          {detectedSoftware && detectedSoftware !== "Unknown" && (
            <p className="text-xs text-gray-500">{detectedSoftware}</p>
          )}
        </div>
      </div>

      {/* Inventory writes */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            Inventory Changes
          </p>
        </div>
        <div className="px-4">
          <SummaryRow label="New inventory batches" value={willImport} color="green" />
          <SummaryRow label="Batches merged (add to qty)" value={willMerge} color="blue" />
          <SummaryRow label="Batches replaced" value={willReplace} color="amber" />
          <SummaryRow label="Batches skipped" value={willSkip} color="slate" />
          <SummaryRow label="Rows with errors (skipped)" value={blocked} color="red" />
        </div>
      </div>

      {/* Medicine catalog summary */}
      {autoSummary && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Medicine Catalog — Handled Automatically
            </p>
          </div>

          <div className="px-4 py-4 space-y-3">
            <MedicineGroup
              title="Already in your shop"
              icon={CheckCircle}
              colorClass="text-blue-500"
              badgeClass="bg-blue-100 text-blue-700"
              items={groupedPlans.existing}
              defaultOpen={false}
            />

            <MedicineGroup
              title="Auto-linked to master catalog"
              icon={Link2}
              colorClass="text-emerald-500"
              badgeClass="bg-emerald-100 text-emerald-700"
              items={groupedPlans.linked}
              defaultOpen={false}
            />

            <MedicineGroup
              title="Suggested match — needs review"
              icon={HelpCircle}
              colorClass="text-amber-500"
              badgeClass="bg-amber-100 text-amber-700"
              items={groupedPlans.suggested}
              defaultOpen={true}
            />

            <MedicineGroup
              title="No catalog match — usable in ERP"
              icon={XCircle}
              colorClass="text-gray-400"
              badgeClass="bg-gray-100 text-gray-600"
              items={groupedPlans.unlinked}
              defaultOpen={true}
            />
          </div>

          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-xs text-blue-700">
              Medicines not matched to the catalog will still appear in your
              inventory and can be linked later from the Medicines page.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">
            {totalWritten.toLocaleString()} inventory record
            {totalWritten !== 1 ? "s" : ""}
          </span>{" "}
          will be created or updated. This cannot be undone.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        onClick={onConfirm}
        disabled={loading || totalWritten === 0}
        className={`
          w-full flex items-center justify-center gap-2 py-3.5 px-6
          rounded-xl font-bold text-base transition-all
          ${
            !loading && totalWritten > 0
              ? "bg-[#000060] text-white hover:bg-indigo-800 shadow-lg shadow-indigo-900/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Importing...
          </>
        ) : (
          `Import ${totalWritten.toLocaleString()} Record${totalWritten !== 1 ? "s" : ""}`
        )}
      </button>

      {totalWritten === 0 && !loading && (
        <p className="text-xs text-center text-gray-500">
          Nothing to import. All rows were skipped or had errors.
        </p>
      )}
    </div>
  );
};

export default ImportConfirmStep;