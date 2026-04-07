// cadmin/src/pages/MasterMedicines/MasterMedicinesPage.jsx

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Pill,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  LinkIcon,
  Package,
  ImageOff,
  Image,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import MasterMedicineDetailModal from "./comps/MasterMedicineDetailModal";
import VariantLinkedModal from "./comps/VariantLinkedModal";
import MasterCatalogTable from "./comps/MasterCatalogTable";
import UnmappedTable from "./comps/UnmappedTable";
import ReviewTable from "./comps/ReviewTable";
import RawImagesTable from "./comps/RawImagesTable";
import NoImagesTable from "./comps/NoImagesTable";
import MatchMedicineModal from "./comps/MatchMedicineModal";
import CreateMedicineModal from "./comps/CreateMedicineModal";
import UnmappedDetailModal from "./comps/UnmappedDetailModal";
import LinkedMedicinesModal from "./comps/LinkedMedicinesModal";
import ImageUploadModal from "./comps/ImageUploadModal";

// API
import {
  getMasterMedicines,
  getMasterMedicineById,
  getMasterMedicineStats,
  getUnmappedMedicines,
  getNeedsReview,
  getLinkedMedicines as fetchLinkedMedicines,
  acceptReviewMatch,
  rejectReviewMatch,
  matchToMaster,
  ignoreUnmapped,
  unlinkMedicine as apiUnlinkMedicine,
  IMAGE_STATUS,
} from "../../api/cadminMasterMedicines";

// Toast
import { useToast } from "../../components/common/Toast";

// ═══════════════════════════════════════════════════════════════
// MAIN SECTION TABS
// ═══════════════════════════════════════════════════════════════
const MAIN_SECTIONS = [
  { id: "catalog", label: "Master Catalog", icon: Pill },
  { id: "mapping", label: "Mapping", icon: LinkIcon },
  { id: "images", label: "Images", icon: Image },
];

const MAPPING_TABS = [
  { id: "unmapped", label: "Unmapped", icon: LinkIcon },
  { id: "review", label: "Needs Review", icon: HelpCircle },
];

