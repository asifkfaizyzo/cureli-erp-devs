// src/hooks/marketplace/useStorefrontPage.js

import { useState, useCallback, useRef } from "react";
import {
  getMarketplaceStatus,
  updateStorefront,
  updateBranchSettings,
  suspendMarketplace,
  resumeMarketplace,
  uploadMarketplaceAsset,
} from "../../api/marketplace";

// ─────────────────────────────────────────────────────────────────
// IMAGE URL RESOLVER
// Mirrors PreviewStep.jsx — the established pattern in this codebase.
// S3 URLs come back as full https:// from the upload controller.
// Relative paths (legacy or proxy) get prefixed with VITE_API_URL.
// ─────────────────────────────────────────────────────────────────
export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

// ─────────────────────────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────────────────────────

function normalizeStorefront(raw) {
  return {
    marketplace_profile_id: raw.marketplace_profile_id ?? null,
    storefront_name:        raw.storefront_name        ?? "",
    storefront_description: raw.storefront_description ?? "",
    support_phone:          raw.support_phone          ?? "",
    // Resolve image URLs at normalization time so every consumer gets
    // a ready-to-use src string — no inline resolution needed in JSX.
    logo_url:               resolveImageUrl(raw.logo_url),
    banner_url:             resolveImageUrl(raw.banner_url),
    marketplace_status:     raw.marketplace_status     ?? "LIVE",
    is_live:                raw.is_live                ?? false,
    onboarding_completed:   raw.onboarding_completed   ?? false,
  };
}

// Normalize a BranchMarketplaceSettings record that came with branch include
function normalizeConfiguredBranch(bs) {
  return {
    // Branch identity
    branch_id:    bs.branch_id,
    branch_name:  bs.branch?.branch_name    ?? "Unknown Branch",
    branch_type:  bs.branch?.branch_type    ?? "branch",
    city:         bs.branch?.city           ?? null,
    state:        bs.branch?.state          ?? null,
    contact_number: bs.branch?.contact_number ?? null,

    // Marketplace settings
    branch_marketplace_id: bs.branch_marketplace_id ?? null,
    is_configured:         true,   // has a BranchMarketplaceSettings row
    marketplace_enabled:   bs.marketplace_enabled ?? false,

    // Location
    latitude:          bs.latitude  != null ? Number(bs.latitude)  : null,
    longitude:         bs.longitude != null ? Number(bs.longitude) : null,
    google_place_id:   bs.google_place_id   ?? null,
    formatted_address: bs.formatted_address ?? null,

    // Timings
    opening_time: bs.opening_time ?? null,
    closing_time: bs.closing_time ?? null,
    is_24_hours:  bs.is_24_hours  ?? false,

    // Fulfillment
    pickup_enabled:   bs.pickup_enabled   ?? false,
    delivery_enabled: bs.delivery_enabled ?? false,

    // Contact
    contact_override: bs.contact_override ?? null,
  };
}

// Normalize a raw Branch record that has NO marketplace settings yet
function normalizeUnconfiguredBranch(b) {
  return {
    // Branch identity
    branch_id:     b.branch_id,
    branch_name:   b.branch_name,
    branch_type:   b.branch_type   ?? "branch",
    city:          b.city          ?? null,
    state:         b.state         ?? null,
    contact_number: b.contact_number ?? null,

    // Marketplace settings — all defaults
    branch_marketplace_id: null,
    is_configured:         false,  // no BranchMarketplaceSettings row yet
    marketplace_enabled:   false,

    // Location
    latitude:          null,
    longitude:         null,
    google_place_id:   null,
    formatted_address: null,

    // Timings
    opening_time: null,
    closing_time: null,
    is_24_hours:  false,

    // Fulfillment
    pickup_enabled:   false,
    delivery_enabled: false,

    // Contact
    contact_override: null,
  };
}

// ─────────────────────────────────────────────────────────────────
// MERGE: all_branches + branch_settings → unified branch list
//
// For super_admin: shows ALL shop branches, configured or not.
// For branch_admin/staff: the status endpoint already returns
//   all_branches for the whole shop (it's informational), but
//   branch_settings is scoped to their branch by the backend.
//   We only show branches that appear in branch_settings for
//   non-super-admin roles — handled by passing the caller's
//   branch_id filter into the merge.
// ─────────────────────────────────────────────────────────────────
function mergeBranches(allBranches, branchSettings, isSuperAdmin, callerBranchId) {
  // Build a lookup map of configured branches
  const settingsMap = new Map(
    branchSettings.map((bs) => [bs.branch_id, bs])
  );

  // For super_admin: merge all branches
  // For branch_admin/staff: only show their assigned branch
  const branchesToShow = isSuperAdmin
    ? allBranches
    : allBranches.filter((b) => b.branch_id === callerBranchId);

  return branchesToShow.map((b) => {
    const settings = settingsMap.get(b.branch_id);
    if (settings) {
      return normalizeConfiguredBranch(settings);
    }
    return normalizeUnconfiguredBranch(b);
  });
}

