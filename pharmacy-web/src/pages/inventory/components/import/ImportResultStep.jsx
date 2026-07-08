import React, { useMemo, useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Link2,
  HelpCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
} from "lucide-react";
import inventoryImportAPI from "../../../../api/inventoryImport";

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

const ImportResultStep = ({
  result,
  autoSummary,
  medicinePlans,
  fileName,
  importJobId,
  onDone,
}) => {
  const [showErrors, setShowErrors] = useState(false);

  if (!result) return null;

  const totalWritten =
    (result.importedRows || 0) +
    (result.mergedRows || 0) +
    (result.replacedRows || 0);

  const isFullSuccess = result.errorRows === 0;
  const isPartial = result.errorRows > 0 && totalWritten > 0;
  const isFullFailure = totalWritten === 0;

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
      {/* Result banner */}
      <div
        className={`
        flex items-start gap-4 p-5 rounded-2xl border
        ${
          isFullSuccess
            ? "bg-emerald-50 border-emerald-200"
            : isPartial
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
        }
      `}
      >
        <div
          className={`
          w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
          ${
            isFullSuccess
              ? "bg-emerald-100"
              : isPartial
                ? "bg-amber-100"
                : "bg-red-100"
          }
        `}
        >
          {isFullFailure ? (
            <AlertTriangle size={24} className="text-red-600" />
          ) : (
            <CheckCircle
              size={24}
              className={isFullSuccess ? "text-emerald-600" : "text-amber-600"}
            />
          )}
        </div>
        <div>
          <p
            className={`text-base font-bold ${
              isFullSuccess
                ? "text-emerald-800"
                : isPartial
                  ? "text-amber-800"
                  : "text-red-800"
            }`}
          >
            {isFullSuccess
              ? "Import Successful"
              : isPartial
                ? "Import Partially Successful"
                : "Import Failed"}
          </p>
          <p
            className={`text-sm mt-1 ${
              isFullSuccess
                ? "text-emerald-700"
                : isPartial
                  ? "text-amber-700"
                  : "text-red-700"
            }`}
          >
            {isFullSuccess
              ? `${totalWritten.toLocaleString()} inventory records created or updated.`
              : isPartial
                ? `${totalWritten.toLocaleString()} records imported. ${result.errorRows} rows had errors.`
                : "No records were imported due to errors."}
          </p>
        </div>
      </div>

      {/* Inventory summary */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            Inventory Changes
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            {
              label: "New batches created",
              value: result.importedRows,
              color: "text-emerald-700",
            },
            {
              label: "Batches merged",
              value: result.mergedRows,
              color: "text-blue-700",
            },
            {
              label: "Batches replaced",
              value: result.replacedRows,
              color: "text-amber-700",
            },
            {
              label: "Rows skipped",
              value: result.skippedRows,
              color: "text-gray-500",
            },
            {
              label: "Rows with errors",
              value: result.errorRows,
              color: "text-red-600",
            },
          ]
            .filter((r) => r.value > 0)
            .map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>
                  {row.value.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Catalog summary */}
      {result.newMedicinesCreated > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              {result.newMedicinesCreated} New Medicines Created
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
              title="Suggested match — review later"
              icon={HelpCircle}
              colorClass="text-amber-500"
              badgeClass="bg-amber-100 text-amber-700"
              items={groupedPlans.suggested}
              defaultOpen={false}
            />

            <MedicineGroup
              title="No catalog match — manually link later"
              icon={XCircle}
              colorClass="text-gray-400"
              badgeClass="bg-gray-100 text-gray-600"
              items={groupedPlans.unlinked}
              defaultOpen={false}
            />
          </div>

          {(result.catalogSuggested > 0 || result.catalogUnlinked > 0) && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
              <p className="text-xs text-amber-700">
                {(result.catalogSuggested || 0) + (result.catalogUnlinked || 0)} medicines
                need catalog linking for marketplace visibility.
              </p>
              <button
                onClick={onDone}
                className="flex items-center gap-1 text-xs font-medium text-amber-800 underline underline-offset-2"
              >
                View medicines <ExternalLink size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error detail */}
      {result.errors?.length > 0 && (
        <div className="border border-red-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowErrors((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <span className="text-sm font-medium text-red-700">
              Error details ({result.errors.length})
            </span>
            {showErrors ? (
              <ChevronUp size={16} className="text-red-600" />
            ) : (
              <ChevronDown size={16} className="text-red-600" />
            )}
          </button>
          {showErrors && (
            <div className="max-h-48 overflow-y-auto divide-y divide-red-100">
              {result.errors.slice(0, 50).map((err, i) => (
                <div key={i} className="px-4 py-2.5 text-xs">
                  <span className="font-medium text-gray-700">
                    Row {(err.rowIndex ?? 0) + 1}: {err.productName}
                  </span>
                  <span className="mx-1 text-gray-400">—</span>
                  <span className="text-red-600">{err.message}</span>
                </div>
              ))}
              {result.errors.length > 50 && (
                <div className="px-4 py-2 text-xs text-gray-400 text-center">
                  ...and {result.errors.length - 50} more errors
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Download error report */}
      {importJobId && result.errors?.length > 0 && (
        <a
          href={inventoryImportAPI.downloadErrorReport(importJobId)}
          download
          className="w-full flex items-center justify-center gap-2 py-2.5 px-6 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
        >
          Download Error Report
        </a>
      )}

      {/* Done */}
      <button
        onClick={onDone}
        className="w-full py-3 px-6 bg-[#000060] text-white font-semibold text-sm rounded-xl hover:bg-indigo-800 transition-colors"
      >
        View Inventory
      </button>
    </div>
  );
};

export default ImportResultStep;