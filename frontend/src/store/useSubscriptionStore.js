// src/store/useSubscriptionStore.js

import { create } from "zustand";
import { getSubscriptionStatus } from "../api/subscription";

/**
 * ============================================
 * SUBSCRIPTION STORE
 * ============================================
 *
 * Global subscription status for UI alerts/badges
 * Used by: Sidebar, TopHeader, SubscriptionCard
 */

const initialState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  
  // Subscription data
  has_active_subscription: false,
  is_in_grace_period: false,
  days_remaining: null,
  end_date: null,
  
  plan_id: null,
  plan_name: null,
  
  // Computed flags
  needs_renewal: false,  // days_remaining <= 30 or in grace
  is_urgent: false,      // days_remaining <= 7 or in grace
};

export const useSubscriptionStore = create((set, get) => ({
  ...initialState,

  /**
   * Load subscription status from API
   * Only loads once unless forced
   */
  loadSubscriptionStatus: async (force = false) => {
    const { isLoaded, isLoading } = get();
    
    // Skip if already loaded and not forced
    if (isLoaded && !force) {
      return;
    }

    // Skip if already loading
    if (isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await getSubscriptionStatus();
      const data = response.data?.subscription || response.data;

      if (!data) {
        // No subscription
        set({
          ...initialState,
          isLoaded: true,
          isLoading: false,
        });
        return;
      }

      // Calculate days remaining
      const endDate = new Date(data.end_date);
      const now = new Date();
      const diffTime = endDate - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Determine renewal flags
      const needsRenewal = daysRemaining <= 30 || data.is_in_grace_period;
      const isUrgent = daysRemaining <= 7 || data.is_in_grace_period;

      set({
        isLoaded: true,
        isLoading: false,
        error: null,
        
        has_active_subscription: true,
        is_in_grace_period: data.is_in_grace_period || false,
        days_remaining: daysRemaining,
        end_date: data.end_date,
        
        plan_id: data.plan?.plan_id || null,
        plan_name: data.plan?.name || null,
        
        needs_renewal: needsRenewal,
        is_urgent: isUrgent,
      });

      console.log("📋 Subscription status loaded:", {
        days_remaining: daysRemaining,
        needs_renewal: needsRenewal,
        is_urgent: isUrgent,
      });

    } catch (error) {
      console.error("Failed to load subscription status:", error);
      
      set({
        isLoaded: true,
        isLoading: false,
        error: error.response?.data?.message || "Failed to load subscription",
      });
    }
  },

  /**
   * Refresh subscription status
   */
  refresh: () => {
    const { loadSubscriptionStatus } = get();
    loadSubscriptionStatus(true);
  },

  /**
   * Clear subscription status
   */
  clear: () => {
    set(initialState);
  },
}));

// ============================================
// SELECTORS
// ============================================

export const selectNeedsRenewal = (state) => state.needs_renewal;
export const selectIsUrgent = (state) => state.is_urgent;
export const selectDaysRemaining = (state) => state.days_remaining;
export const selectIsInGrace = (state) => state.is_in_grace_period;