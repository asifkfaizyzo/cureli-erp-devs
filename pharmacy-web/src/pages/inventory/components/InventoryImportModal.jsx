import React, { useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { useInventoryImport, STEPS } from "../../../hooks/inventory/useInventoryImport";
import ImportUploadStep      from "./import/ImportUploadStep";
import ImportProcessingStep  from "./import/ImportProcessingStep";
import ImportConflictStep    from "./import/ImportConflictStep";
import ImportConfirmStep     from "./import/ImportConfirmStep";
import ImportResultStep      from "./import/ImportResultStep";

const STEP_TITLES = {
  [STEPS.UPLOAD]:     "Import Inventory",
  [STEPS.PROCESSING]: "Processing File",
  [STEPS.CONFLICTS]:  "Resolve Batch Conflicts",
  [STEPS.CONFIRM]:    "Confirm Import",
  [STEPS.WRITING]:    "Importing...",
  [STEPS.RESULT]:     "Import Complete",
};

// Shown while background write is running after confirm
const ImportWritingStep = ({ totalRows, fileName }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 gap-6">
    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
      <Loader2 size={32} className="text-[#000060] animate-spin" />
    </div>
    <div className="text-center space-y-2">
      <p className="text-base font-semibold text-gray-800">
        Writing to inventory...
      </p>
      <p className="text-sm text-gray-500">
        {fileName && (
          <span className="font-medium text-gray-700">{fileName} — </span>
        )}
        {totalRows > 0 ? `${totalRows.toLocaleString()} rows` : ""}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        This may take a minute for large files. Please keep this window open.
      </p>
    </div>
  </div>
);

const InventoryImportModal = ({ open, onClose, onSuccess }) => {
  const hook = useInventoryImport();

  const handleClose = useCallback(() => {
    // Prevent closing while write is in progress — data integrity risk
    if (hook.step === STEPS.WRITING) return;

    if (
      hook.importJobId &&
      !["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(hook.jobStatus)
    ) {
      hook.cancelImport();
    } else {
      hook.reset();
    }
    onClose();
  }, [hook, onClose]);

  const handleSuccess = useCallback(() => {
    onClose();
    if (onSuccess) onSuccess();
    hook.reset();
  }, [hook, onClose, onSuccess]);

  if (!open) return null;

  const isWriting = hook.step === STEPS.WRITING;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={isWriting ? undefined : handleClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#000060] to-indigo-800">
          <h2 className="text-white text-lg font-semibold">
            {STEP_TITLES[hook.step] || "Import Inventory"}
          </h2>
          {/* Hide close button while writing — can't cancel mid-write */}
          {!isWriting && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {hook.step === STEPS.UPLOAD && (
            <ImportUploadStep
              onUpload={hook.uploadFile}
              loading={hook.loading}
              error={hook.error}
              onClearError={hook.clearError}
              duplicateFileWarning={hook.duplicateFileWarning}
            />
          )}

          {hook.step === STEPS.PROCESSING && (
            <ImportProcessingStep
              fileName={hook.selectedFile?.name}
              totalRows={hook.totalRows}
              processingPhase={hook.processingPhase}
              processingProgress={hook.processingProgress}
              phaseLabel={hook.phaseLabel}
              detectedSoftware={hook.detectedSoftware}
              error={hook.error}
              onCancel={handleClose}
            />
          )}

          {hook.step === STEPS.CONFLICTS && (
            <ImportConflictStep
              conflictReport={hook.conflictReport}
              userConflictDecisions={hook.userConflictDecisions}
              onSetDecision={hook.setConflictDecision}
              onSetAll={hook.setAllConflictDecisions}
              resolvedCount={hook.resolvedConflictCount}
              totalCount={hook.totalConflictCount}
              allDone={hook.allConflictsDone}
              onProceed={hook.proceedFromConflicts}
              loading={hook.loading}
              error={hook.error}
              onClearError={hook.clearError}
            />
          )}

          {hook.step === STEPS.CONFIRM && (
            <ImportConfirmStep
              summary={hook.preWriteSummary}
              autoSummary={hook.autoSummary}
              medicinePlans={hook.medicinePlans}
              fileName={hook.selectedFile?.name}
              detectedSoftware={hook.detectedSoftware}
              validRows={hook.validRows}
              errorRows={hook.errorRows}
              onConfirm={hook.confirmImport}
              loading={hook.loading}
              error={hook.error}
              onClearError={hook.clearError}
            />
          )}

          {hook.step === STEPS.WRITING && (
            <ImportWritingStep
              fileName={hook.selectedFile?.name}
              totalRows={hook.totalRows}
            />
          )}

          {hook.step === STEPS.RESULT && (
            <ImportResultStep
              result={hook.importResult}
              autoSummary={hook.autoSummary}
              medicinePlans={hook.medicinePlans}
              fileName={hook.selectedFile?.name}
              importJobId={hook.importJobId}
              onDone={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryImportModal;