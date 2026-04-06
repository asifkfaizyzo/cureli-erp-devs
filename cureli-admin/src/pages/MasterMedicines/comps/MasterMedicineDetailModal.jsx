// cadmin/src/pages/MasterMedicines/comps/MasterMedicineDetailModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Pill,
  Building2,
  Package,
  FileText,
  Image as ImageIcon,
  ImageOff,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Star,
  ChevronLeft,
  ChevronRight,
  Upload,
  ExternalLink,
} from "lucide-react";
import { IMAGE_STATUS, getImageStatusInfo } from "../mockMasterMedicineDataV3";

const MasterMedicineDetailModal = ({
  isOpen,
  medicine,
  onClose,
  onViewLinked,
  onUploadImage,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Reset image index when medicine changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [medicine?.id]);

  if (!isOpen || !medicine) return null;

  const activeImages = (medicine.images || []).filter((img) => img.status !== "DEPRECATED");
  const linkedCount = medicine.linkedMedicines?.length || 0;
  const totalOccurrences = (medicine.linkedMedicines || []).reduce(
    (sum, lm) => sum + (lm.occurrenceCount || 0),
    0
  );
  const statusInfo = getImageStatusInfo(medicine.imageStatus);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < activeImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Pill size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold truncate max-w-lg">
                  {medicine.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      medicine.type === "DRUG"
                        ? "bg-blue-400/30 text-blue-100"
                        : "bg-green-400/30 text-green-100"
                    }`}
                  >
                    {medicine.type === "DRUG" ? "Prescription Drug" : "OTC"}
                  </span>
                  {medicine.prescriptionRequired && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-400/30 text-red-100">
                      Rx Required
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Images */}
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="relative bg-gray-100 rounded-xl aspect-square flex items-center justify-center overflow-hidden">
                {activeImages.length > 0 ? (
                  <>
                    {/* Image placeholder - would be actual image */}
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <ImageIcon size={64} className="text-gray-400" />
                    </div>

                    {/* Navigation Arrows */}
                    {activeImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    {/* Image Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold text-white ${
                          activeImages[activeImageIndex]?.status === "VERIFIED"
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }`}
                      >
                        {activeImages[activeImageIndex]?.status}
                      </span>
                    </div>

                    {/* Primary Badge */}
                    {activeImages[activeImageIndex]?.isPrimary && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-blue-500 flex items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          PRIMARY
                        </span>
                      </div>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs">
                        {activeImageIndex + 1} / {activeImages.length}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <ImageOff size={64} className="mb-3" />
                    <p className="text-lg font-medium">No Images</p>
                    <p className="text-sm">Upload images for this medicine</p>
                    <button
                      onClick={() => onUploadImage?.(medicine)}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                                 hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Upload Image
                    </button>
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {activeImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {activeImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === activeImageIndex
                          ? "border-indigo-500 ring-2 ring-indigo-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <ImageIcon size={16} className="text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Image Status */}
              <div className={`rounded-xl p-4 ${statusInfo.bgClass} ${statusInfo.borderClass} border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {medicine.imageStatus === IMAGE_STATUS.VERIFIED ? (
                      <CheckCircle2 size={24} className={statusInfo.textClass} />
                    ) : medicine.imageStatus === IMAGE_STATUS.RAW ? (
                      <AlertTriangle size={24} className={statusInfo.textClass} />
                    ) : (
                      <ImageOff size={24} className={statusInfo.textClass} />
                    )}
                    <div>
                      <p className={`font-semibold ${statusInfo.textClass}`}>
                        {statusInfo.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {medicine.imageStatus === IMAGE_STATUS.VERIFIED
                          ? "Image verified by Cureli team"
                          : medicine.imageStatus === IMAGE_STATUS.RAW
                          ? "Raw image needs replacement"
                          : "No image uploaded yet"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUploadImage?.(medicine)}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium shadow-sm
                               hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload size={14} />
                    {medicine.imageStatus === IMAGE_STATUS.NONE ? "Upload" : "Change"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => linkedCount > 0 && onViewLinked?.(medicine)}
                  disabled={linkedCount === 0}
                  className={`p-4 rounded-xl border transition-all ${
                    linkedCount > 0
                      ? "border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      linkedCount > 0 ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <Link2 size={20} className={linkedCount > 0 ? "text-blue-600" : "text-gray-400"} />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-gray-900">{linkedCount}</p>
                      <p className="text-xs text-gray-500">Linked Medicines</p>
                    </div>
                  </div>
                  {linkedCount > 0 && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      View all <ExternalLink size={10} />
                    </p>
                  )}
                </button>

                <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-gray-900">{totalOccurrences}</p>
                      <p className="text-xs text-gray-500">Total Occurrences</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Pill size={16} />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Name" value={medicine.name} fullWidth />
                  <DetailRow label="Type" value={medicine.type} badge />
                  <DetailRow
                    label="Prescription"
                    value={medicine.prescriptionRequired ? "Required" : "Not Required"}
                  />
                  <DetailRow label="Status" value={medicine.isActive ? "Active" : "Inactive"} />
                </div>
              </div>

              {/* Composition */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Composition
                </h3>
                <p className="text-gray-700">{medicine.composition || "No composition info"}</p>
              </div>

              {/* Manufacturer */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 size={16} />
                  Manufacturer / Marketer
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Manufacturer" value={medicine.manufacturer || "—"} />
                  <DetailRow label="Marketer" value={medicine.marketer || "—"} />
                </div>
              </div>

              {/* Pack Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package size={16} />
                  Pack Information
                </h3>
                <DetailRow label="Pack Size" value={medicine.packSize || "—"} />
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Timestamps
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Created" value={formatDate(medicine.createdAt)} />
                  <DetailRow label="Updated" value={formatDate(medicine.updatedAt)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-mono">{medicine.id}</p>
            <div className="flex items-center gap-3">
              {linkedCount > 0 && (
                <button
                  onClick={() => onViewLinked?.(medicine)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium
                             hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Link2 size={16} />
                  View Linked ({linkedCount})
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium
                           hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Detail Row Component
const DetailRow = ({ label, value, badge = false, fullWidth = false }) => (
  <div className={fullWidth ? "col-span-2" : ""}>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    {badge ? (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === "DRUG" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
        }`}
      >
        {value}
      </span>
    ) : (
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    )}
  </div>
);

export default MasterMedicineDetailModal;