// cadmin/src/pages/MasterMedicines/MasterMedicinesPage.jsx

import { useState, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
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

// Mock Data
import {
  MOCK_MASTER_MEDICINES,
  MOCK_UNMAPPED_MEDICINES,
  MOCK_NEEDS_REVIEW,
  IMAGE_STATUS,
  calculateStats,
} from "./mockMasterMedicineDataV3";

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

// ═══════════════════════════════════════════════════════════════
// SUB TABS FOR MAPPING SECTION
// ═══════════════════════════════════════════════════════════════
const MAPPING_TABS = [
  { id: "unmapped", label: "Unmapped", icon: LinkIcon },
  { id: "review", label: "Needs Review", icon: HelpCircle },
];

// ═══════════════════════════════════════════════════════════════
// SUB TABS FOR IMAGES SECTION
// ═══════════════════════════════════════════════════════════════
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
  // STATE - Data
  // ═══════════════════════════════════════════════════════════
  const [masterData, setMasterData] = useState(MOCK_MASTER_MEDICINES);
  const [unmappedData, setUnmappedData] = useState(MOCK_UNMAPPED_MEDICINES);
  const [reviewData, setReviewData] = useState(MOCK_NEEDS_REVIEW);

  // ═══════════════════════════════════════════════════════════
  // STATE - Modals
  // ═══════════════════════════════════════════════════════════
  const [matchModal, setMatchModal] = useState({ open: false, item: null, source: null });
  const [createModal, setCreateModal] = useState({ open: false, item: null });
  const [detailModal, setDetailModal] = useState({ open: false, item: null });
  const [linkedModal, setLinkedModal] = useState({ open: false, medicine: null });
  const [imageModal, setImageModal] = useState({ open: false, medicine: null });

  // ═══════════════════════════════════════════════════════════
  // STATE - Selection for Bulk Actions
  // ═══════════════════════════════════════════════════════════
  const [selectedUnmapped, setSelectedUnmapped] = useState([]);
  const [selectedReview, setSelectedReview] = useState([]);
  const [selectedRaw, setSelectedRaw] = useState([]);
  const [selectedNone, setSelectedNone] = useState([]);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED - Stats
  // ═══════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    return calculateStats(masterData, unmappedData, reviewData);
  }, [masterData, unmappedData, reviewData]);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED - Filtered Data for Image Tabs
  // ═══════════════════════════════════════════════════════════
  const rawImageMedicines = useMemo(() => {
    return masterData.filter((m) => m.imageStatus === IMAGE_STATUS.RAW);
  }, [masterData]);

  const noImageMedicines = useMemo(() => {
    return masterData.filter((m) => m.imageStatus === IMAGE_STATUS.NONE);
  }, [masterData]);

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
    (item) => {
      setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));
      toast.success("Item Ignored", `"${item.normalizedName}" has been ignored.`);
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
    (item) => {
      // Find the suggested master and add this as a linked medicine
      const masterIndex = masterData.findIndex((m) => m.id === item.suggestedMaster.id);
      
      if (masterIndex !== -1) {
        const updatedMasters = [...masterData];
        const newLinked = {
          id: `lm-new-${Date.now()}`,
          originalName: item.rawName,
          normalizedName: item.normalizedRaw,
          shopId: item.shopId,
          shopName: item.shopName,
          occurrenceCount: item.occurrenceCount,
          linkedAt: new Date().toISOString(),
          linkedBy: "Admin User",
        };
        
        updatedMasters[masterIndex] = {
          ...updatedMasters[masterIndex],
          linkedMedicines: [...(updatedMasters[masterIndex].linkedMedicines || []), newLinked],
          updatedAt: new Date().toISOString(),
        };
        
        setMasterData(updatedMasters);
      }

      setReviewData((prev) => prev.filter((r) => r.id !== item.id));
      toast.success("Match Accepted", `"${item.rawName}" linked to "${item.suggestedMaster.name}"`);
    },
    [masterData, toast]
  );

  const handleChangeMatch = useCallback((item) => {
    setMatchModal({ open: true, item, source: "review" });
  }, []);

  const handleRejectMatch = useCallback(
    (item) => {
      const newUnmapped = {
        id: `um-new-${Date.now()}`,
        normalizedName: item.normalizedRaw,
        sampleNames: [item.rawName],
        occurrenceCount: item.occurrenceCount,
        shopCount: 1,
        type: item.suggestedMaster.type,
        hasImageSuggestion: false,
        firstSeenAt: item.firstSeenAt,
        lastSeenAt: new Date().toISOString(),
        shops: [{ id: item.shopId, name: item.shopName, count: item.occurrenceCount }],
      };

      setUnmappedData((prev) => [newUnmapped, ...prev]);
      setReviewData((prev) => prev.filter((r) => r.id !== item.id));
      toast.info("Match Rejected", `"${item.rawName}" moved to Unmapped`);
    },
    [toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Image Actions
  // ═══════════════════════════════════════════════════════════
  const handleUploadImage = useCallback((medicine) => {
    setImageModal({ open: true, medicine });
  }, []);

  const handleImageUploaded = useCallback(
    (medicineId, newImages, newStatus) => {
      setMasterData((prev) =>
        prev.map((m) =>
          m.id === medicineId
            ? {
                ...m,
                images: newImages,
                imageStatus: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      toast.success("Image Updated", "Medicine image has been updated successfully");
    },
    [toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Linked Medicines
  // ═══════════════════════════════════════════════════════════
  const handleViewLinked = useCallback((medicine) => {
    setLinkedModal({ open: true, medicine });
  }, []);

  const handleUnlinkMedicine = useCallback(
    (masterId, linkedId) => {
      setMasterData((prev) =>
        prev.map((m) =>
          m.id === masterId
            ? {
                ...m,
                linkedMedicines: m.linkedMedicines.filter((lm) => lm.id !== linkedId),
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      toast.success("Medicine Unlinked", "Shop medicine has been unlinked");
    },
    [toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Modal Confirmations
  // ═══════════════════════════════════════════════════════════
  const handleConfirmMatch = useCallback(
    (selectedMaster) => {
      const { item, source } = matchModal;

      const newLinked = {
        id: `lm-new-${Date.now()}`,
        originalName: source === "unmapped" ? item.sampleNames[0] : item.rawName,
        normalizedName: source === "unmapped" ? item.normalizedName : item.normalizedRaw,
        shopId: source === "unmapped" ? item.shops[0]?.id : item.shopId,
        shopName: source === "unmapped" ? item.shops[0]?.name : item.shopName,
        occurrenceCount: item.occurrenceCount,
        linkedAt: new Date().toISOString(),
        linkedBy: "Admin User",
      };

      setMasterData((prev) =>
        prev.map((m) =>
          m.id === selectedMaster.id
            ? {
                ...m,
                linkedMedicines: [...(m.linkedMedicines || []), newLinked],
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );

      if (source === "unmapped") {
        setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));
      } else {
        setReviewData((prev) => prev.filter((r) => r.id !== item.id));
      }

      setMatchModal({ open: false, item: null, source: null });
      toast.success("Medicine Mapped", `Successfully mapped to "${selectedMaster.name}"`);
    },
    [matchModal, toast]
  );

  const handleConfirmCreate = useCallback(
    (newMedicine) => {
      const { item } = createModal;

      const created = {
        id: `mm-new-${Date.now()}`,
        name: newMedicine.name,
        normalizedName: newMedicine.name.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim(),
        composition: newMedicine.composition || "N/A",
        type: newMedicine.type,
        manufacturer: newMedicine.manufacturer,
        marketer: newMedicine.marketer || newMedicine.manufacturer,
        packSize: newMedicine.packSize || "N/A",
        prescriptionRequired: newMedicine.prescriptionRequired || false,
        isActive: true,
        imageStatus: IMAGE_STATUS.NONE,
        images: [],
        linkedMedicines: [
          {
            id: `lm-new-${Date.now()}`,
            originalName: item.sampleNames[0],
            normalizedName: item.normalizedName,
            shopId: item.shops[0]?.id,
            shopName: item.shops[0]?.name,
            occurrenceCount: item.occurrenceCount,
            linkedAt: new Date().toISOString(),
            linkedBy: "Admin User",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMasterData((prev) => [created, ...prev]);
      setUnmappedData((prev) => prev.filter((u) => u.id !== item.id));

      setCreateModal({ open: false, item: null });
      toast.success("Medicine Created", `"${newMedicine.name}" added to Master Catalog`);
    },
    [createModal, toast]
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Bulk Actions
  // ═══════════════════════════════════════════════════════════
  const handleBulkIgnoreUnmapped = useCallback(() => {
    if (selectedUnmapped.length === 0) return;
    setUnmappedData((prev) => prev.filter((u) => !selectedUnmapped.includes(u.id)));
    setSelectedUnmapped([]);
    toast.success("Bulk Ignore", `${selectedUnmapped.length} item(s) have been ignored`);
  }, [selectedUnmapped, toast]);

  const handleBulkAcceptReview = useCallback(() => {
    if (selectedReview.length === 0) return;

    const itemsToAccept = reviewData.filter((r) => selectedReview.includes(r.id));
    
    const updatedMasters = [...masterData];
    itemsToAccept.forEach((item) => {
      const masterIndex = updatedMasters.findIndex((m) => m.id === item.suggestedMaster.id);
      if (masterIndex !== -1) {
        const newLinked = {
          id: `lm-new-${Date.now()}-${item.id}`,
          originalName: item.rawName,
          normalizedName: item.normalizedRaw,
          shopId: item.shopId,
          shopName: item.shopName,
          occurrenceCount: item.occurrenceCount,
          linkedAt: new Date().toISOString(),
          linkedBy: "Admin User",
        };
        updatedMasters[masterIndex].linkedMedicines = [
          ...(updatedMasters[masterIndex].linkedMedicines || []),
          newLinked,
        ];
      }
    });

    setMasterData(updatedMasters);
    setReviewData((prev) => prev.filter((r) => !selectedReview.includes(r.id)));
    setSelectedReview([]);
    toast.success("Bulk Accept", `${itemsToAccept.length} match(es) have been accepted`);
  }, [selectedReview, reviewData, masterData, toast]);

  const handleBulkRejectReview = useCallback(() => {
    if (selectedReview.length === 0) return;

    const itemsToReject = reviewData.filter((r) => selectedReview.includes(r.id));
    const newUnmapped = itemsToReject.map((item) => ({
      id: `um-new-${Date.now()}-${item.id}`,
      normalizedName: item.normalizedRaw,
      sampleNames: [item.rawName],
      occurrenceCount: item.occurrenceCount,
      shopCount: 1,
      type: item.suggestedMaster.type,
      hasImageSuggestion: false,
      firstSeenAt: item.firstSeenAt,
      lastSeenAt: new Date().toISOString(),
      shops: [{ id: item.shopId, name: item.shopName, count: item.occurrenceCount }],
    }));

    setUnmappedData((prev) => [...newUnmapped, ...prev]);
    setReviewData((prev) => prev.filter((r) => !selectedReview.includes(r.id)));
    setSelectedReview([]);
    toast.info("Bulk Reject", `${itemsToReject.length} item(s) moved to Unmapped`);
  }, [selectedReview, reviewData, toast]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS - Refresh
  // ═══════════════════════════════════════════════════════════
  const handleRefresh = useCallback(() => {
    setMasterData(MOCK_MASTER_MEDICINES);
    setUnmappedData(MOCK_UNMAPPED_MEDICINES);
    setReviewData(MOCK_NEEDS_REVIEW);
    setSelectedUnmapped([]);
    setSelectedReview([]);
    setSelectedRaw([]);
    setSelectedNone([]);
    toast.info("Data Refreshed", "All data has been reset to original state");
  }, [toast]);

  // ═══════════════════════════════════════════════════════════
  // RENDER - Current Active Content
  // ═══════════════════════════════════════════════════════════
  const renderContent = () => {
    if (activeSection === "catalog") {
      return (
        <MasterCatalogTable
          medicines={masterData}
          onViewLinked={handleViewLinked}
          onUploadImage={handleUploadImage}
          loading={false}
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
      {/* ═══════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Title Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Pill size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Master Medicine Catalog V3
              </h1>
              <p className="text-sm text-gray-500">
                Comprehensive medicine data management with image control
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Reset Data</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatBadge icon={Package} label="Total Masters" value={stats.totalMasters} color="gray" />
          <StatBadge icon={CheckCircle2} label="Verified" value={stats.verified} color="green" />
          <StatBadge icon={AlertTriangle} label="Raw" value={stats.raw} color="amber" />
          <StatBadge icon={ImageOff} label="No Image" value={stats.none} color="red" />
          <div className="h-6 w-px bg-gray-300 hidden md:block" />
          <StatBadge icon={LinkIcon} label="Linked" value={stats.totalLinked} color="blue" />
          <StatBadge icon={LinkIcon} label="Unmapped" value={stats.unmapped} color="orange" />
          <StatBadge icon={HelpCircle} label="Review" value={stats.needsReview} color="yellow" />
        </div>

        {/* ═══════════════════════════════════════════════════════
            MAIN SECTION TABS
        ═══════════════════════════════════════════════════════ */}
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
                  ${
                    isActive
                      ? "bg-white text-[#000060] shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }
                `}
              >
                <Icon size={16} />
                {section.label}
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${
                      isActive
                        ? "bg-[#000060] text-white"
                        : "bg-gray-200 text-gray-600"
                    }
                  `}
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

        {/* ═══════════════════════════════════════════════════════
            SUB TABS (Conditional)
        ═══════════════════════════════════════════════════════ */}
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
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span
                    className={`
                      px-1.5 py-0.5 rounded-full text-xs font-bold
                      ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"}
                    `}
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
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span
                    className={`
                      px-1.5 py-0.5 rounded-full text-xs font-bold
                      ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"}
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════ */}
      <MatchMedicineModal
        isOpen={matchModal.open}
        item={matchModal.item}
        source={matchModal.source}
        masterMedicines={masterData}
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
        onClose={() => setLinkedModal({ open: false, medicine: null })}
        onUnlink={handleUnlinkMedicine}
      />

      <ImageUploadModal
        isOpen={imageModal.open}
        medicine={imageModal.medicine}
        onClose={() => setImageModal({ open: false, medicine: null })}
        onImageUploaded={handleImageUploaded}
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