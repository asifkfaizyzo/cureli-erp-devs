// src/pages/marketplace-listings/MarketplaceListingsPage.jsx

import { useState, useMemo } from "react";
import { RefreshCw, Download, RotateCcw, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import BranchSelectorCard from "./components/BranchSelectorCard";
import MarketplaceToolbar from "./components/MarketplaceToolbar";
import ListingsSearchBar from "./components/ListingsSearchBar";
import ListingsTable from "./components/ListingsTable";
import ListingDetailsDrawer from "./components/ListingDetailsDrawer";
import BulkActionBar from "./components/BulkActionBar";
import StatusPill from "../marketplace-storefront/components/primitives/StatusPill";

// ─── Dummy Data ───────────────────────────────────────────────────────────────

export const DUMMY_BRANCHES = [
  {
    id: "b1",
    name: "Kozhikode Main Branch",
    marketplaceEnabled: true,
    liveCount: 142,
    hiddenCount: 18,
    outOfStockCount: 9,
  },
  {
    id: "b2",
    name: "Calicut Beach Branch",
    marketplaceEnabled: true,
    liveCount: 98,
    hiddenCount: 24,
    outOfStockCount: 5,
  },
  {
    id: "b3",
    name: "Medical College Branch",
    marketplaceEnabled: false,
    liveCount: 0,
    hiddenCount: 210,
    outOfStockCount: 0,
  },
  {
    id: "b4",
    name: "Nadakkavu Branch",
    marketplaceEnabled: true,
    liveCount: 76,
    hiddenCount: 31,
    outOfStockCount: 12,
  },
];

export const CATEGORIES = [
  { id: "antibiotics", name: "Antibiotics", count: 24 },
  { id: "pain_relief", name: "Pain Relief", count: 18 },
  { id: "diabetes", name: "Diabetes", count: 15 },
  { id: "cardiac", name: "Cardiac", count: 12 },
  { id: "otc", name: "OTC", count: 41 },
  { id: "baby_care", name: "Baby Care", count: 9 },
];

const INITIAL_MEDICINES = [
  {
    id: "m1",
    name: "Dolo 650",
    manufacturer: "Micro Labs",
    category: "Pain Relief",
    categoryId: "pain_relief",
    packSize: "15 Tablets",
    avatarColor: "bg-blue-500/20 text-blue-400",
    erpStock: 480,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 32,
    erpPrice: 28,
    branchStatus: "SYNCED",
  },
  {
    id: "m2",
    name: "Azithral 500",
    manufacturer: "Alembic Pharma",
    category: "Antibiotics",
    categoryId: "antibiotics",
    packSize: "5 Tablets",
    avatarColor: "bg-purple-500/20 text-purple-400",
    erpStock: 12,
    isLowStock: true,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 145,
    erpPrice: 138,
    branchStatus: "NEEDS_REVIEW",
  },
  {
    id: "m3",
    name: "Augmentin 625",
    manufacturer: "GSK Pharma",
    category: "Antibiotics",
    categoryId: "antibiotics",
    packSize: "10 Tablets",
    avatarColor: "bg-emerald-500/20 text-emerald-400",
    erpStock: 95,
    isLowStock: false,
    marketplaceVisible: false,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 224,
    erpPrice: 210,
    branchStatus: "SYNCED",
  },
  {
    id: "m4",
    name: "Shelcal 500",
    manufacturer: "Torrent Pharma",
    category: "OTC",
    categoryId: "otc",
    packSize: "15 Tablets",
    avatarColor: "bg-orange-500/20 text-orange-400",
    erpStock: 210,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "OUT_OF_STOCK",
    marketplacePrice: 148,
    erpPrice: 140,
    branchStatus: "RECENTLY_UPDATED",
  },
  {
    id: "m5",
    name: "Pantocid DSR",
    manufacturer: "Sun Pharma",
    category: "OTC",
    categoryId: "otc",
    packSize: "10 Capsules",
    avatarColor: "bg-cyan-500/20 text-cyan-400",
    erpStock: 8,
    isLowStock: true,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 132,
    erpPrice: 125,
    branchStatus: "NEEDS_REVIEW",
  },
  {
    id: "m6",
    name: "Neurobion Forte",
    manufacturer: "Procter & Gamble",
    category: "OTC",
    categoryId: "otc",
    packSize: "30 Tablets",
    avatarColor: "bg-yellow-500/20 text-yellow-400",
    erpStock: 340,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 42,
    erpPrice: 38,
    branchStatus: "SYNCED",
  },
  {
    id: "m7",
    name: "Glycomet GP 1",
    manufacturer: "USV Pharma",
    category: "Diabetes",
    categoryId: "diabetes",
    packSize: "20 Tablets",
    avatarColor: "bg-rose-500/20 text-rose-400",
    erpStock: 175,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 98,
    erpPrice: 92,
    branchStatus: "SYNCED",
  },
  {
    id: "m8",
    name: "Telma 40",
    manufacturer: "Glenmark Pharma",
    category: "Cardiac",
    categoryId: "cardiac",
    packSize: "15 Tablets",
    avatarColor: "bg-indigo-500/20 text-indigo-400",
    erpStock: 6,
    isLowStock: true,
    marketplaceVisible: false,
    marketplaceStock: "OUT_OF_STOCK",
    marketplacePrice: 112,
    erpPrice: 105,
    branchStatus: "NEEDS_REVIEW",
  },
  {
    id: "m9",
    name: "Calpol 500mg",
    manufacturer: "GSK Pharma",
    category: "Pain Relief",
    categoryId: "pain_relief",
    packSize: "15 Tablets",
    avatarColor: "bg-teal-500/20 text-teal-400",
    erpStock: 520,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 26,
    erpPrice: 22,
    branchStatus: "RECENTLY_UPDATED",
  },
  {
    id: "m10",
    name: "Ecosprin 75",
    manufacturer: "USV Pharma",
    category: "Cardiac",
    categoryId: "cardiac",
    packSize: "14 Tablets",
    avatarColor: "bg-fuchsia-500/20 text-fuchsia-400",
    erpStock: 290,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 18,
    erpPrice: 15,
    branchStatus: "SYNCED",
  },
  {
    id: "m11",
    name: "Metformin 500",
    manufacturer: "Sun Pharma",
    category: "Diabetes",
    categoryId: "diabetes",
    packSize: "10 Tablets",
    avatarColor: "bg-lime-500/20 text-lime-400",
    erpStock: 430,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 22,
    erpPrice: 18,
    branchStatus: "SYNCED",
  },
  {
    id: "m12",
    name: "Allegra 120mg",
    manufacturer: "Sanofi India",
    category: "OTC",
    categoryId: "otc",
    packSize: "10 Tablets",
    avatarColor: "bg-sky-500/20 text-sky-400",
    erpStock: 9,
    isLowStock: true,
    marketplaceVisible: false,
    marketplaceStock: "OUT_OF_STOCK",
    marketplacePrice: 188,
    erpPrice: 178,
    branchStatus: "SYNCED",
  },
  {
    id: "m13",
    name: "Liv 52",
    manufacturer: "Himalaya Drug",
    category: "OTC",
    categoryId: "otc",
    packSize: "100 Tablets",
    avatarColor: "bg-green-500/20 text-green-400",
    erpStock: 165,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 168,
    erpPrice: 155,
    branchStatus: "RECENTLY_UPDATED",
  },
  {
    id: "m14",
    name: "Cetirizine 10mg",
    manufacturer: "Cipla Ltd",
    category: "OTC",
    categoryId: "otc",
    packSize: "10 Tablets",
    avatarColor: "bg-amber-500/20 text-amber-400",
    erpStock: 380,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 14,
    erpPrice: 11,
    branchStatus: "SYNCED",
  },
  {
    id: "m15",
    name: "Amlodipine 5mg",
    manufacturer: "Torrent Pharma",
    category: "Cardiac",
    categoryId: "cardiac",
    packSize: "10 Tablets",
    avatarColor: "bg-violet-500/20 text-violet-400",
    erpStock: 14,
    isLowStock: true,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 52,
    erpPrice: 47,
    branchStatus: "NEEDS_REVIEW",
  },
  {
    id: "m16",
    name: "Dabur Honitus",
    manufacturer: "Dabur India",
    category: "Baby Care",
    categoryId: "baby_care",
    packSize: "100ml Syrup",
    avatarColor: "bg-pink-500/20 text-pink-400",
    erpStock: 72,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 165,
    erpPrice: 155,
    branchStatus: "SYNCED",
  },
  {
    id: "m17",
    name: "Combiflam",
    manufacturer: "Sanofi India",
    category: "Pain Relief",
    categoryId: "pain_relief",
    packSize: "20 Tablets",
    avatarColor: "bg-red-500/20 text-red-400",
    erpStock: 245,
    isLowStock: false,
    marketplaceVisible: false,
    marketplaceStock: "IN_STOCK",
    marketplacePrice: 56,
    erpPrice: 50,
    branchStatus: "SYNCED",
  },
  {
    id: "m18",
    name: "Atorvastatin 10mg",
    manufacturer: "Cipla Ltd",
    category: "Cardiac",
    categoryId: "cardiac",
    packSize: "10 Tablets",
    avatarColor: "bg-blue-400/20 text-blue-300",
    erpStock: 190,
    isLowStock: false,
    marketplaceVisible: true,
    marketplaceStock: "OUT_OF_STOCK",
    marketplacePrice: 78,
    erpPrice: 72,
    branchStatus: "RECENTLY_UPDATED",
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

const MarketplaceListingsPage = () => {
  // ── Branch state ──
  const [selectedBranch, setSelectedBranch] = useState(DUMMY_BRANCHES[0]);

  // ── Marketplace state ──
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [categoryToggles, setCategoryToggles] = useState(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, true]))
  );

  // ── Medicine state ──
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Filter state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  // ── Drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMedicine, setDrawerMedicine] = useState(null);

  // ── Filtered + sorted medicines ──
  const filteredMedicines = useMemo(() => {
    let result = [...medicines];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.manufacturer.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== "all") {
      result = result.filter((m) => m.categoryId === filterCategory);
    }

    if (filterVisibility === "visible") {
      result = result.filter((m) => m.marketplaceVisible);
    } else if (filterVisibility === "hidden") {
      result = result.filter((m) => !m.marketplaceVisible);
    }

    if (filterStock === "in_stock") {
      result = result.filter((m) => m.marketplaceStock === "IN_STOCK");
    } else if (filterStock === "out_of_stock") {
      result = result.filter((m) => m.marketplaceStock === "OUT_OF_STOCK");
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.marketplacePrice - b.marketplacePrice;
        case "price_desc":
          return b.marketplacePrice - a.marketplacePrice;
        case "stock_asc":
          return a.erpStock - b.erpStock;
        default:
          return 0;
      }
    });

    return result;
  }, [medicines, searchQuery, filterCategory, filterVisibility, filterStock, sortBy]);

  // ── Medicine update helpers ──
  const updateMedicine = (id, patch) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
    if (drawerMedicine?.id === id) {
      setDrawerMedicine((prev) => ({ ...prev, ...patch }));
    }
  };

  const toggleVisibility = (id) => {
    const med = medicines.find((m) => m.id === id);
    if (med) updateMedicine(id, { marketplaceVisible: !med.marketplaceVisible });
  };

  const setStockStatus = (id, status) => {
    updateMedicine(id, { marketplaceStock: status });
  };

  const setPrice = (id, price) => {
    updateMedicine(id, { marketplacePrice: Number(price) });
  };

  // ── Selection helpers ──
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMedicines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedicines.map((m) => m.id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk actions ──
  const bulkHide = () => {
    setMedicines((prev) =>
      prev.map((m) =>
        selectedIds.has(m.id) ? { ...m, marketplaceVisible: false } : m
      )
    );
    setSelectedIds(new Set());
  };

  const bulkShow = () => {
    setMedicines((prev) =>
      prev.map((m) =>
        selectedIds.has(m.id) ? { ...m, marketplaceVisible: true } : m
      )
    );
    setSelectedIds(new Set());
  };

  const bulkOutOfStock = () => {
    setMedicines((prev) =>
      prev.map((m) =>
        selectedIds.has(m.id) ? { ...m, marketplaceStock: "OUT_OF_STOCK" } : m
      )
    );
    setSelectedIds(new Set());
  };

  const bulkRestoreStock = () => {
    setMedicines((prev) =>
      prev.map((m) =>
        selectedIds.has(m.id) ? { ...m, marketplaceStock: "IN_STOCK" } : m
      )
    );
    setSelectedIds(new Set());
  };

  // ── Drawer handlers ──
  const openDrawer = (medicine) => {
    setDrawerMedicine(medicine);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerMedicine(null), 300);
  };

  // ── Category toggles ──
  const toggleCategory = (id) => {
    setCategoryToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full flex flex-col bg-[#010015] overflow-hidden">
      {/* ── Top Header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Pill size={18} className="text-white/60" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Marketplace Listings
                </h1>
                <StatusPill status="LIVE" />
              </div>
              <p className="text-[12px] text-white/35 mt-0.5">
                Manage which medicines appear in the Cureli marketplace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HeaderButton icon={RotateCcw} label="Refresh" />
            <HeaderButton icon={Download} label="Export" />
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#05015A] hover:bg-[#0a0280] border border-white/[0.1] text-white text-xs font-semibold transition-all">
              <RefreshCw size={13} />
              Sync Inventory
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-15">
        {/* Branch Selector */}
        <BranchSelectorCard
          branches={DUMMY_BRANCHES}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
        />

        {/* Controls Toolbar */}
        <MarketplaceToolbar
          globalEnabled={globalEnabled}
          onGlobalToggle={() => setGlobalEnabled((v) => !v)}
          categories={CATEGORIES}
          categoryToggles={categoryToggles}
          onCategoryToggle={toggleCategory}
          selectedCount={selectedIds.size}
          onBulkHide={bulkHide}
          onBulkShow={bulkShow}
          onBulkOutOfStock={bulkOutOfStock}
          onBulkRestoreStock={bulkRestoreStock}
        />

        {/* Search + Filters */}
        <ListingsSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          filterVisibility={filterVisibility}
          onVisibilityChange={setFilterVisibility}
          filterStock={filterStock}
          onStockChange={setFilterStock}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={CATEGORIES}
          resultCount={filteredMedicines.length}
        />

        {/* Medicine Table */}
        <ListingsTable
          medicines={filteredMedicines}
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          onToggleVisibility={toggleVisibility}
          onSetStockStatus={setStockStatus}
          onSetPrice={setPrice}
          onOpenDrawer={openDrawer}
          globalEnabled={globalEnabled}
        />
      </div>

      {/* ── Drawer ── */}
      <ListingDetailsDrawer
        open={drawerOpen}
        medicine={drawerMedicine}
        onClose={closeDrawer}
        onToggleVisibility={toggleVisibility}
        onSetStockStatus={setStockStatus}
        onSetPrice={setPrice}
      />

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onHide={bulkHide}
        onShow={bulkShow}
        onOutOfStock={bulkOutOfStock}
        onRestoreStock={bulkRestoreStock}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
};

// ─── Header Button ────────────────────────────────────────────────────────────

const HeaderButton = ({ icon: Icon, label }) => (
  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-white/50 hover:text-white/70 text-xs font-medium transition-all">
    <Icon size={13} />
    {label}
  </button>
);

export default MarketplaceListingsPage;