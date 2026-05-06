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
import ReviewDetailModal from "./comps/ReviewDetailModal";
import MasterCatalogGrid from "./comps/MasterCatalogGrid";
import ConfirmDialog from "../../components/common/ConfirmDialog";

// API
import {
  getMasterMedicines,
  getMasterMedicineById,
  getMasterMedicineStats,
  getUnmappedMedicines,
  getNeedsReview,
  getLinkedMedicines as fetchLinkedMedicines,
  getLinkedByVariant,
  acceptReviewMatch,
  rejectReviewMatch,
  matchToVariant,
  ignoreUnmapped,
  unlinkMedicine as apiUnlinkMedicine,
  IMAGE_STATUS,
  createMasterMedicine,
} from "../../api/cadminMasterMedicines";

import { useToast } from "../../components/common/Toast";
import { useModalStack } from "../../hooks/useModalStack";

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

const MasterMedicinesPage = () => {
  const toast = useToast();

  // ── Modal z-index stack ──
  const { bringToFront, getZ } = useModalStack();

  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  const [activeSection, setActiveSection] = useState("catalog");
  const [activeMappingTab, setActiveMappingTab] = useState("unmapped");
  const [activeImageTab, setActiveImageTab] = useState("raw");

  const [loading, setLoading] = useState({
    stats: true,
    catalog: false,
    unmapped: false,
    review: false,
  });

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

  const [catalogData, setCatalogData] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
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

  const [unmappedData, setUnmappedData] = useState([]);
  const [unmappedMeta, setUnmappedMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [reviewData, setReviewData] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Modals
  const [matchModal, setMatchModal] = useState({
    open: false,
    item: null,
    source: null,
  });
  const [createModal, setCreateModal] = useState({ open: false, item: null });
  const [detailModal, setDetailModal] = useState({ open: false, item: null });
  const [linkedModal, setLinkedModal] = useState({
    open: false,
    medicine: null,
    linkedData: [],
  });
  const [imageModal, setImageModal] = useState({ open: false, medicine: null });
  const [masterDetailModal, setMasterDetailModal] = useState({
    open: false,
    medicine: null,
    linkedData: [],
  });
  const [variantLinkedModal, setVariantLinkedModal] = useState({
    open: false,
    variant: null,
    linkedData: [],
  });
  const [reviewDetailModal, setReviewDetailModal] = useState({
    open: false,
    item: null,
  });

  // Ignore confirmation
  const [confirmIgnore, setConfirmIgnore] = useState({
    open: false,
    item: null,
    bulk: false,
  });

  // Selection
  const [selectedUnmapped, setSelectedUnmapped] = useState([]);
  const [selectedReview, setSelectedReview] = useState([]);
  const [selectedRaw, setSelectedRaw] = useState([]);
  const [selectedNone, setSelectedNone] = useState([]);
  const [rawImageData, setRawImageData] = useState([]);
  const [noImageData, setNoImageData] = useState([]);
  const [catalogViewMode, setCatalogViewMode] = useState("table");

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════
  const loadStats = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, stats: true }));
      const res = await getMasterMedicineStats();
      const data = res.data?.data;
      if (data) {
        setStats((prev) => ({
          ...prev,
          totalMasters: data.overview?.totalMasters || 0,
          totalVariants: data.overview?.totalVariants || 0,
          verified: data.byImageStatus?.verified || 0,
          raw: data.byImageStatus?.raw || 0,
          none: data.byImageStatus?.none || 0,
          drugs: data.byType?.drug || 0,
          otc: data.byType?.otc || 0,
          unmapped: data.mapping?.unmapped ?? prev.unmapped ?? 0,
          needsReview: data.mapping?.needsReview ?? prev.needsReview ?? 0,
          totalLinked: data.mapping?.totalLinked ?? prev.totalLinked ?? 0,
        }));
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  }, []);

  const loadCatalog = useCallback(
    async (filters = catalogFilters) => {
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
            manufacturer:
              med.previewVariants?.[0]?.manufacturer ||
              med.previewVariants?.[0]?.marketer ||
              "N/A",
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
    },
    [catalogFilters, toast],
  );

  const loadUnmapped = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, unmapped: true }));
      const res = await getUnmappedMedicines({ page: 1, limit: 100 });
      const data = res.data?.data;
      if (data) {
        setUnmappedData(data.unmapped || []);
        setUnmappedMeta(
          data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
        );
        setStats((prev) => ({ ...prev, unmapped: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error("Failed to load unmapped:", error);
    } finally {
      setLoading((prev) => ({ ...prev, unmapped: false }));
    }
  }, []);

  const loadReview = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, review: true }));
      const res = await getNeedsReview({ page: 1, limit: 100 });
      const data = res.data?.data;
      if (data) {
        setReviewData(data.reviewItems || []);
        setReviewMeta(
          data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
        );
        setStats((prev) => ({ ...prev, needsReview: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error("Failed to load review:", error);
    } finally {
      setLoading((prev) => ({ ...prev, review: false }));
    }
  }, []);

  const loadRawImages = useCallback(async () => {
    try {
      const res = await getMasterMedicines({
        imageStatus: IMAGE_STATUS.RAW,
        page: 1,
        limit: 100,
        sort: "updated_at",
        order: "desc",
      });
      const data = res.data?.data;
      if (data) {
        setRawImageData(
          data.medicines.map((med) => ({
            id: med.id,
            masterKey: med.masterKey,
            name: med.genericName,
            genericName: med.genericName,
            composition: Array.isArray(med.composition)
              ? med.composition.map((c) => c.name).join(" + ")
              : med.composition || "N/A",
            type: med.type,
            form: med.form,
            manufacturer:
              med.previewVariants?.[0]?.manufacturer ||
              med.previewVariants?.[0]?.marketer ||
              "N/A",
            packSize: med.previewVariants?.[0]?.packSize || "N/A",
            variantCount: med.variantCount,
            imageStatus: med.imageStatus,
            primaryImage: med.primaryImage,
            previewVariants: med.previewVariants || [],
            linkedMedicines: [],
            createdAt: med.createdAt,
            updatedAt: med.updatedAt,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load raw images:", error);
    }
  }, []);

  const loadNoImages = useCallback(async () => {
    try {
      const res = await getMasterMedicines({
        imageStatus: IMAGE_STATUS.NONE,
        page: 1,
        limit: 100,
        sort: "created_at",
        order: "desc",
      });
      const data = res.data?.data;
      if (data) {
        setNoImageData(
          data.medicines.map((med) => ({
            id: med.id,
            masterKey: med.masterKey,
            name: med.genericName,
            genericName: med.genericName,
            composition: Array.isArray(med.composition)
              ? med.composition.map((c) => c.name).join(" + ")
              : med.composition || "N/A",
            type: med.type,
            form: med.form,
            manufacturer:
              med.previewVariants?.[0]?.manufacturer ||
              med.previewVariants?.[0]?.marketer ||
              "N/A",
            packSize: med.previewVariants?.[0]?.packSize || "N/A",
            variantCount: med.variantCount,
            imageStatus: med.imageStatus,
            primaryImage: med.primaryImage,
            previewVariants: med.previewVariants || [],
            linkedMedicines: [],
            createdAt: med.createdAt,
            updatedAt: med.updatedAt,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load no-image medicines:", error);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCatalog();
    loadUnmapped();
    loadReview();
    loadNoImages();
    loadRawImages();
  }, []); // eslint-disable-line

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Unmapped
  // ═══════════════════════════════════════════════════════════
  const handleMatchUnmapped = useCallback(
    (item) => {
      setMatchModal({ open: true, item, source: "unmapped" });
      bringToFront("match");
    },
    [bringToFront],
  );

  const handleCreateFromUnmapped = useCallback(
    (item) => {
      setCreateModal({ open: true, item });
      bringToFront("create");
    },
    [bringToFront],
  );

  // ── Ignore: open confirmation dialog instead of executing directly ──
  const handleIgnoreUnmapped = useCallback((item) => {
    setConfirmIgnore({ open: true, item, bulk: false });
  }, []);

  const handleViewUnmappedDetail = useCallback(
    (item) => {
      setDetailModal({ open: true, item });
      bringToFront("unmappedDetail");
    },
    [bringToFront],
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Review
  // ═══════════════════════════════════════════════════════════
  const handleAcceptMatch = useCallback(
    async (item) => {
      try {
        const res = await acceptReviewMatch(item.id);
        const linkedTo = res.data?.data?.linkedTo;
        setReviewData((prev) => prev.filter((r) => r.id !== item.id));
        setStats((prev) => ({
          ...prev,
          needsReview: Math.max(0, prev.needsReview - 1),
          totalLinked: prev.totalLinked + 1,
        }));
        toast.success(
          "Match Accepted",
          `"${item.rawName}" linked to variant "${linkedTo?.variant_name || item.suggestedMaster?.name}"`,
        );
      } catch (error) {
        console.error("Failed to accept match:", error);
        toast.error("Failed", "Could not accept match");
      }
    },
    [toast],
  );

  const handleChangeMatch = useCallback(
    (item) => {
      setMatchModal({ open: true, item, source: "review" });
      bringToFront("match");
    },
    [bringToFront],
  );

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
    [toast, loadUnmapped],
  );

  const handleViewReviewDetail = useCallback(
    (item) => {
      setReviewDetailModal({ open: true, item });
      bringToFront("reviewDetail");
    },
    [bringToFront],
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Images
  // ═══════════════════════════════════════════════════════════

  const handleUploadImage = useCallback(
    (medicine) => {
      setImageModal({ open: true, medicine });
      bringToFront("imageUpload");
    },
    [bringToFront],
  );

  const handleImageUploaded = useCallback(() => {
    loadCatalog();
    loadStats();
    loadRawImages();
    loadNoImages();
    toast.success(
      "Image Updated",
      "Medicine image has been updated successfully",
    );
    if (masterDetailModal.open && masterDetailModal.medicine) {
      getMasterMedicineById(masterDetailModal.medicine.id)
        .then((res) => {
          const fullMedicine = res.data?.data;
          if (fullMedicine) {
            fetchLinkedMedicines(masterDetailModal.medicine.id).then(
              (linkedRes) => {
                setMasterDetailModal({
                  open: true,
                  medicine: fullMedicine,
                  linkedData: linkedRes.data?.data || [],
                });
              },
            );
          }
        })
        .catch(() => {});
    }
  }, [
    loadCatalog,
    loadStats,
    loadRawImages,
    loadNoImages,
    toast,
    masterDetailModal.open,
    masterDetailModal.medicine,
  ]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Linked Medicines
  // ═══════════════════════════════════════════════════════════
  const handleViewLinked = useCallback(
    async (medicine) => {
      try {
        const res = await fetchLinkedMedicines(medicine.id);
        const linked = res.data?.data || [];
        setLinkedModal({ open: true, medicine, linkedData: linked });
        bringToFront("linked");
      } catch (error) {
        console.error("Failed to load linked:", error);
        toast.error("Failed", "Could not load linked medicines");
      }
    },
    [toast, bringToFront],
  );

  const handleUnlinkMedicine = useCallback(
    async (masterId, linkedId) => {
      try {
        await apiUnlinkMedicine(linkedId);
        setLinkedModal((prev) => ({
          ...prev,
          linkedData: prev.linkedData.filter((lm) => lm.id !== linkedId),
        }));
        setStats((prev) => ({
          ...prev,
          totalLinked: Math.max(0, prev.totalLinked - 1),
        }));
        toast.success("Medicine Unlinked", "Shop medicine has been unlinked");
      } catch (error) {
        console.error("Failed to unlink:", error);
        toast.error("Failed", "Could not unlink medicine");
      }
    },
    [toast],
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Master Detail Modal
  // ═══════════════════════════════════════════════════════════

  const handleViewMasterDetail = useCallback(
    async (medicine) => {
      try {
        const res = await getMasterMedicineById(medicine.id);
        const fullMedicine = res.data?.data;
        if (!fullMedicine) {
          toast.error("Not Found", "Medicine details not found");
          return;
        }
        const linkedRes = await fetchLinkedMedicines(medicine.id);
        const linked = linkedRes.data?.data || [];

        setMasterDetailModal({
          open: true,
          medicine: fullMedicine,
          linkedData: linked,
        });
        bringToFront("masterDetail");
      } catch (error) {
        console.error("Failed to load medicine details:", error);
        toast.error("Failed", "Could not load medicine details");
      }
    },
    [toast, bringToFront],
  );

  const handleViewVariantLinked = useCallback(
    async (variant) => {
      try {
        const res = await getLinkedByVariant(variant.id);
        const data = res.data?.data;
        setVariantLinkedModal({
          open: true,
          variant: data?.variant || variant,
          linkedData: data?.linkedMedicines || [],
        });
        bringToFront("variantLinked");
      } catch (error) {
        console.error("Failed to load variant linked:", error);
        const fallbackLinked = masterDetailModal.linkedData.filter(
          (linked) => linked.linkedVariantId === variant.id,
        );
        setVariantLinkedModal({
          open: true,
          variant,
          linkedData: fallbackLinked,
        });
        bringToFront("variantLinked");
      }
    },
    [masterDetailModal.linkedData, bringToFront],
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Modal Confirmations
  // ═══════════════════════════════════════════════════════════
  const handleConfirmMatch = useCallback(
    async (selection) => {
      const { item, source } = matchModal;
      try {
        const medicineIds =
          source === "unmapped" ? item.medicineIds || [] : [item.id];
        const variantId = selection.variantId || selection.variant?.id;
        if (!variantId) {
          toast.error(
            "Error",
            "No variant selected. Please select a specific variant.",
          );
          return;
        }
        await matchToVariant(medicineIds, variantId);
        if (source === "unmapped") {
          setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));
          setStats((prev) => ({
            ...prev,
            unmapped: Math.max(0, prev.unmapped - 1),
          }));
        } else {
          setReviewData((prev) => prev.filter((r) => r.id !== item.id));
          setStats((prev) => ({
            ...prev,
            needsReview: Math.max(0, prev.needsReview - 1),
          }));
        }
        setStats((prev) => ({
          ...prev,
          totalLinked: prev.totalLinked + medicineIds.length,
        }));
        setMatchModal({ open: false, item: null, source: null });
        const variantName =
          selection.variantName || selection.variant?.name || selection.name;
        toast.success(
          "Medicine Linked",
          `Successfully linked to variant "${variantName}"`,
        );
      } catch (error) {
        console.error("Failed to match:", error);
        toast.error(
          "Failed",
          error.response?.data?.message || "Could not complete the match",
        );
      }
    },
    [matchModal, toast],
  );

  const handleConfirmCreate = useCallback(
    async (payload) => {
      try {
        // 1. Create the master medicine + first variant
        const res = await createMasterMedicine({
          name: payload.name,
          genericName: payload.genericName,
          masterKey: payload.masterKey,
          type: payload.type,
          form: payload.form,
          composition: payload.composition,
          manufacturer: payload.manufacturer,
          marketer: payload.marketer,
          packSize: payload.packSize,
          prescriptionRequired: payload.prescriptionRequired,
          hsn_code: payload.hsn_code,
          schedule: payload.schedule,
          category: payload.category,
          subCategory: payload.subCategory,
        });

        const created = res.data?.data;

        // 2. Upload images if any
        if (payload.images?.length > 0 && created?.master?.id) {
          const skuId = created.variant?.skuId || null;

          for (const img of payload.images) {
            if (img.file) {
              try {
                const { uploadImage } =
                  await import("../../api/cadminMasterMedicines");
                await uploadImage(
                  created.master.id,
                  img.file,
                  img.type || "GALLERY",
                  skuId,
                );
              } catch (imgErr) {
                console.warn("Failed to upload image:", imgErr);
              }
            }
          }
        }

        // 3. Remove from unmapped if the source item had medicineIds
        if (createModal.item?.medicineIds?.length > 0) {
          try {
            await ignoreUnmapped(createModal.item.medicineIds);
            setUnmappedData((prev) =>
              prev.filter((u) => u.id !== createModal.item.id),
            );
            setStats((prev) => ({
              ...prev,
              unmapped: Math.max(0, prev.unmapped - 1),
            }));
          } catch (e) {
            console.warn("Failed to remove from unmapped:", e);
          }
        }

        setCreateModal({ open: false, item: null });
        loadCatalog();
        loadStats();

        toast.success(
          "Medicine Created",
          `"${payload.name}" added to Master Catalog`,
        );
      } catch (error) {
        console.error("Failed to create medicine:", error);
        toast.error(
          "Creation Failed",
          error.response?.data?.message || "Could not create medicine",
        );
      }
    },
    [createModal.item, loadCatalog, loadStats, loadUnmapped, toast],
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Ignore Execution (called from ConfirmDialog)
  // ═══════════════════════════════════════════════════════════
  const executeIgnore = useCallback(async () => {
    const { item, bulk } = confirmIgnore;

    try {
      if (bulk) {
        // Bulk ignore
        const allMedicineIds = unmappedData
          .filter((u) => selectedUnmapped.includes(u.id))
          .flatMap((u) => u.medicineIds || []);
        await ignoreUnmapped(allMedicineIds);
        setUnmappedData((prev) =>
          prev.filter((u) => !selectedUnmapped.includes(u.id)),
        );
        setStats((prev) => ({
          ...prev,
          unmapped: Math.max(0, prev.unmapped - selectedUnmapped.length),
        }));
        setSelectedUnmapped([]);
        toast.success(
          "Bulk Ignore",
          `${selectedUnmapped.length} item(s) have been ignored`,
        );
      } else if (item) {
        // Single ignore
        await ignoreUnmapped(item.medicineIds || []);
        setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));
        setStats((prev) => ({
          ...prev,
          unmapped: Math.max(0, prev.unmapped - 1),
        }));
        toast.success(
          "Item Ignored",
          `"${item.normalizedName}" has been ignored.`,
        );
      }
    } catch (error) {
      console.error("Failed to ignore:", error);
      toast.error("Failed", "Could not ignore item(s)");
    } finally {
      setConfirmIgnore({ open: false, item: null, bulk: false });
    }
  }, [confirmIgnore, unmappedData, selectedUnmapped, toast]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Bulk Actions
  // ═══════════════════════════════════════════════════════════

  // ── Bulk ignore: open confirmation dialog instead of executing directly ──
  const handleBulkIgnoreUnmapped = useCallback(() => {
    if (selectedUnmapped.length === 0) return;
    setConfirmIgnore({ open: true, item: null, bulk: true });
  }, [selectedUnmapped]);

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
      setReviewData((prev) =>
        prev.filter((r) => !selectedReview.includes(r.id)),
      );
      setStats((prev) => ({
        ...prev,
        needsReview: Math.max(0, prev.needsReview - successCount),
        totalLinked: prev.totalLinked + successCount,
      }));
      setSelectedReview([]);
      toast.success(
        "Bulk Accept",
        `${successCount} match(es) have been accepted`,
      );
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
      setReviewData((prev) =>
        prev.filter((r) => !selectedReview.includes(r.id)),
      );
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
    loadRawImages();
    loadNoImages();
    toast.info("Data Refreshed", "All data has been reloaded from server");
  }, [
    loadStats,
    loadCatalog,
    loadUnmapped,
    loadReview,
    loadRawImages,
    loadNoImages,
    toast,
  ]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  const renderContent = () => {
    if (activeSection === "catalog") {
      if (catalogViewMode === "grid") {
        return (
          <MasterCatalogGrid
            medicines={catalogData}
            meta={catalogMeta}
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
          viewMode={catalogViewMode}
          onViewModeChange={setCatalogViewMode}
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
            onViewDetail={handleViewReviewDetail}
            loading={loading.review}
          />
        );
      }
    }

    if (activeSection === "images") {
      if (activeImageTab === "raw") {
        return (
          <RawImagesTable
            medicines={rawImageData}
            selectedIds={selectedRaw}
            onSelectionChange={setSelectedRaw}
            onUploadImage={handleUploadImage}
            onViewLinked={handleViewLinked}
            onRowClick={handleViewMasterDetail}
          />
        );
      } else {
        return (
          <NoImagesTable
            medicines={noImageData}
            selectedIds={selectedNone}
            onSelectionChange={setSelectedNone}
            onUploadImage={handleUploadImage}
            onViewLinked={handleViewLinked}
          />
        );
      }
    }
  };

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
          <StatBadge
            icon={Package}
            label="Masters"
            value={stats.totalMasters}
            color="gray"
          />
          <StatBadge
            icon={CheckCircle2}
            label="Verified"
            value={stats.verified}
            color="green"
          />
          <StatBadge
            icon={AlertTriangle}
            label="Raw"
            value={stats.raw}
            color="amber"
          />
          <StatBadge
            icon={ImageOff}
            label="No Image"
            value={stats.none}
            color="red"
          />
          <div className="h-6 w-px bg-gray-300 hidden md:block" />
          <StatBadge
            icon={LinkIcon}
            label="Linked"
            value={stats.totalLinked}
            color="blue"
          />
          <StatBadge
            icon={LinkIcon}
            label="Unmapped"
            value={stats.unmapped}
            color="orange"
          />
          <StatBadge
            icon={HelpCircle}
            label="Review"
            value={stats.needsReview}
            color="yellow"
          />
        </div>

        {/* MAIN SECTION TABS */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {MAIN_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            let count = 0;
            if (section.id === "catalog") count = stats.totalMasters;
            if (section.id === "mapping")
              count = stats.unmapped + stats.needsReview;
            if (section.id === "images") count = stats.raw + stats.none;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                  transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#000060] shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
              >
                <Icon size={16} />
                {section.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-[#000060] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
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
              const count =
                tab.id === "unmapped" ? stats.unmapped : stats.needsReview;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMappingTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2
                    transition-all duration-200 ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
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
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTENT */}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODALS                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}

      <MatchMedicineModal
        isOpen={matchModal.open}
        item={matchModal.item}
        source={matchModal.source}
        onClose={() => setMatchModal({ open: false, item: null, source: null })}
        onConfirm={handleConfirmMatch}
        zIndex={getZ("match")}
      />

      <CreateMedicineModal
        isOpen={createModal.open}
        item={createModal.item}
        onClose={() => setCreateModal({ open: false, item: null })}
        onConfirm={handleConfirmCreate}
        zIndex={getZ("create")}
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
        zIndex={getZ("unmappedDetail")}
      />

      <LinkedMedicinesModal
        isOpen={linkedModal.open}
        medicine={linkedModal.medicine}
        linkedData={linkedModal.linkedData}
        onClose={() =>
          setLinkedModal({ open: false, medicine: null, linkedData: [] })
        }
        onUnlink={handleUnlinkMedicine}
        zIndex={getZ("linked")}
      />

      <ImageUploadModal
        isOpen={imageModal.open}
        medicine={imageModal.medicine}
        onClose={() => setImageModal({ open: false, medicine: null })}
        onImageUploaded={handleImageUploaded}
        onViewMasterDetail={handleViewMasterDetail}
        zIndex={getZ("imageUpload")}
      />

      <MasterMedicineDetailModal
        isOpen={masterDetailModal.open}
        medicine={masterDetailModal.medicine}
        linkedData={masterDetailModal.linkedData}
        onClose={() =>
          setMasterDetailModal({ open: false, medicine: null, linkedData: [] })
        }
        onUploadImage={handleUploadImage}
        onViewVariantLinked={handleViewVariantLinked}
        onEdit={(medicine) => console.log("Edit medicine:", medicine)}
        onDelete={(medicine) => console.log("Delete medicine:", medicine)}
        zIndex={getZ("masterDetail")}
      />

      <VariantLinkedModal
        isOpen={variantLinkedModal.open}
        variant={variantLinkedModal.variant}
        linkedData={variantLinkedModal.linkedData}
        onClose={() =>
          setVariantLinkedModal({ open: false, variant: null, linkedData: [] })
        }
        zIndex={getZ("variantLinked")}
      />

      <ReviewDetailModal
        isOpen={reviewDetailModal.open}
        item={reviewDetailModal.item}
        onClose={() => setReviewDetailModal({ open: false, item: null })}
        onAccept={handleAcceptMatch}
        onChange={handleChangeMatch}
        onReject={handleRejectMatch}
        zIndex={getZ("reviewDetail")}
      />

      {/* ── Ignore Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={confirmIgnore.open}
        onClose={() => setConfirmIgnore({ open: false, item: null, bulk: false })}
        onConfirm={executeIgnore}
        title={
          confirmIgnore.bulk
            ? "Ignore Selected Medicines?"
            : "Ignore Medicine Group?"
        }
        message={
          confirmIgnore.bulk ? (
            <div className="space-y-3">
              <p>
                Are you sure you want to ignore{" "}
                <strong>{selectedUnmapped.length}</strong> medicine group
                {selectedUnmapped.length !== 1 ? "s" : ""}?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} />
                  <span className="font-semibold">What this means:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    These medicines will be hidden from the mapping workflow
                  </li>
                  <li>
                    Shop inventories will NOT be affected — medicines remain
                    functional
                  </li>
                  <li>
                    Ignored medicines will remain unlinked to the master catalog
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                Are you sure you want to ignore{" "}
                <strong>"{confirmIgnore.item?.normalizedName}"</strong>?
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <strong>Entries:</strong>{" "}
                  {confirmIgnore.item?.occurrenceCount} medicine record
                  {confirmIgnore.item?.occurrenceCount !== 1 ? "s" : ""}
                </p>
                <p>
                  <strong>Shops affected:</strong>{" "}
                  {confirmIgnore.item?.shopCount}
                </p>
                {confirmIgnore.item?.manufacturers?.length > 0 && (
                  <p>
                    <strong>Manufacturers:</strong>{" "}
                    {confirmIgnore.item.manufacturers.slice(0, 3).join(", ")}
                  </p>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} />
                  <span className="font-semibold">What this means:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    This group will be hidden from the unmapped queue
                  </li>
                  <li>Shop inventories will NOT be affected</li>
                  <li>
                    These medicines will remain unlinked to the master catalog
                  </li>
                </ul>
              </div>
            </div>
          )
        }
        confirmText={
          confirmIgnore.bulk
            ? `Ignore ${selectedUnmapped.length} Group${selectedUnmapped.length !== 1 ? "s" : ""}`
            : "Ignore"
        }
        type="danger"
      />
    </div>
  );
};

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
    <div
      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${colorClasses[color]}`}
    >
      <Icon size={14} />
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
};

export default MasterMedicinesPage;