// ─────────────────────────────────────────────────────────────────
// PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────
function buildBranchPayload(branch, overrides = {}) {
  const merged = { ...branch, ...overrides };
  return {
    marketplace_enabled:  merged.marketplace_enabled,
    latitude:             merged.latitude             ?? null,
    longitude:            merged.longitude            ?? null,
    google_place_id:      merged.google_place_id      ?? null,
    formatted_address:    merged.formatted_address    ?? null,
    opening_time:         merged.opening_time         ?? null,
    closing_time:         merged.closing_time         ?? null,
    is_24_hours:          merged.is_24_hours          ?? false,
    pickup_enabled:       merged.pickup_enabled       ?? false,
    delivery_enabled:     merged.delivery_enabled     ?? false,
    contact_override:     merged.contact_override     ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────
export function useStorefrontPage() {

  // ── Data ──────────────────────────────────
  const [storefront, setStorefront] = useState(null);
  const [branches, setBranches]     = useState([]);

  // ── Loading ───────────────────────────────
  const [isLoading,           setIsLoading]           = useState(false);
  const [storefrontError,     setStorefrontError]     = useState(null);
  const [branchesError,       setBranchesError]       = useState(null);

  // ── Action states ─────────────────────────
  const [isSuspending,         setIsSuspending]         = useState(false);
  const [isResuming,           setIsResuming]           = useState(false);
  const [isUpdatingStorefront, setIsUpdatingStorefront] = useState(false);
  const [togglingBranchId,     setTogglingBranchId]     = useState(null);
  const [savingBranchId,       setSavingBranchId]       = useState(null);
  const [isUploading,          setIsUploading]          = useState({});
  const [uploadProgress,       setUploadProgress]       = useState({});

  // ── Internal ──────────────────────────────
  // Store caller info for branch merging
  const callerRef    = useRef({ isSuperAdmin: false, branchId: null });
  const hasLoaded    = useRef(false);

  // ─────────────────────────────────────────
  // LOAD
  // Single call to /marketplace/status gives us:
  //   - storefront identity fields
  //   - marketplace_status / is_live
  //   - all_branches (every active ERP branch)
  //   - branch_settings (configured marketplace branches)
  //
  // We merge all_branches + branch_settings client-side to produce
  // the unified branch list including unconfigured branches.
  // ─────────────────────────────────────────
  const load = useCallback(async ({ isSuperAdmin = false, branchId = null } = {}) => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    // Store caller info for use in refresh
    callerRef.current = { isSuperAdmin, branchId };

    setIsLoading(true);
    setStorefrontError(null);
    setBranchesError(null);

    try {
      const res  = await getMarketplaceStatus();
      const data = res.data?.data;

      if (!data) throw new Error("Invalid response from server");

      // Storefront
      setStorefront(normalizeStorefront(data));

      // Branches
      const allBranches     = data.all_branches    ?? [];
      const branchSettings  = data.branch_settings ?? [];

      const merged = mergeBranches(
        allBranches,
        branchSettings,
        isSuperAdmin,
        branchId
      );
      setBranches(merged);

    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? "Failed to load";
      setStorefrontError(message);
      setBranchesError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────
  // REFRESH
  // Force re-fetch. Reuses stored caller info.
  // ─────────────────────────────────────────
  const refresh = useCallback(async () => {
    const { isSuperAdmin, branchId } = callerRef.current;

    setStorefrontError(null);
    setBranchesError(null);

    try {
      const res  = await getMarketplaceStatus();
      const data = res.data?.data;

      if (!data) throw new Error("Invalid response from server");

      setStorefront(normalizeStorefront(data));

      const allBranches    = data.all_branches    ?? [];
      const branchSettings = data.branch_settings ?? [];

      const merged = mergeBranches(
        allBranches,
        branchSettings,
        isSuperAdmin,
        branchId
      );
      setBranches(merged);

    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? "Failed to refresh";
      setStorefrontError(message);
      setBranchesError(message);
    }
  }, []);

  // ─────────────────────────────────────────
  // TOGGLE BRANCH marketplace_enabled
  // Optimistic UI with rollback on error.
  // For unconfigured branches (is_configured: false),
  // toggling ON will create the settings record via upsert.
  // ─────────────────────────────────────────
  const toggleBranch = useCallback(
    async (branch_id, newValue) => {
      if (togglingBranchId) return;

      const currentBranch = branches.find((b) => b.branch_id === branch_id);
      if (!currentBranch) return;

      // Optimistic update
      setBranches((prev) =>
        prev.map((b) =>
          b.branch_id === branch_id
            ? { ...b, marketplace_enabled: newValue, is_configured: true }
            : b
        )
      );

      setTogglingBranchId(branch_id);

      try {
        const payload = buildBranchPayload(currentBranch, {
          marketplace_enabled: newValue,
        });
        await updateBranchSettings(branch_id, payload);
        // After successful toggle, refresh to get server state
        // (is_configured will now be true if it wasn't before)
        await refresh();
      } catch (err) {
        // Roll back
        setBranches((prev) =>
          prev.map((b) =>
            b.branch_id === branch_id
              ? { ...b, marketplace_enabled: !newValue }
              : b
          )
        );
        throw err;
      } finally {
        setTogglingBranchId(null);
      }
    },
    [branches, togglingBranchId, refresh]
  );

  // ─────────────────────────────────────────
  // SAVE BRANCH CONFIG (from modal)
  // ─────────────────────────────────────────
  const saveBranchConfig = useCallback(
    async (branch_id, formData) => {
      setSavingBranchId(branch_id);
      try {
        await updateBranchSettings(branch_id, formData);
        await refresh();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message ?? err.message ?? "Failed to save",
        };
      } finally {
        setSavingBranchId(null);
      }
    },
    [refresh]
  );

  // ─────────────────────────────────────────
  // SAVE STOREFRONT (from modal)
  // ─────────────────────────────────────────
  const saveStorefrontData = useCallback(
    async (formData) => {
      setIsUpdatingStorefront(true);
      try {
        await updateStorefront(formData);
        await refresh();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message ?? err.message ?? "Failed to update storefront",
        };
      } finally {
        setIsUpdatingStorefront(false);
      }
    },
    [refresh]
  );

  // ─────────────────────────────────────────
  // UPLOAD ASSET
  // ─────────────────────────────────────────
  const uploadAsset = useCallback(async (type, file) => {
    setIsUploading((prev)    => ({ ...prev, [type]: true  }));
    setUploadProgress((prev) => ({ ...prev, [type]: 0     }));
    try {
      const res  = await uploadMarketplaceAsset(type, file, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [type]: pct }));
      });
      const data = res.data?.data;
      if (!data?.url) throw new Error("Upload response missing URL");
      // Resolve the URL immediately so the modal can use it in an <img>
      return { success: true, url: resolveImageUrl(data.url) };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? err.message ?? "Upload failed",
      };
    } finally {
      setIsUploading((prev)    => ({ ...prev, [type]: false }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0     }));
    }
  }, []);

  // ─────────────────────────────────────────
  // SUSPEND
  // ─────────────────────────────────────────
  const suspend = useCallback(async () => {
    setIsSuspending(true);
    try {
      await suspendMarketplace();
      await refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? err.message ?? "Failed to suspend",
      };
    } finally {
      setIsSuspending(false);
    }
  }, [refresh]);

  // ─────────────────────────────────────────
  // RESUME
  // ─────────────────────────────────────────
  const resume = useCallback(async () => {
    setIsResuming(true);
    try {
      await resumeMarketplace();
      await refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? err.message ?? "Failed to resume",
      };
    } finally {
      setIsResuming(false);
    }
  }, [refresh]);

  // ─────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────
  const enabledBranchCount   = branches.filter((b) => b.marketplace_enabled).length;
  const deliveryEnabledCount = branches.filter((b) => b.marketplace_enabled && b.delivery_enabled).length;
  const pickupEnabledCount   = branches.filter((b) => b.marketplace_enabled && b.pickup_enabled).length;
  const isSuspended          = storefront?.marketplace_status === "SUSPENDED";
  const isLive               = storefront?.marketplace_status === "LIVE";

  return {
    // Data
    storefront,
    branches,

    // Loading
    isLoading,
    storefrontError,
    branchesError,

    // Action states
    isSuspending,
    isResuming,
    isUpdatingStorefront,
    togglingBranchId,
    savingBranchId,
    uploadProgress,
    isUploading,

    // Derived
    enabledBranchCount,
    deliveryEnabledCount,
    pickupEnabledCount,
    isSuspended,
    isLive,
    totalBranchCount: branches.length,

    // Actions
    load,
    refresh,
    toggleBranch,
    saveBranchConfig,
    saveStorefrontData,
    uploadAsset,
    suspend,
    resume,
  };
}