const IMAGE_TABS = [
  { id: "raw", label: "Raw Images", icon: AlertTriangle },
  { id: "none", label: "No Images", icon: ImageOff },
];

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
const MasterMedicinesPage = () => {
  const toast = useToast();

  // ═══════════════════════════════════════════════════════════
  // STATE - Sections & Tabs
  // ═══════════════════════════════════════════════════════════
  const [activeSection, setActiveSection] = useState("catalog");
  const [activeMappingTab, setActiveMappingTab] = useState("unmapped");
  const [activeImageTab, setActiveImageTab] = useState("raw");

  // ═══════════════════════════════════════════════════════════
  // STATE - Loading
  // ═══════════════════════════════════════════════════════════
  const [loading, setLoading] = useState({
    stats: true,
    catalog: false,
    unmapped: false,
    review: false,
  });

  // ═══════════════════════════════════════════════════════════
  // STATE - Stats (from backend)
  // ═══════════════════════════════════════════════════════════
  const [stats, setStats] = useState({
    totalMasters: 0,
    totalVariants: 0,
    verified: 0,
    raw: 0,
    none: 0,
    totalLinked: 0,
    unmapped: 0,
    needsReview: 0,
    drugs: 0,
    otc: 0,
  });

  // ═══════════════════════════════════════════════════════════
  // STATE - Catalog Data
  // ═══════════════════════════════════════════════════════════
  const [catalogData, setCatalogData] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [catalogFilters, setCatalogFilters] = useState({
    search: "",
    type: "",
    form: "",
    category: "",
    page: 1,
    limit: 20,
    sort: "generic_name",
    order: "asc",
  });

  // ═══════════════════════════════════════════════════════════
  // STATE - Unmapped Data
  // ═══════════════════════════════════════════════════════════
  const [unmappedData, setUnmappedData] = useState([]);
  const [unmappedMeta, setUnmappedMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // ═══════════════════════════════════════════════════════════
  // STATE - Review Data
  // ═══════════════════════════════════════════════════════════
  const [reviewData, setReviewData] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // ═══════════════════════════════════════════════════════════
  // STATE - Modals
  // ═══════════════════════════════════════════════════════════
  const [matchModal, setMatchModal] = useState({ open: false, item: null, source: null });
  const [createModal, setCreateModal] = useState({ open: false, item: null });
  const [detailModal, setDetailModal] = useState({ open: false, item: null });
  const [linkedModal, setLinkedModal] = useState({ open: false, medicine: null, linkedData: [] });
  const [imageModal, setImageModal] = useState({ open: false, medicine: null });
  const [masterDetailModal, setMasterDetailModal] = useState({ open: false, medicine: null, linkedData: [] });
  const [variantLinkedModal, setVariantLinkedModal] = useState({ open: false, variant: null, linkedData: [] });

  // ═══════════════════════════════════════════════════════════
  // STATE - Selection for Bulk Actions
  // ═══════════════════════════════════════════════════════════
  const [selectedUnmapped, setSelectedUnmapped] = useState([]);
  const [selectedReview, setSelectedReview] = useState([]);
  const [selectedRaw, setSelectedRaw] = useState([]);
  const [selectedNone, setSelectedNone] = useState([]);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED - Image-filtered catalog data
  // ═══════════════════════════════════════════════════════════
  const rawImageMedicines = useMemo(() => {
    return catalogData.filter((m) => m.imageStatus === IMAGE_STATUS.RAW);
  }, [catalogData]);

  const noImageMedicines = useMemo(() => {
    return catalogData.filter((m) => m.imageStatus === IMAGE_STATUS.NONE);
  }, [catalogData]);

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING - Stats
  // ═══════════════════════════════════════════════════════════
  const loadStats = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, stats: true }));
      const res = await getMasterMedicineStats();
      const data = res.data?.data;

      if (data) {
        setStats({
          totalMasters: data.overview?.totalMasters || 0,
          totalVariants: data.overview?.totalVariants || 0,
          verified: data.byImageStatus?.verified || 0,
          raw: data.byImageStatus?.raw || 0,
          none: data.byImageStatus?.none || 0,
          totalLinked: 0,
          unmapped: 0,
          needsReview: 0,
          drugs: data.byType?.drug || 0,
          otc: data.byType?.otc || 0,
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING - Catalog
  // ═══════════════════════════════════════════════════════════
  const loadCatalog = useCallback(async (filters = catalogFilters) => {
    try {
      setLoading((prev) => ({ ...prev, catalog: true }));
      const res = await getMasterMedicines(filters);
      const data = res.data?.data;

      if (data) {
        const transformed = data.medicines.map((med) => ({
          id: med.id,
          masterKey: med.masterKey,
          name: med.genericName,
          genericName: med.genericName,
          normalizedName: med.masterKey,
          composition: Array.isArray(med.composition)
            ? med.composition.map((c) => c.name).join(" + ")
            : med.composition || "N/A",
          type: med.type,
          form: med.form,
          manufacturer: med.previewVariants?.[0]?.manufacturer || med.previewVariants?.[0]?.marketer || "N/A",
          marketer: med.previewVariants?.[0]?.marketer || null,
          packSize: med.previewVariants?.[0]?.packSize || "N/A",
          prescriptionRequired: med.prescriptionRequired,
          primaryCategory: med.primaryCategory,
          isActive: true,
          variantCount: med.variantCount,
          priceRange: med.priceRange,
          imageStatus: med.imageStatus,
          primaryImage: med.primaryImage,
          previewVariants: med.previewVariants || [],
          linkedMedicines: [],
          createdAt: med.createdAt,
          updatedAt: med.updatedAt,
        }));

        setCatalogData(transformed);
        setCatalogMeta(data.meta);
      }
    } catch (error) {
      console.error("Failed to load catalog:", error);
      toast.error("Load Failed", "Failed to fetch master catalog");
    } finally {
      setLoading((prev) => ({ ...prev, catalog: false }));
    }
  }, [catalogFilters, toast]);

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING - Unmapped
  // ═══════════════════════════════════════════════════════════
  const loadUnmapped = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, unmapped: true }));
      const res = await getUnmappedMedicines({ page: 1, limit: 100 });
      const data = res.data?.data;

      if (data) {
        setUnmappedData(data.unmapped || []);
        setUnmappedMeta(data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
        setStats((prev) => ({ ...prev, unmapped: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error("Failed to load unmapped:", error);
    } finally {
      setLoading((prev) => ({ ...prev, unmapped: false }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING - Review
  // ═══════════════════════════════════════════════════════════
  const loadReview = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, review: true }));
      const res = await getNeedsReview({ page: 1, limit: 100 });
      const data = res.data?.data;

      if (data) {
        setReviewData(data.reviewItems || []);
        setReviewMeta(data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
        setStats((prev) => ({ ...prev, needsReview: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error("Failed to load review:", error);
    } finally {
      setLoading((prev) => ({ ...prev, review: false }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // INITIAL DATA LOAD
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    loadStats();
    loadCatalog();
    loadUnmapped();
    loadReview();
  }, []); // eslint-disable-line

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Unmapped Actions
  // ═══════════════════════════════════════════════════════════
  const handleMatchUnmapped = useCallback((item) => {
    setMatchModal({ open: true, item, source: "unmapped" });
  }, []);

  const handleCreateFromUnmapped = useCallback((item) => {
    setCreateModal({ open: true, item });
  }, []);

  const handleIgnoreUnmapped = useCallback(
    async (item) => {
      try {
        await ignoreUnmapped(item.medicineIds || []);
        setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));
        setStats((prev) => ({ ...prev, unmapped: Math.max(0, prev.unmapped - 1) }));
        toast.success("Item Ignored", `"${item.normalizedName}" has been ignored.`);
      } catch (error) {
        console.error("Failed to ignore:", error);
        toast.error("Failed", "Could not ignore item");
      }
    },
    [toast]
  );

  const handleViewUnmappedDetail = useCallback((item) => {
    setDetailModal({ open: true, item });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Review Actions
  // ═══════════════════════════════════════════════════════════
  const handleAcceptMatch = useCallback(
    async (item) => {
      try {
        await acceptReviewMatch(item.id);
        setReviewData((prev) => prev.filter((r) => r.id !== item.id));
        setStats((prev) => ({
          ...prev,
          needsReview: Math.max(0, prev.needsReview - 1),
          totalLinked: prev.totalLinked + 1,
        }));
        toast.success("Match Accepted", `"${item.rawName}" linked to "${item.suggestedMaster.name}"`);
      } catch (error) {
        console.error("Failed to accept match:", error);
        toast.error("Failed", "Could not accept match");
      }
    },
    [toast]
  );

  const handleChangeMatch = useCallback((item) => {
    setMatchModal({ open: true, item, source: "review" });
  }, []);

  const handleRejectMatch = useCallback(
    async (item) => {
      try {
        await rejectReviewMatch(item.id);
        setReviewData((prev) => prev.filter((r) => r.id !== item.id));
        setStats((prev) => ({
          ...prev,
          needsReview: Math.max(0, prev.needsReview - 1),
          unmapped: prev.unmapped + 1,
        }));
        loadUnmapped();
        toast.info("Match Rejected", `"${item.rawName}" moved to Unmapped`);
      } catch (error) {
        console.error("Failed to reject match:", error);
        toast.error("Failed", "Could not reject match");
      }
    },
    [toast, loadUnmapped]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Image Actions
  // ═══════════════════════════════════════════════════════════
  const handleUploadImage = useCallback((medicine) => {
    setImageModal({ open: true, medicine });
    // Close master detail modal if open
    if (masterDetailModal.open) {
      setMasterDetailModal((prev) => ({ ...prev, open: false }));
    }
  }, [masterDetailModal.open]);

  const handleImageUploaded = useCallback(() => {
    loadCatalog();
    loadStats();
    toast.success("Image Updated", "Medicine image has been updated successfully");

    // Refresh detail modal if it was open
    if (masterDetailModal.medicine) {
      handleViewMasterDetail(masterDetailModal.medicine);
    }
  }, [loadCatalog, loadStats, toast, masterDetailModal.medicine]); // eslint-disable-line

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Linked Medicines
  // ═══════════════════════════════════════════════════════════
  const handleViewLinked = useCallback(
    async (medicine) => {
      try {
        const res = await fetchLinkedMedicines(medicine.id);
        const linked = res.data?.data || [];
        setLinkedModal({ open: true, medicine, linkedData: linked });
      } catch (error) {
        console.error("Failed to load linked:", error);
        toast.error("Failed", "Could not load linked medicines");
      }
    },
    [toast]
  );

  const handleUnlinkMedicine = useCallback(
    async (masterId, linkedId) => {
      try {
        await apiUnlinkMedicine(linkedId);
        setLinkedModal((prev) => ({
          ...prev,
          linkedData: prev.linkedData.filter((lm) => lm.id !== linkedId),
        }));
        setStats((prev) => ({ ...prev, totalLinked: Math.max(0, prev.totalLinked - 1) }));
        toast.success("Medicine Unlinked", "Shop medicine has been unlinked");
      } catch (error) {
        console.error("Failed to unlink:", error);
        toast.error("Failed", "Could not unlink medicine");
      }
    },
    [toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Master Detail Modal
  // ═══════════════════════════════════════════════════════════
  const handleViewMasterDetail = useCallback(
    async (medicine) => {
      try {
        // Fetch full details
        const res = await getMasterMedicineById(medicine.id);
        const fullMedicine = res.data?.data;

        if (!fullMedicine) {
          toast.error("Not Found", "Medicine details not found");
          return;
        }

        // Fetch linked medicines
        const linkedRes = await fetchLinkedMedicines(medicine.id);
        const linked = linkedRes.data?.data || [];

        setMasterDetailModal({ open: true, medicine: fullMedicine, linkedData: linked });
      } catch (error) {
        console.error("Failed to load medicine details:", error);
        toast.error("Failed", "Could not load medicine details");
      }
    },
    [toast]
  );

  const handleViewVariantLinked = useCallback(
    async (variant) => {
      try {
        // Filter from master's linked data for this variant
        const variantLinked = masterDetailModal.linkedData.filter(
          (linked) => linked.skuId === variant.skuId
        );

        setVariantLinkedModal({ open: true, variant, linkedData: variantLinked });
      } catch (error) {
        console.error("Failed to load variant linked:", error);
        toast.error("Failed", "Could not load linked medicines");
      }
    },
    [masterDetailModal.linkedData, toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Modal Confirmations
  // ═══════════════════════════════════════════════════════════
  const handleConfirmMatch = useCallback(
    async (selectedMaster) => {
      const { item, source } = matchModal;

      try {
        const medicineIds =
          source === "unmapped"
            ? item.medicineIds || []
            : [item.id];

        await matchToMaster(medicineIds, selectedMaster.id);

        if (source === "unmapped") {
          setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));
          setStats((prev) => ({ ...prev, unmapped: Math.max(0, prev.unmapped - 1) }));
        } else {
          setReviewData((prev) => prev.filter((r) => r.id !== item.id));
          setStats((prev) => ({ ...prev, needsReview: Math.max(0, prev.needsReview - 1) }));
        }

        setStats((prev) => ({ ...prev, totalLinked: prev.totalLinked + medicineIds.length }));
        setMatchModal({ open: false, item: null, source: null });
        toast.success("Medicine Mapped", `Successfully mapped to "${selectedMaster.genericName || selectedMaster.name}"`);
      } catch (error) {
        console.error("Failed to match:", error);
        toast.error("Failed", "Could not complete the match");
      }
    },
    [matchModal, toast]
  );

  const handleConfirmCreate = useCallback(
    (newMedicine) => {
      setCreateModal({ open: false, item: null });
      loadCatalog();
      loadUnmapped();
      toast.success("Medicine Created", `"${newMedicine.name}" added to Master Catalog`);
    },
    [loadCatalog, loadUnmapped, toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Bulk Actions
  // ═══════════════════════════════════════════════════════════
  const handleBulkIgnoreUnmapped = useCallback(async () => {
    if (selectedUnmapped.length === 0) return;

    try {
      const allMedicineIds = unmappedData
        .filter((u) => selectedUnmapped.includes(u.id))
        .flatMap((u) => u.medicineIds || []);

      await ignoreUnmapped(allMedicineIds);
      setUnmappedData((prev) => prev.filter((u) => !selectedUnmapped.includes(u.id)));
      setStats((prev) => ({ ...prev, unmapped: Math.max(0, prev.unmapped - selectedUnmapped.length) }));
      setSelectedUnmapped([]);
      toast.success("Bulk Ignore", `${selectedUnmapped.length} item(s) have been ignored`);
    } catch (error) {
      console.error("Failed to bulk ignore:", error);
      toast.error("Failed", "Could not ignore selected items");
    }
  }, [selectedUnmapped, unmappedData, toast]);

  const handleBulkAcceptReview = useCallback(async () => {
    if (selectedReview.length === 0) return;

    try {
      let successCount = 0;
      for (const id of selectedReview) {
        try {
          await acceptReviewMatch(id);
          successCount++;
        } catch (err) {
          console.error(`Failed to accept ${id}:`, err);
        }
      }

      setReviewData((prev) => prev.filter((r) => !selectedReview.includes(r.id)));
      setStats((prev) => ({
        ...prev,
        needsReview: Math.max(0, prev.needsReview - successCount),
        totalLinked: prev.totalLinked + successCount,
      }));
      setSelectedReview([]);
      toast.success("Bulk Accept", `${successCount} match(es) have been accepted`);
    } catch (error) {
      console.error("Failed to bulk accept:", error);
      toast.error("Failed", "Could not accept selected items");
    }
  }, [selectedReview, toast]);

  const handleBulkRejectReview = useCallback(async () => {
    if (selectedReview.length === 0) return;

    try {
      let successCount = 0;
      for (const id of selectedReview) {
        try {
          await rejectReviewMatch(id);
          successCount++;
        } catch (err) {
          console.error(`Failed to reject ${id}:`, err);
        }
      }

      setReviewData((prev) => prev.filter((r) => !selectedReview.includes(r.id)));
      setStats((prev) => ({
        ...prev,
        needsReview: Math.max(0, prev.needsReview - successCount),
        unmapped: prev.unmapped + successCount,
      }));
      setSelectedReview([]);
      loadUnmapped();
      toast.info("Bulk Reject", `${successCount} item(s) moved to Unmapped`);
    } catch (error) {
      console.error("Failed to bulk reject:", error);
      toast.error("Failed", "Could not reject selected items");
    }
  }, [selectedReview, toast, loadUnmapped]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Refresh
  // ═══════════════════════════════════════════════════════════
  const handleRefresh = useCallback(() => {
    setSelectedUnmapped([]);
    setSelectedReview([]);
    setSelectedRaw([]);
    setSelectedNone([]);
    loadStats();
    loadCatalog();
    loadUnmapped();
    loadReview();
    toast.info("Data Refreshed", "All data has been reloaded from server");
  }, [loadStats, loadCatalog, loadUnmapped, loadReview, toast]);

  // ═══════════════════════════════════════════════════════════
  // RENDER - Current Active Content
  // ═══════════════════════════════════════════════════════════
  const renderContent = () => {
    if (activeSection === "catalog") {
      return (
        <MasterCatalogTable
          medicines={catalogData}
          meta={catalogMeta}
          onViewLinked={handleViewLinked}
          onUploadImage={handleUploadImage}
          loading={loading.catalog}
          onFiltersChange={(newFilters) => {
            setCatalogFilters(newFilters);
            loadCatalog(newFilters);
          }}
          onRowClick={handleViewMasterDetail}
        />
      );
    }

    if (activeSection === "mapping") {
      if (activeMappingTab === "unmapped") {
        return (
          <UnmappedTable
            data={unmappedData}
            selectedIds={selectedUnmapped}
            onSelectionChange={setSelectedUnmapped}
            onMatch={handleMatchUnmapped}
            onCreate={handleCreateFromUnmapped}
            onIgnore={handleIgnoreUnmapped}
            onViewDetail={handleViewUnmappedDetail}
            onBulkIgnore={handleBulkIgnoreUnmapped}
            loading={loading.unmapped}
          />
        );
      } else {
        return (
          <ReviewTable
            data={reviewData}
            selectedIds={selectedReview}
            onSelectionChange={setSelectedReview}
            onAccept={handleAcceptMatch}
            onChange={handleChangeMatch}
            onReject={handleRejectMatch}
            onBulkAccept={handleBulkAcceptReview}
            onBulkReject={handleBulkRejectReview}
            loading={loading.review}
          />
        );
      }
    }

    if (activeSection === "images") {
      if (activeImageTab === "raw") {
        return (
          <RawImagesTable
            medicines={rawImageMedicines}
            selectedIds={selectedRaw}
            onSelectionChange={setSelectedRaw}
            onUploadImage={handleUploadImage}
            onViewLinked={handleViewLinked}
          />
        );
      } else {
        return (
          <NoImagesTable
            medicines={noImageMedicines}
            selectedIds={selectedNone}
            onSelectionChange={setSelectedNone}
            onUploadImage={handleUploadImage}
            onViewLinked={handleViewLinked}
          />
        );
      }
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Title Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Pill size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Master Medicine Catalog
              </h1>
              <p className="text-sm text-gray-500">
                Global medicine database with image and mapping management
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading.stats || loading.catalog}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50"
          >
            {loading.stats || loading.catalog ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatBadge icon={Package} label="Masters" value={stats.totalMasters} color="gray" />
          <StatBadge icon={CheckCircle2} label="Verified" value={stats.verified} color="green" />
          <StatBadge icon={AlertTriangle} label="Raw" value={stats.raw} color="amber" />
          <StatBadge icon={ImageOff} label="No Image" value={stats.none} color="red" />
          <div className="h-6 w-px bg-gray-300 hidden md:block" />
          <StatBadge icon={LinkIcon} label="Unmapped" value={stats.unmapped} color="orange" />
          <StatBadge icon={HelpCircle} label="Review" value={stats.needsReview} color="yellow" />
        </div>

        {/* MAIN SECTION TABS */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {MAIN_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            let count = 0;
            if (section.id === "catalog") count = stats.totalMasters;
            if (section.id === "mapping") count = stats.unmapped + stats.needsReview;
            if (section.id === "images") count = stats.raw + stats.none;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                  transition-all duration-200
                  ${isActive
                    ? "bg-white text-[#000060] shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }
                `}
              >
                <Icon size={16} />
                {section.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? "bg-[#000060] text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {count}
                </span>
                {section.id === "mapping" && count > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                )}
                {section.id === "images" && count > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* SUB TABS */}
        {activeSection === "mapping" && (
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg w-fit border border-gray-200">
            {MAPPING_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMappingTab === tab.id;
              const count = tab.id === "unmapped" ? stats.unmapped : stats.needsReview;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMappingTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2
                    transition-all duration-200 ${
                    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeSection === "images" && (
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg w-fit border border-gray-200">
            {IMAGE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeImageTab === tab.id;
              const count = tab.id === "raw" ? stats.raw : stats.none;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveImageTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2
                    transition-all duration-200 ${
                    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSection}-${activeMappingTab}-${activeImageTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MODALS */}
      <MatchMedicineModal
        isOpen={matchModal.open}
        item={matchModal.item}
        source={matchModal.source}
        onClose={() => setMatchModal({ open: false, item: null, source: null })}
        onConfirm={handleConfirmMatch}
      />

      <CreateMedicineModal
        isOpen={createModal.open}
        item={createModal.item}
        onClose={() => setCreateModal({ open: false, item: null })}
        onConfirm={handleConfirmCreate}
      />

      <UnmappedDetailModal
        isOpen={detailModal.open}
        item={detailModal.item}
        onClose={() => setDetailModal({ open: false, item: null })}
        onMatch={() => {
          setDetailModal({ open: false, item: null });
          handleMatchUnmapped(detailModal.item);
        }}
        onCreate={() => {
          setDetailModal({ open: false, item: null });
          handleCreateFromUnmapped(detailModal.item);
        }}
      />

      <LinkedMedicinesModal
        isOpen={linkedModal.open}
        medicine={linkedModal.medicine}
        linkedData={linkedModal.linkedData}
        onClose={() => setLinkedModal({ open: false, medicine: null, linkedData: [] })}
        onUnlink={handleUnlinkMedicine}
      />

      <ImageUploadModal
        isOpen={imageModal.open}
        medicine={imageModal.medicine}
        onClose={() => setImageModal({ open: false, medicine: null })}
        onImageUploaded={handleImageUploaded}
      />

      <MasterMedicineDetailModal
        isOpen={masterDetailModal.open}
        medicine={masterDetailModal.medicine}
        linkedData={masterDetailModal.linkedData}
        onClose={() => setMasterDetailModal({ open: false, medicine: null, linkedData: [] })}
        onUploadImage={handleUploadImage}
        onViewVariantLinked={handleViewVariantLinked}
        onEdit={(medicine) => {
          // TODO: Implement edit functionality
          console.log("Edit medicine:", medicine);
        }}
        onDelete={(medicine) => {
          // TODO: Implement delete functionality
          console.log("Delete medicine:", medicine);
        }}
      />

      <VariantLinkedModal
        isOpen={variantLinkedModal.open}
        variant={variantLinkedModal.variant}
        linkedData={variantLinkedModal.linkedData}
        onClose={() => setVariantLinkedModal({ open: false, variant: null, linkedData: [] })}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════
const StatBadge = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${colorClasses[color]}`}>
      <Icon size={14} />
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
};

export default MasterMedicinesPage;