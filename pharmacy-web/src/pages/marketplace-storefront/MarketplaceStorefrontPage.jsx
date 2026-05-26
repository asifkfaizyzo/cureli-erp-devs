import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { useStorefrontPage }  from "../../hooks/marketplace/useStorefrontPage";
import { usePermission }      from "../../hooks/usePermission";
import { useToast }           from "../../components/common/Toast";
import ConfirmDialog          from "../../components/common/ConfirmDialog";
import { PERMISSIONS }        from "../../config/permissions";
import EditBrandingModal      from "./components/EditBrandingModal";
import EditBranchModal        from "./components/EditBranchModal";

// Layout components
import PageSkeleton           from "./components/PageSkeleton";
import ErrorState             from "./components/ErrorState";
import SuspendedBanner        from "./components/SuspendedBanner";
import StorefrontHeader       from "./components/StorefrontHeader";
import StorefrontMetrics      from "./components/StorefrontMetrics";
import StorefrontIdentity     from "./components/StorefrontIdentity";
import BranchOperations       from "./components/BranchOperations";

// ─────────────────────────────────────────────────────────────────

const MarketplaceStorefrontPage = () => {
  const toast = useToast();
  const { isSuperAdmin, isStaff, hasPermission, branchId } = usePermission();

  const {
    storefront,
    branches,
    isLoading,
    storefrontError,
    branchesError,
    isSuspending,
    isResuming,
    togglingBranchId,
    isUploading,
    uploadProgress,
    enabledBranchCount,
    deliveryEnabledCount,
    pickupEnabledCount,
    isSuspended,
    isLive,
    totalBranchCount,
    load,
    refresh,
    toggleBranch,
    saveBranchConfig,
    saveStorefrontData,
    uploadAsset,
    suspend,
    resume,
  } = useStorefrontPage();

  const canManage  = hasPermission(PERMISSIONS.MARKETPLACE_MANAGE);
  const canSuspend = hasPermission(PERMISSIONS.MARKETPLACE_SUSPEND);

  const [confirmDialog,     setConfirmDialog]     = useState({ open: false, type: null });
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [branchModal,       setBranchModal]       = useState({ open: false, branch: null });

  useEffect(() => {
    load({ isSuperAdmin, branchId });
  }, [load, isSuperAdmin, branchId]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleToggleBranch = async (branch_id, newValue) => {
    try {
      await toggleBranch(branch_id, newValue);
      toast.success(
        newValue ? "Branch enabled"  : "Branch disabled",
        newValue
          ? "This branch is now visible in the marketplace."
          : "This branch has been removed from the marketplace."
      );
    } catch {
      toast.error("Toggle failed", "Could not update branch status. Please try again.");
    }
  };

  const handleConfirmAction = async () => {
    const { type } = confirmDialog;
    setConfirmDialog({ open: false, type: null });

    if (type === "suspend") {
      const result = await suspend();
      result.success
        ? toast.warning("Marketplace suspended", "All branches are now offline.")
        : toast.error("Suspend failed", result.error);
    }

    if (type === "resume") {
      const result = await resume();
      result.success
        ? toast.success("Marketplace resumed", "Your marketplace is live again.")
        : toast.error("Resume failed", result.error);
    }
  };

  const handleBrandingSave = async (data) => {
    const result = await saveStorefrontData(data);
    if (result.success) toast.success("Branding updated", "Your storefront looks great.");
    return result;
  };

  const handleBranchSave = async (branch_id, payload) => {
    const result = await saveBranchConfig(branch_id, payload);
    if (result.success) toast.success("Branch updated", "Branch marketplace settings saved successfully.");
    return result;
  };

  // ── Render Guards ─────────────────────────────────────────────

  if (isLoading) {
    return <div className="min-h-screen bg-[#010015]"><PageSkeleton /></div>;
  }

  if (storefrontError && branchesError) {
    return <div className="min-h-screen bg-[#010015]"><ErrorState message={storefrontError} onRetry={refresh} /></div>;
  }

  // ── Main Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#010015]">
      <div className="space-y-6">

        <AnimatePresence>
          {isSuspended && (
            <SuspendedBanner
              onResume={() => setConfirmDialog({ open: true, type: "resume" })}
              isResuming={isResuming}
              canSuspend={canSuspend}
            />
          )}
        </AnimatePresence>

        <StorefrontHeader
          storefront={storefront}
          isLive={isLive}
          isSuspending={isSuspending}
          canSuspend={canSuspend}
          onSuspendClick={() => setConfirmDialog({ open: true, type: "suspend" })}
        />

        <StorefrontMetrics
          storefront={storefront}
          isLive={isLive}
          isSuspended={isSuspended}
          enabledBranchCount={enabledBranchCount}
          totalBranchCount={totalBranchCount}
          deliveryEnabledCount={deliveryEnabledCount}
          pickupEnabledCount={pickupEnabledCount}
        />

        <StorefrontIdentity
          storefront={storefront}
          isSuperAdmin={isSuperAdmin}
          onEditBranding={() => setBrandingModalOpen(true)}
        />

        <BranchOperations
          branches={branches}
          branchesError={branchesError}
          totalBranchCount={totalBranchCount}
          enabledBranchCount={enabledBranchCount}
          canManage={canManage}
          togglingBranchId={togglingBranchId}
          isSuperAdmin={isSuperAdmin}
          isStaff={isStaff}
          onToggle={handleToggleBranch}
          onEdit={(branch) => setBranchModal({ open: true, branch })}
          onRetry={refresh}
        />

        <div className="h-6" />
      </div>

      {/* ── Modals & Dialogs ───────────────────────────────────── */}

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.type === "suspend" ? "Suspend Marketplace?" : "Resume Marketplace?"}
        message={
          confirmDialog.type === "suspend"
            ? "This will immediately take all branches offline. Customers will not be able to place orders until you resume."
            : "This will restore your marketplace to live status. You will need to re-enable each branch individually."
        }
        confirmText={confirmDialog.type === "suspend" ? "Yes, Suspend" : "Yes, Resume"}
        cancelText="Cancel"
        type={confirmDialog.type === "suspend" ? "danger" : "warning"}
        loading={isSuspending || isResuming}
      />

      <EditBrandingModal
        isOpen={brandingModalOpen}
        onClose={() => setBrandingModalOpen(false)}
        storefront={storefront}
        onSave={handleBrandingSave}
        onUpload={uploadAsset}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <EditBranchModal
        isOpen={branchModal.open}
        onClose={() => setBranchModal({ open: false, branch: null })}
        branch={branchModal.branch}
        isSuperAdmin={isSuperAdmin}
        onSave={handleBranchSave}
      />
    </div>
  );
};

export default MarketplaceStorefrontPage;