// src/store/useMarketplaceStore.js

import { create } from "zustand";
import {
  getMarketplaceStatus,
  saveDraft as apiSaveDraft,
  saveStorefront as apiSaveStorefront,
  saveBranchSelections as apiSaveBranchSelections,
  saveBranchConfig as apiSaveBranchConfig,
  goLive as apiGoLive,
} from "../api/marketplace";

// ─────────────────────────────────────────────
// INTERNAL FLAG KEYS
// These are UI-only and must never reach the backend.
// ─────────────────────────────────────────────
const INTERNAL_FLAGS = ["_persisted", "_dirty"];

/**
 * Strip internal UI flags from a single branch config object
 * before sending to the backend draft autosave.
 */
function stripInternalFlags(config) {
  const clean = { ...config };
  for (const flag of INTERNAL_FLAGS) {
    delete clean[flag];
  }
  return clean;
}

/**
 * Strip internal flags from the entire branchConfigs map.
 */
function cleanBranchConfigsForDraft(branchConfigs) {
  const result = {};
  for (const [branch_id, config] of Object.entries(branchConfigs)) {
    result[branch_id] = stripInternalFlags(config);
  }
  return result;
}

// ─────────────────────────────────────────────
// DRAFT AUTOSAVE DEBOUNCE
// ─────────────────────────────────────────────
let draftTimer = null;

