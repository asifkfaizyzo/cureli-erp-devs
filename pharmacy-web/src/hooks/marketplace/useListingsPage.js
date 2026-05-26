// src/hooks/marketplace/useListingsPage.js

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBranchSummary,
  getCategories,
  getListings,
  updateListing as apiUpdateListing,
  bulkUpdateListings as apiBulkUpdate,
  syncInventory as apiSyncInventory,
  updateCategoryVisibility as apiUpdateCategory,
} from "../../api/listings";
import { useAuthStore } from "../../store/useAuthStore";

// ─────────────────────────────────────────────
// DEBOUNCE HOOK
// ─────────────────────────────────────────────

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useListingsPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  // ── Branch state ──────────────────────────────────────────
  const [branchSummaries, setBranchSummaries] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // ── Category state ────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // ── Filter state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [activeTab, setActiveTab] = useState("linked");

  const debouncedSearch = useDebounce(searchQuery, 350);

  // ── Pagination state ──────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // ── Listings state ────────────────────────────────────────
  const [listings, setListings] = useState([]);
  const [listingsMeta, setListingsMeta] = useState(null);
  const [isListingsLoading, setIsListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);

  // ── Selection state ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Drawer state ──────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerListing, setDrawerListing] = useState(null);

  // ── Action loading states ─────────────────────────────────
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Prevent double-fetching on mount
  const summaryLoadedRef = useRef(false);

  // ─────────────────────────────────────────────────────────
  // LOAD BRANCH SUMMARY
  // Called once on mount.
  // ─────────────────────────────────────────────────────────
  const loadBranchSummary = useCallback(async () => {
    if (summaryLoadedRef.current) return;
    summaryLoadedRef.current = true;

    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const res = await getBranchSummary();
      const summaries = res.data?.data ?? [];
      setBranchSummaries(summaries);

      // Auto-select first branch
      // For non-SA, backend returns only their branch — so summaries[0]
      // is always the correct branch to show.
      if (summaries.length > 0 && !selectedBranch) {
        setSelectedBranch(summaries[0]);
      }
    } catch (err) {
      setSummaryError(
        err.response?.data?.message ?? err.message ?? "Failed to load branches"
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }, [selectedBranch]);

  // ─────────────────────────────────────────────────────────
  // LOAD CATEGORIES
  // Called when selected branch changes.
  // ─────────────────────────────────────────────────────────
  const loadCategories = useCallback(async (branch_id) => {
    if (!branch_id) return;
    setIsCategoriesLoading(true);
    try {
      const res = await getCategories(branch_id);
      setCategories(res.data?.data ?? []);
    } catch (err) {
      console.warn("[listings] Failed to load categories:", err.message);
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // LOAD LISTINGS
  // Called when branch, filters, or page changes.
  // ─────────────────────────────────────────────────────────
  const loadListings = useCallback(async () => {
    if (!selectedBranch?.branch_id) return;

    setIsListingsLoading(true);
    setListingsError(null);

    const params = {
      branch_id: selectedBranch.branch_id,
      page: currentPage,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      category: filterCategory === "all" ? "" : filterCategory,
      visibility: filterVisibility,
      stock: filterStock,
      sort: sortBy,
      tab: activeTab,
    };

    try {
      const res = await getListings(params);
      const payload = res.data?.data;
      setListings(payload?.items ?? []);
      setListingsMeta(payload?.meta ?? null);
    } catch (err) {
      setListingsError(
        err.response?.data?.message ?? err.message ?? "Failed to load listings"
      );
      setListings([]);
    } finally {
      setIsListingsLoading(false);
    }
  }, [
    selectedBranch,
    currentPage,
    debouncedSearch,
    filterCategory,
    filterVisibility,
    filterStock,
    sortBy,
    activeTab,
  ]);

  // ─────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────

  // Initial load
  useEffect(() => {
    loadBranchSummary();
  }, [loadBranchSummary]);

  // Load categories when branch changes
  useEffect(() => {
    if (selectedBranch?.branch_id) {
      loadCategories(selectedBranch.branch_id);
    }
  }, [selectedBranch?.branch_id, loadCategories]);

  // Load listings when branch or any filter changes
  // Reset to page 1 when filters change (but not when page itself changes)
  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [
    selectedBranch?.branch_id,
    debouncedSearch,
    filterCategory,
    filterVisibility,
    filterStock,
    sortBy,
    activeTab,
  ]);

  // ─────────────────────────────────────────────────────────
  // BRANCH SELECTION
  // ─────────────────────────────────────────────────────────
  const handleBranchChange = useCallback((branch) => {
    setSelectedBranch(branch);
    setSelectedIds(new Set());
    setCurrentPage(1);
    // Reset filters when switching branch
    setFilterCategory("all");
    setFilterVisibility("all");
    setFilterStock("all");
    setSearchQuery("");
    setSortBy("name_asc");
    setActiveTab("linked");
  }, []);

  // ─────────────────────────────────────────────────────────
  // OPTIMISTIC SINGLE LISTING UPDATE
  // ─────────────────────────────────────────────────────────
  const applyOptimisticUpdate = useCallback((listing_id, patch) => {
    setListings((prev) =>
      prev.map((item) =>
        item.listing_id === listing_id ? { ...item, ...patch } : item
      )
    );
    // Keep drawer in sync
    setDrawerListing((prev) =>
      prev?.listing_id === listing_id ? { ...prev, ...patch } : prev
    );
  }, []);

  const revertOptimisticUpdate = useCallback((listing_id, original) => {
    setListings((prev) =>
      prev.map((item) =>
        item.listing_id === listing_id ? { ...item, ...original } : item
      )
    );
    setDrawerListing((prev) =>
      prev?.listing_id === listing_id ? { ...prev, ...original } : prev
    );
  }, []);

  // ─────────────────────────────────────────────────────────
  // TOGGLE VISIBILITY
  // ─────────────────────────────────────────────────────────
  const toggleVisibility = useCallback(
    async (listing_id) => {
      const listing = listings.find((l) => l.listing_id === listing_id);
      if (!listing) return;

      const original = { is_visible: listing.is_visible };
      const patch = { is_visible: !listing.is_visible };

      // Optimistic
      applyOptimisticUpdate(listing_id, patch);
      setUpdatingIds((prev) => new Set(prev).add(listing_id));

      try {
        await apiUpdateListing(listing_id, patch);
        // Refresh summary counts in background (fire and forget)
        refreshSummary();
      } catch (err) {
        revertOptimisticUpdate(listing_id, original);
        console.error("[listings] toggleVisibility failed:", err.message);
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listing_id);
          return next;
        });
      }
    },
    [listings, applyOptimisticUpdate, revertOptimisticUpdate]
  );

  // ─────────────────────────────────────────────────────────
  // SET STOCK STATUS
  // ─────────────────────────────────────────────────────────
  const setStockStatus = useCallback(
    async (listing_id, stock_status) => {
      const listing = listings.find((l) => l.listing_id === listing_id);
      if (!listing) return;
      if (listing.stock_status === stock_status) return;

      const original = { stock_status: listing.stock_status };
      const patch = { stock_status };

      applyOptimisticUpdate(listing_id, patch);
      setUpdatingIds((prev) => new Set(prev).add(listing_id));

      try {
        await apiUpdateListing(listing_id, patch);
        refreshSummary();
      } catch (err) {
        revertOptimisticUpdate(listing_id, original);
        console.error("[listings] setStockStatus failed:", err.message);
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listing_id);
          return next;
        });
      }
    },
    [listings, applyOptimisticUpdate, revertOptimisticUpdate]
  );

  // ─────────────────────────────────────────────────────────
  // SET PRICE
  // ─────────────────────────────────────────────────────────
  const setPrice = useCallback(
    async (listing_id, marketplace_price) => {
      const listing = listings.find((l) => l.listing_id === listing_id);
      if (!listing) return;

      const original = { marketplace_price: listing.marketplace_price };
      const patch = { marketplace_price: Number(marketplace_price) };

      applyOptimisticUpdate(listing_id, patch);
      setUpdatingIds((prev) => new Set(prev).add(listing_id));

      try {
        await apiUpdateListing(listing_id, patch);
      } catch (err) {
        revertOptimisticUpdate(listing_id, original);
        console.error("[listings] setPrice failed:", err.message);
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listing_id);
          return next;
        });
      }
    },
    [listings, applyOptimisticUpdate, revertOptimisticUpdate]
  );

  // ─────────────────────────────────────────────────────────
  // SELECTION HELPERS
  // ─────────────────────────────────────────────────────────
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === listings.length && listings.length > 0) {
        return new Set();
      }
      return new Set(listings.map((l) => l.listing_id));
    });
  }, [listings]);

  const toggleSelectOne = useCallback((listing_id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(listing_id) ? next.delete(listing_id) : next.add(listing_id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ─────────────────────────────────────────────────────────
  // BULK ACTIONS
  // No optimistic update — wait for server, then refresh.
  // ─────────────────────────────────────────────────────────
  const executeBulk = useCallback(
    async (patch) => {
      if (selectedIds.size === 0) return;
      setIsBulkUpdating(true);
      try {
        await apiBulkUpdate(Array.from(selectedIds), patch);
        setSelectedIds(new Set());
        await loadListings();
        refreshSummary();
      } catch (err) {
        console.error("[listings] bulk action failed:", err.message);
      } finally {
        setIsBulkUpdating(false);
      }
    },
    [selectedIds, loadListings]
  );

  const bulkShow = useCallback(
    () => executeBulk({ is_visible: true }),
    [executeBulk]
  );
  const bulkHide = useCallback(
    () => executeBulk({ is_visible: false }),
    [executeBulk]
  );
  const bulkOutOfStock = useCallback(
    () => executeBulk({ stock_status: "OUT_OF_STOCK" }),
    [executeBulk]
  );
  const bulkRestoreStock = useCallback(
    () => executeBulk({ stock_status: "IN_STOCK" }),
    [executeBulk]
  );

  // ─────────────────────────────────────────────────────────
  // SYNC INVENTORY
  // ─────────────────────────────────────────────────────────
  const syncInventory = useCallback(async () => {
    if (!selectedBranch?.branch_id || isSyncing) return;
    setIsSyncing(true);
    try {
      await apiSyncInventory(selectedBranch.branch_id);
      // Full refresh after sync
      await loadListings();
      await loadCategories(selectedBranch.branch_id);
      refreshSummary();
    } catch (err) {
      console.error("[listings] sync failed:", err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedBranch, isSyncing, loadListings, loadCategories]);

  // ─────────────────────────────────────────────────────────
  // CATEGORY TOGGLE
  // ─────────────────────────────────────────────────────────
  const toggleCategory = useCallback(
    async (category_name) => {
      if (!selectedBranch?.branch_id) return;

      const cat = categories.find((c) => c.category_name === category_name);
      const newEnabled = cat ? !cat.is_enabled : false;

      // Optimistic update on categories list
      setCategories((prev) =>
        prev.map((c) =>
          c.category_name === category_name
            ? { ...c, is_enabled: newEnabled }
            : c
        )
      );

      try {
        await apiUpdateCategory({
          branch_id: selectedBranch.branch_id,
          category_name,
          is_enabled: newEnabled,
        });
      } catch (err) {
        // Revert
        setCategories((prev) =>
          prev.map((c) =>
            c.category_name === category_name
              ? { ...c, is_enabled: !newEnabled }
              : c
          )
        );
        console.error("[listings] toggleCategory failed:", err.message);
      }
    },
    [selectedBranch, categories]
  );

  // ─────────────────────────────────────────────────────────
  // DRAWER HANDLERS
  // ─────────────────────────────────────────────────────────
  const openDrawer = useCallback((listing) => {
    setDrawerListing(listing);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerListing(null), 300);
  }, []);

  // ─────────────────────────────────────────────────────────
  // FILTER RESET
  // ─────────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterVisibility("all");
    setFilterStock("all");
    setSortBy("name_asc");
  }, []);

  // ─────────────────────────────────────────────────────────
  // BACKGROUND SUMMARY REFRESH (non-blocking)
  // ─────────────────────────────────────────────────────────
  const refreshSummary = useCallback(async () => {
    try {
      const res = await getBranchSummary();
      const summaries = res.data?.data ?? [];
      setBranchSummaries(summaries);
      // Keep selectedBranch stats in sync
      if (selectedBranch) {
        const updated = summaries.find(
          (s) => s.branch_id === selectedBranch.branch_id
        );
        if (updated) setSelectedBranch(updated);
      }
    } catch {
      // Silently ignore — summary refresh is non-critical
    }
  }, [selectedBranch]);

  // ─────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterCategory !== "all" ||
    filterVisibility !== "all" ||
    filterStock !== "all";

  const allSelected =
    listings.length > 0 && selectedIds.size === listings.length;

  const someSelected =
    selectedIds.size > 0 && selectedIds.size < listings.length;

  // Build category toggles map for the toolbar
  // { category_name: is_enabled }
  const categoryToggles = Object.fromEntries(
    categories.map((c) => [c.category_name, c.is_enabled])
  );

  // globalEnabled = BranchMarketplaceSettings.marketplace_enabled
  // Read from the selected branch summary
  const globalEnabled = selectedBranch?.marketplace_enabled ?? false;

  return {
    // ── Branch ──
    branchSummaries,
    selectedBranch,
    onBranchChange: handleBranchChange,
    isSummaryLoading,
    summaryError,
    isSuperAdmin,

    // ── Categories ──
    categories,
    categoryToggles,
    isCategoriesLoading,
    onCategoryToggle: toggleCategory,

    // ── Filters ──
    searchQuery,
    onSearchChange: setSearchQuery,
    filterCategory,
    onCategoryChange: setFilterCategory,
    filterVisibility,
    onVisibilityChange: setFilterVisibility,
    filterStock,
    onStockChange: setFilterStock,
    sortBy,
    onSortChange: setSortBy,
    activeTab,
    onTabChange: setActiveTab,
    hasActiveFilters,
    onClearFilters: clearFilters,

    // ── Pagination ──
    currentPage,
    onPageChange: setCurrentPage,
    totalPages: listingsMeta?.total_pages ?? 0,
    totalResults: listingsMeta?.total ?? 0,

    // ── Listings ──
    listings,
    isListingsLoading,
    listingsError,
    onRefresh: loadListings,

    // ── Selection ──
    selectedIds,
    allSelected,
    someSelected,
    onToggleSelectAll: toggleSelectAll,
    onToggleSelectOne: toggleSelectOne,
    onClearSelection: clearSelection,

    // ── Single actions ──
    updatingIds,
    onToggleVisibility: toggleVisibility,
    onSetStockStatus: setStockStatus,
    onSetPrice: setPrice,

    // ── Bulk actions ──
    isBulkUpdating,
    onBulkShow: bulkShow,
    onBulkHide: bulkHide,
    onBulkOutOfStock: bulkOutOfStock,
    onBulkRestoreStock: bulkRestoreStock,

    // ── Sync ──
    isSyncing,
    onSyncInventory: syncInventory,

    // ── Drawer ──
    drawerOpen,
    drawerListing,
    onOpenDrawer: openDrawer,
    onCloseDrawer: closeDrawer,

    // ── Misc ──
    globalEnabled,
    PAGE_SIZE,
  };
}