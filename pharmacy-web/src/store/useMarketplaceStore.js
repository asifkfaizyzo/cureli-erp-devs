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

const INTERNAL_FLAGS = ["_persisted", "_dirty"];

function stripInternalFlags(config) {
  const clean = { ...config };
  for (const flag of INTERNAL_FLAGS) {
    delete clean[flag];
  }
  return clean;
}

function cleanBranchConfigsForDraft(branchConfigs) {
  const result = {};
  for (const [branch_id, config] of Object.entries(branchConfigs)) {
    result[branch_id] = stripInternalFlags(config);
  }
  return result;
}

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

      const savedBranchIds = new Set(
        (data.branch_settings || []).map((bs) => bs.branch_id)
      );

      const savedConfigs = {};
      for (const bs of data.branch_settings || []) {
        savedConfigs[bs.branch_id] = {
          marketplace_enabled: bs.marketplace_enabled,
          shop_image_url: bs.shop_image_url || null,
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
          _persisted: true,
          _dirty: false,
        };
      }

      const mergedConfigs = {
        ...savedConfigs,
        ...nextState.branchConfigs,
      };

      for (const branch_id of savedBranchIds) {
        if (mergedConfigs[branch_id]) {
          mergedConfigs[branch_id] = {
            ...mergedConfigs[branch_id],
            _persisted: true,
          };
        }
      }

      nextState.branchConfigs = mergedConfigs;

      if (!draft?.selectedBranchIds && data.branch_settings?.length > 0) {
        nextState.selectedBranchIds = data.branch_settings.map(
          (b) => b.branch_id
        );
      }

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
          shop_image_url: null,
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
      await apiSaveBranchConfig(branch_id, stripInternalFlags(config));

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

  // Phase 1 — API call only. Does NOT set isLive/marketplaceStatus.
  // GoLiveStep calls this, waits for success, then shows the celebration.
  submitGoLive: async () => {
    set({ isGoingLive: true, goLiveErrors: [] });
    try {
      await apiGoLive();
      // ← intentionally NOT setting isLive or marketplaceStatus here
      //   so the navigate() effect in MarketplaceOnboardingPage doesn't
      //   fire and kill the celebration before it renders.
      set({ isGoingLive: false });
      return { success: true };
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const message =
        err.response?.data?.message || err.message || "Go-live failed";
      set({ isGoingLive: false, goLiveErrors: errors });
      return { success: false, error: message, errors };
    }
  },

  // Phase 2 — called by GoLiveStep AFTER the celebration finishes.
  // NOW we flip the status flags which triggers the navigate() effect.
  confirmGoLive: () => {
    set({
      marketplaceStatus: "LIVE",
      isLive: true,
      onboardingCompleted: true,
    });
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