function scheduleDraftSave(getState) {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(async () => {
    const state = getState();
    if (state.marketplaceStatus === "LIVE") return;

    try {
      await apiSaveDraft({
        currentStep: state.currentStep,
        storefront: state.storefront,
        selectedBranchIds: state.selectedBranchIds,
        // ← Fix 3: strip _dirty and _persisted before sending to backend
        branchConfigs: cleanBranchConfigsForDraft(state.branchConfigs),
      });
      getState().setLastSavedAt(new Date());
    } catch (err) {
      console.warn("[marketplace] Draft autosave failed:", err.message);
    } finally {
      getState().setDraftSaving(false);
    }
  }, 1500);
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────
export const useMarketplaceStore = create((set, get) => ({
  // ── Status ────────────────────────────────
  marketplaceStatus: null,
  onboardingCompleted: false,
  isLive: false,
  isStatusLoaded: false,
  isStatusLoading: false,

  // ── Onboarding wizard ─────────────────────
  currentStep: 1,

  storefront: {
    storefront_name: "",
    storefront_description: "",
    support_phone: "",
    logo_url: null,
    banner_url: null,
  },

  selectedBranchIds: [],
  branchConfigs: {},
  allBranches: [],
  savedBranchSettings: [],

  // ── Draft ─────────────────────────────────
  isDraftSaving: false,
  lastSavedAt: null,

  // ── Go-live ───────────────────────────────
  goLiveErrors: [],
  isGoingLive: false,

  // ── Submission ────────────────────────────
  isSubmitting: false,
  submitError: null,

  // ─────────────────────────────────────────
  // INTERNAL SETTERS
  // ─────────────────────────────────────────
  setLastSavedAt: (time) => set({ lastSavedAt: time }),
  setDraftSaving: (val) => set({ isDraftSaving: val }),

  // ─────────────────────────────────────────
  // LOAD STATUS
  // ─────────────────────────────────────────
  loadStatus: async () => {
    if (get().isStatusLoading) return;

    set({ isStatusLoading: true });

    try {
      const res = await getMarketplaceStatus();
      const data = res.data?.data;
      if (!data) throw new Error("Invalid status response");

      const draft = data.onboarding_draft;

      const nextState = {
        marketplaceStatus: data.marketplace_status,
        onboardingCompleted: data.onboarding_completed,
        isLive: data.is_live,
        isStatusLoaded: true,
        isStatusLoading: false,
        allBranches: data.all_branches || [],
        savedBranchSettings: data.branch_settings || [],
      };

      // Resume from draft if present
      if (draft && typeof draft === "object") {
        if (draft.currentStep) nextState.currentStep = draft.currentStep;
        if (draft.storefront) {
          nextState.storefront = { ...get().storefront, ...draft.storefront };
        }
        if (draft.selectedBranchIds) {
          nextState.selectedBranchIds = draft.selectedBranchIds;
        }
        if (draft.branchConfigs) {
          nextState.branchConfigs = draft.branchConfigs;
        }
      }

      // ── Fix 1 + 2: Build savedConfigs WITH _persisted flag ──────
      // These represent backend-confirmed state.
      // _persisted: true means this branch config exists in the DB.
      const savedBranchIds = new Set(
        (data.branch_settings || []).map((bs) => bs.branch_id)
      );

      const savedConfigs = {};
      for (const bs of data.branch_settings || []) {
        savedConfigs[bs.branch_id] = {
          marketplace_enabled: bs.marketplace_enabled,
          shop_image_url:      bs.shop_image_url || null,
          latitude: bs.latitude ? Number(bs.latitude) : null,
          longitude: bs.longitude ? Number(bs.longitude) : null,
          google_place_id: bs.google_place_id || null,
          formatted_address: bs.formatted_address || null,
          opening_time: bs.opening_time || null,
          closing_time: bs.closing_time || null,
          is_24_hours: bs.is_24_hours || false,
          pickup_enabled: bs.pickup_enabled || false,
          delivery_enabled: bs.delivery_enabled || false,
          contact_override: bs.contact_override || null,
          // ← Fix 1: mark as persisted on initial load
          _persisted: true,
          _dirty: false,
        };
      }

      // Draft overrides saved (draft is more recent user input)
      // but we must re-apply _persisted for branches that exist in backend
      const mergedConfigs = {
        ...savedConfigs,
        ...nextState.branchConfigs,
      };

      // ── Fix 2: Re-apply _persisted after draft merge ─────────────
      // Draft may have come from DB without _persisted (written before
      // this flag existed). Re-stamp it for any branch in branch_settings.
      for (const branch_id of savedBranchIds) {
        if (mergedConfigs[branch_id]) {
          mergedConfigs[branch_id] = {
            ...mergedConfigs[branch_id],
            _persisted: true,
            // Keep _dirty as-is from draft — user may have unsaved changes
          };
        }
      }

      nextState.branchConfigs = mergedConfigs;

      // Pre-populate selectedBranchIds from saved settings if no draft
      if (!draft?.selectedBranchIds && data.branch_settings?.length > 0) {
        nextState.selectedBranchIds = data.branch_settings.map(
          (b) => b.branch_id
        );
      }

      // Pre-populate storefront from saved profile if no draft
      if (!draft?.storefront) {
        nextState.storefront = {
          storefront_name: data.storefront_name || "",
          storefront_description: data.storefront_description || "",
          support_phone: data.support_phone || "",
          logo_url: data.logo_url || null,
          banner_url: data.banner_url || null,
        };
      }

      set(nextState);
    } catch (err) {
      console.error("[marketplace] loadStatus error:", err);
      set({ isStatusLoaded: true, isStatusLoading: false });
    }
  },

  // ─────────────────────────────────────────
  // STEP NAVIGATION
  // ─────────────────────────────────────────
  setStep: (step) => {
    set({ currentStep: step, isDraftSaving: true });
    scheduleDraftSave(get);
  },

  // ─────────────────────────────────────────
  // STOREFRONT UPDATES (Step 2)
  // ─────────────────────────────────────────
  updateStorefront: (patch) => {
    set((state) => ({
      storefront: { ...state.storefront, ...patch },
      isDraftSaving: true,
    }));
    scheduleDraftSave(get);
  },

  // ─────────────────────────────────────────
  // BRANCH SELECTION (Step 3)
  // ─────────────────────────────────────────
  setSelectedBranches: (ids) => {
    set({ selectedBranchIds: ids, isDraftSaving: true });
    scheduleDraftSave(get);
  },

  toggleBranchSelection: (branch_id) => {
    const current = get().selectedBranchIds;
    const next = current.includes(branch_id)
      ? current.filter((id) => id !== branch_id)
      : [...current, branch_id];
    set({ selectedBranchIds: next, isDraftSaving: true });
    scheduleDraftSave(get);
  },

  // ─────────────────────────────────────────
  // BRANCH CONFIG (Step 4)
  // ─────────────────────────────────────────

  /**
   * updateBranchConfig — merges a patch into a branch config.
   *
   * Internal flags (_persisted, _dirty) ARE allowed through here
   * intentionally — submitBranchConfig uses this to stamp _persisted.
   * They are stripped before any backend call in cleanBranchConfigsForDraft.
   */
  updateBranchConfig: (branch_id, patch) => {
    set((state) => ({
      branchConfigs: {
        ...state.branchConfigs,
        [branch_id]: {
          ...(state.branchConfigs[branch_id] || {}),
          ...patch,
        },
      },
      isDraftSaving: true,
    }));
    scheduleDraftSave(get);
  },

  initBranchConfig: (branch_id) => {
    const existing = get().branchConfigs[branch_id];
    if (existing) return;

    set((state) => ({
      branchConfigs: {
        ...state.branchConfigs,
        [branch_id]: {
          marketplace_enabled: false,
          shop_image_url:      null,
          latitude: null,
          longitude: null,
          google_place_id: null,
          formatted_address: null,
          opening_time: null,
          closing_time: null,
          is_24_hours: false,
          pickup_enabled: false,
          delivery_enabled: false,
          contact_override: null,
          // New branches start as not persisted, not dirty
          _persisted: false,
          _dirty: false,
        },
      },
    }));
  },

  // ─────────────────────────────────────────
  // STEP 2: SUBMIT STOREFRONT
  // ─────────────────────────────────────────
  submitStorefront: async () => {
    set({ isSubmitting: true, submitError: null });
    try {
      await apiSaveStorefront(get().storefront);
      set({ isSubmitting: false });
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to save storefront";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },

  // ─────────────────────────────────────────
  // STEP 3: SUBMIT BRANCH SELECTIONS
  // ─────────────────────────────────────────
  submitBranchSelections: async () => {
    set({ isSubmitting: true, submitError: null });
    try {
      await apiSaveBranchSelections(get().selectedBranchIds);
      set({ isSubmitting: false });
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to save branch selections";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },

  // ─────────────────────────────────────────
  // STEP 4: SUBMIT BRANCH CONFIG
  // ─────────────────────────────────────────
  submitBranchConfig: async (branch_id) => {
    const config = get().branchConfigs[branch_id];
    if (!config) return { success: false, error: "Branch config not found" };

    set({ isSubmitting: true, submitError: null });

    try {
      // Strip internal flags before sending to backend
      await apiSaveBranchConfig(branch_id, stripInternalFlags(config));

      // ── Fix 4: stamp _persisted in store on confirmed save ───────
      // Done here in the store — not in the card component.
      // BranchConfigCard no longer needs to call updateBranchConfig
      // after a successful save for the _persisted flag.
      set((state) => ({
        isSubmitting: false,
        branchConfigs: {
          ...state.branchConfigs,
          [branch_id]: {
            ...state.branchConfigs[branch_id],
            _persisted: true,
            _dirty: false,
          },
        },
      }));

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to save branch config";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },

  // ─────────────────────────────────────────
  // STEP 6: GO LIVE
  // ─────────────────────────────────────────
  submitGoLive: async () => {
    set({ isGoingLive: true, goLiveErrors: [] });
    try {
      await apiGoLive();
      set({
        isGoingLive: false,
        marketplaceStatus: "LIVE",
        isLive: true,
        onboardingCompleted: true,
      });
      return { success: true };
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const message =
        err.response?.data?.message || err.message || "Go-live failed";
      set({ isGoingLive: false, goLiveErrors: errors });
      return { success: false, error: message, errors };
    }
  },

  // ─────────────────────────────────────────
  // INVALIDATE STATUS CACHE
  // ─────────────────────────────────────────
  invalidateStatus: () => {
    set({ isStatusLoaded: false });
  },

  // ─────────────────────────────────────────
  // RESET (on logout)
  // ─────────────────────────────────────────
  reset: () => {
    if (draftTimer) clearTimeout(draftTimer);
    set({
      marketplaceStatus: null,
      onboardingCompleted: false,
      isLive: false,
      isStatusLoaded: false,
      isStatusLoading: false,
      currentStep: 1,
      storefront: {
        storefront_name: "",
        storefront_description: "",
        support_phone: "",
        logo_url: null,
        banner_url: null,
      },
      selectedBranchIds: [],
      branchConfigs: {},
      allBranches: [],
      savedBranchSettings: [],
      isDraftSaving: false,
      lastSavedAt: null,
      goLiveErrors: [],
      isGoingLive: false,
      isSubmitting: false,
      submitError: null,
    });
  },
}));

// ─────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────
export const selectMarketplaceStatus = (s) => s.marketplaceStatus;
export const selectIsLive = (s) => s.isLive;
export const selectOnboardingCompleted = (s) => s.onboardingCompleted;
export const selectIsStatusLoaded = (s) => s.isStatusLoaded;
export const selectCurrentStep = (s) => s.currentStep;
export const selectStorefront = (s) => s.storefront;
export const selectSelectedBranchIds = (s) => s.selectedBranchIds;
export const selectBranchConfigs = (s) => s.branchConfigs;
export const selectAllBranches = (s) => s.allBranches;
export const selectIsDraftSaving = (s) => s.isDraftSaving;
export const selectLastSavedAt = (s) => s.lastSavedAt;
export const selectGoLiveErrors = (s) => s.goLiveErrors;
export const selectIsGoingLive = (s) => s.isGoingLive;