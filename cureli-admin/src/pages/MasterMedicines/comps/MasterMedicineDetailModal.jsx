import { useState, useEffect, useMemo } from "react";
import {
  X,
  Pill,
  Building2,
  Package,
  FileText,
  Image as ImageIcon,
  Link2,
  Edit,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ImageOff,
  Eye,
  Calendar,
  DollarSign,
  Hash,
  Store,
} from "lucide-react";
import { IMAGE_STATUS, getImageStatusInfo, getImageUrl } from "../../../api/cadminMasterMedicines";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "variants", label: "Variants", icon: Package },
  { id: "linked", label: "Linked Medicines", icon: Link2 },
  { id: "images", label: "Images", icon: ImageIcon },
];

const MasterMedicineDetailModal = ({
  isOpen,
  medicine,
  linkedData = [],
  onClose,
  onUploadImage,
  onViewVariantLinked,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedVariant, setExpandedVariant] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setExpandedVariant(null);
    }
  }, [isOpen]);

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

  if (!isOpen || !medicine) return null;

  const statusInfo = getImageStatusInfo(medicine.imageStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Pill size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl font-bold mb-1">
                  {medicine.genericName || medicine.name}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white/80 text-sm font-mono">
                    {medicine.masterKey}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      medicine.type === "DRUG"
                        ? "bg-blue-400/30 text-white"
                        : "bg-green-400/30 text-white"
                    }`}
                  >
                    {medicine.type}
                  </span>
                  {medicine.form && (
                    <span className="text-white/80 text-sm">{medicine.form}</span>
                  )}
                  {medicine.prescriptionRequired && (
                    <span className="px-2 py-0.5 bg-red-400/30 text-white text-xs font-medium rounded">
                      Rx Required
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(medicine)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(medicine)}
                  className="p-2 rounded-lg bg-red-500/60 text-white hover:bg-red-500/90 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-6 flex-shrink-0 overflow-x-auto">
          <StatCard
            icon={Package}
            label="Variants"
            value={medicine.variantCount || 0}
            color="indigo"
          />
          {medicine.priceRange && (
            <StatCard
              icon={DollarSign}
              label="Price Range"
              value={`₹${medicine.priceRange.min} - ₹${medicine.priceRange.max}`}
              color="green"
            />
          )}
          <StatCard
            icon={Link2}
            label="Linked"
            value={linkedData.length}
            color="blue"
          />
          <StatCard
            icon={ImageIcon}
            label="Image Status"
            value={statusInfo.label}
            color={statusInfo.color}
          />
          {medicine.primaryCategory && (
            <StatCard
              icon={FileText}
              label="Category"
              value={medicine.primaryCategory}
              color="purple"
            />
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              let count = 0;
              if (tab.id === "variants") count = medicine.variantCount || 0;
              if (tab.id === "linked") count = linkedData.length;
              if (tab.id === "images") count = medicine.images?.length || 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2
                    transition-all duration-200 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && (
            <OverviewTab medicine={medicine} />
          )}
          {activeTab === "variants" && (
            <VariantsTab
              variants={medicine.variants || []}
              expandedVariant={expandedVariant}
              setExpandedVariant={setExpandedVariant}
              onViewVariantLinked={onViewVariantLinked}
            />
          )}
          {activeTab === "linked" && (
            <LinkedTab linkedData={linkedData} />
          )}
          {activeTab === "images" && (
            <ImagesTab
              images={medicine.images || []}
              onUploadImage={() => onUploadImage(medicine)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Created: {new Date(medicine.createdAt).toLocaleDateString("en-IN")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Updated: {new Date(medicine.updatedAt).toLocaleDateString("en-IN")}
              </span>
            </div>
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
  );
};

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

const OverviewTab = ({ medicine }) => {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Pill size={16} />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Generic Name" value={medicine.genericName} />
          <InfoField label="Master Key" value={medicine.masterKey} mono />
          <InfoField label="Type" value={medicine.type} />
          <InfoField label="Form" value={medicine.form} />
          <InfoField
            label="Prescription Required"
            value={medicine.prescriptionRequired ? "Yes" : "No"}
          />
          <InfoField label="Primary Category" value={medicine.primaryCategory} />
        </div>
      </div>

      {/* Composition */}
      {medicine.composition && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} />
            Composition
          </h3>
          <div className="text-sm text-gray-700">
            {Array.isArray(medicine.composition) ? (
              <div className="space-y-2">
                {medicine.composition.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{comp.name || comp}</span>
                    {comp.strength && (
                      <span className="text-gray-500">({comp.strength})</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">{medicine.composition}</p>
            )}
          </div>
        </div>
      )}

      {/* Aggregated Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brands */}
        {medicine.brands && medicine.brands.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Brands ({medicine.brands.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {medicine.brands.map((brand, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Manufacturers */}
        {medicine.manufacturers && medicine.manufacturers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Manufacturers ({medicine.manufacturers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {medicine.manufacturers.map((mfr, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                >
                  {mfr}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {medicine.strengths && medicine.strengths.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Hash size={16} />
              Available Strengths ({medicine.strengths.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {medicine.strengths.map((strength, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Marketers */}
        {medicine.marketers && medicine.marketers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Marketers ({medicine.marketers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {medicine.marketers.map((marketer, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium"
                >
                  {marketer}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VARIANTS TAB
// ═══════════════════════════════════════════════════════════════

const VariantsTab = ({ variants, expandedVariant, setExpandedVariant, onViewVariantLinked }) => {
  if (!variants || variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Package size={48} className="mb-3 opacity-50" />
        <p className="text-lg font-medium">No Variants</p>
        <p className="text-sm">This medicine has no variants yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variants.map((variant) => {
        const isExpanded = expandedVariant === variant.id;

        return (
          <div
            key={variant.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Variant Header */}
            <button
              onClick={() => setExpandedVariant(isExpanded ? null : variant.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {variant.images && variant.images.length > 0 ? (
                    <img
                      src={getImageUrl(variant.images[0])}
                      alt={variant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900">{variant.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="font-mono text-xs">{variant.skuId}</span>
                    {variant.brand && <span>{variant.brand}</span>}
                    {variant.strength && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {variant.strength.display}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                {variant.pricing?.mrp && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">MRP</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{variant.pricing.mrp.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Expand Icon */}
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="SKU ID" value={variant.skuId} mono small />
                  <InfoField label="Brand" value={variant.brand} small />
                  <InfoField label="Pack Size" value={variant.packSize} small />
                  <InfoField label="Manufacturer" value={variant.manufacturer} small />
                  <InfoField label="Marketer" value={variant.marketer} small />
                  {variant.pricing?.sellingPrice && (
                    <InfoField
                      label="Selling Price"
                      value={`₹${variant.pricing.sellingPrice.toFixed(2)}`}
                      small
                    />
                  )}
                  {variant.pricing?.discountPercent && (
                    <InfoField
                      label="Discount"
                      value={`${variant.pricing.discountPercent}%`}
                      small
                    />
                  )}
                </div>

                {/* Composition */}
                {variant.composition && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Composition</h5>
                    <div className="text-sm text-gray-700">
                      {Array.isArray(variant.composition) ? (
                        <div className="flex flex-wrap gap-2">
                          {variant.composition.map((comp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                            >
                              {comp.name || comp}
                              {comp.strength && ` (${comp.strength})`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700">{variant.composition}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {variant.description && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Description</h5>
                    <p className="text-sm text-gray-700">{variant.description}</p>
                  </div>
                )}

                {/* Images */}
                {variant.images && variant.images.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">
                      Images ({variant.images.length})
                    </h5>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {variant.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200"
                        >
                          <img
                            src={getImageUrl(img)}
                            alt={`${variant.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => onViewVariantLinked(variant)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                               hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye size={14} />
                    View Linked Shop Medicines
                  </button>
                  <button
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium
                               hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Edit Variant
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Created: {new Date(variant.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Updated: {new Date(variant.updatedAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LINKED TAB
// ═══════════════════════════════════════════════════════════════

const LinkedTab = ({ linkedData }) => {
  if (!linkedData || linkedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Link2 size={48} className="mb-3 opacity-50" />
        <p className="text-lg font-medium">No Linked Medicines</p>
        <p className="text-sm">This medicine has no shop medicines linked to it</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {linkedData.map((linked) => (
        <div
          key={linked.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Store size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{linked.originalName}</h4>
              <p className="text-sm text-gray-500 font-mono mt-0.5">
                {linked.normalizedName}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-600">{linked.shopName}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {linked.occurrenceCount} occurrence(s)
                </span>
                {linked.manufacturer && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{linked.manufacturer}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    linked.linkedBy === "System"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Linked by {linked.linkedBy}
                </span>
                {linked.confidence && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {linked.confidence}% confidence
                  </span>
                )}
                {linked.linkedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(linked.linkedAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            </div>
            <button
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              title="View Shop Details"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// IMAGES TAB
// ═══════════════════════════════════════════════════════════════

const ImagesTab = ({ images, onUploadImage }) => {
  const primaryImages = images.filter((img) => img.type === "PRIMARY");
  const galleryImages = images.filter((img) => img.type === "GALLERY");

  const renderImageGrid = (imgs, title) => {
    if (imgs.length === 0) return null;

    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {imgs.map((img) => {
            const statusInfo = img.source === "UPLOADED"
              ? { bgClass: "bg-green-100", textClass: "text-green-700", label: "Verified" }
              : { bgClass: "bg-amber-100", textClass: "text-amber-700", label: "Raw" };

            return (
              <div
                key={img.id}
                className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 relative group"
              >
                <img
                  src={getImageUrl(img.url)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ display: "none" }}
                >
                  <ImageOff size={32} className="text-gray-400" />
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusInfo.bgClass} ${statusInfo.textClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Uploaded By */}
                {img.uploadedBy && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] text-white bg-black/60 rounded px-1.5 py-0.5 truncate">
                      By {img.uploadedBy}
                    </p>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => window.open(getImageUrl(img.url), "_blank")}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title="View Full Size"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {images.length > 0
            ? `${images.length} image(s) in total`
            : "No images available"}
        </p>
        <button
          onClick={onUploadImage}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                     hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Upload size={16} />
          Manage Images
        </button>
      </div>

      {/* Image Grids */}
      {renderImageGrid(primaryImages, "Primary Images")}
      {renderImageGrid(galleryImages, "Gallery Images")}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <ImageOff size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium">No Images</p>
          <p className="text-sm mb-4">This medicine has no images yet</p>
          <button
            onClick={onUploadImage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Images
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const InfoField = ({ label, value, mono = false, small = false }) => {
  return (
    <div>
      <label className={`${small ? "text-xs" : "text-sm"} text-gray-500 font-medium block mb-1`}>
        {label}
      </label>
      <p className={`${small ? "text-sm" : "text-base"} text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
};

export default MasterMedicineDetailModal;