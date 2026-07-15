// cadmin-web/src/store/useCommunicationBadgeStore.js

import { create } from "zustand";
import { getAllTickets } from "../api/cadminTickets";
import { getEnquiryStats } from "../api/cadminEnquiries";

const POLL_INTERVAL_MS = 60_000; // 60 seconds

let _intervalId = null;

export const useCommunicationBadgeStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  pendingTickets:   0,
  pendingEnquiries: 0,
  isLoading:        false,
  lastFetched:      null,

  // ── Derived ───────────────────────────────────────────────
  // true if either tickets or enquiries have pending items
  get hasPending() {
    const s = get();
    return s.pendingTickets > 0 || s.pendingEnquiries > 0;
  },

  // ── Fetch ─────────────────────────────────────────────────
  fetchCounts: async () => {
    try {
      set({ isLoading: true });

      const [ticketsRes, enquiriesRes] = await Promise.allSettled([
        getAllTickets({ page: 1, limit: 1, status: "PENDING" }),
        getEnquiryStats(),
      ]);

      let pendingTickets   = get().pendingTickets;
      let pendingEnquiries = get().pendingEnquiries;

      if (ticketsRes.status === "fulfilled") {
        pendingTickets =
          ticketsRes.value?.data?.data?.pagination?.total ?? 0;
      }

      if (enquiriesRes.status === "fulfilled") {
        const d = enquiriesRes.value?.data?.data?.stats
          ?? enquiriesRes.value?.data?.data
          ?? enquiriesRes.value?.data
          ?? {};
        pendingEnquiries =
          d.pending ?? d.pendingEnquiries ?? 0;
      }

      set({
        pendingTickets,
        pendingEnquiries,
        isLoading:   false,
        lastFetched: new Date().toISOString(),
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Polling ───────────────────────────────────────────────
  startPolling: () => {
    if (_intervalId) return; // already running

    // Fetch immediately
    get().fetchCounts();

    _intervalId = setInterval(() => {
      get().fetchCounts();
    }, POLL_INTERVAL_MS);
  },

  stopPolling: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  },

  // Call this after user resolves a ticket/enquiry
  // so the dot updates immediately without waiting for next poll
  refresh: () => {
    get().fetchCounts();
  },
}));