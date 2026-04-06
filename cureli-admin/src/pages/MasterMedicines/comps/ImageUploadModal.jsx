// cadmin/src/pages/MasterMedicines/comps/ImageUploadModal.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  Plus,
  ImageOff,
} from "lucide-react";
import { IMAGE_STATUS, getImageStatusInfo } from "../mockMasterMedicineDataV3";

const ImageUploadModal = ({ isOpen, medicine, onClose, onImageUploaded }) => {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'url' | 'existing'
  const [images, setImages] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Initialize with existing images
  useEffect(() => {
    if (isOpen && medicine) {
      const existingImages = (medicine.images || []).map((img) => ({
        ...img,
        isNew: false,
        file: null,
      }));
      setImages(existingImages);
      setUrlInput("");
      setError("");
      setActiveTab("upload");
    }
  }, [isOpen, medicine]);

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

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    setError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const newImages = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG, and WebP images are allowed");
        return;
      }

      if (file.size > maxSize) {
        setError("Image size must be less than 5MB");
        return;
      }

      const id = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);

      newImages.push({
        id,
        url,
        file,
        isPrimary: images.length === 0 && newImages.length === 0,
        status: "VERIFIED",
        isNew: true,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "Admin User",
      });
    });

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setError("");
    const id = `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newImage = {
      id,
      url: urlInput.trim(),
      file: null,
      isPrimary: images.length === 0,
      status: "VERIFIED",
      isNew: true,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Admin User",
    };

    setImages((prev) => [...prev, newImage]);
    setUrlInput("");
  };

  const handleSetPrimary = (imageId) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imageId);
      // If removed image was primary, set first remaining as primary
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleDeprecateImage = (imageId) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? { ...img, status: "DEPRECATED", isPrimary: false }
          : img
      )
    );
  };

  const handleSave = async () => {
    const activeImages = images.filter((img) => img.status !== "DEPRECATED");

    if (activeImages.length === 0) {
      setError("Please add at least one image");
      return;
    }

    if (!activeImages.some((img) => img.isPrimary)) {
      setError("Please select a primary image");
      return;
    }

    setIsUploading(true);
    setError("");

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Prepare final images
    const finalImages = images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      status: img.status,
      uploadedAt: img.uploadedAt,
      uploadedBy: img.uploadedBy,
    }));

    // Determine new status
    const hasVerified = finalImages.some((img) => img.status === "VERIFIED");
    const newStatus = hasVerified ? IMAGE_STATUS.VERIFIED : IMAGE_STATUS.NONE;

    onImageUploaded(medicine.id, finalImages, newStatus);
    setIsUploading(false);
    onClose();
  };

  const activeImages = images.filter((img) => img.status !== "DEPRECATED");
  const deprecatedImages = images.filter((img) => img.status === "DEPRECATED");
  const rawImages = images.filter((img) => img.status === "RAW");

  const statusInfo = getImageStatusInfo(medicine.imageStatus);

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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <ImageIcon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">Manage Images</h2>
                <p className="text-white/80 text-sm truncate max-w-md">
                  {medicine.name}
                </p>
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

        {/* Current Status Bar */}
        <div className={`px-6 py-3 ${statusInfo.bgClass} border-b ${statusInfo.borderClass} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
              Current: {statusInfo.label}
            </span>
            <span className="text-sm text-gray-600">
              {activeImages.length} active image(s)
            </span>
          </div>
          {rawImages.length > 0 && (
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <AlertTriangle size={16} />
              {rawImages.length} raw image(s) need replacement
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === "upload"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Upload size={16} />
              Upload Files
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === "url"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LinkIcon size={16} />
              Add URL
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Upload size={28} className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {dragActive ? "Drop images here" : "Drag & drop images"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse. Supports JPG, PNG, WebP (max 5MB each)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                             hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Select Files
                </button>
              </div>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === "url" && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add image from URL</h3>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 h-10 px-4 border border-gray-300 rounded-lg text-sm
                             focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
                />
                <button
                  onClick={handleUrlAdd}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                             hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {activeImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon size={16} />
                Active Images ({activeImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeImages.map((img) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    onSetPrimary={() => handleSetPrimary(img.id)}
                    onRemove={() => handleRemoveImage(img.id)}
                    onDeprecate={img.status === "RAW" ? () => handleDeprecateImage(img.id) : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Deprecated Images */}
          {deprecatedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <ImageOff size={16} />
                Deprecated Images ({deprecatedImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-60">
                {deprecatedImages.map((img) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    isDeprecated
                    onRemove={() => handleRemoveImage(img.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {images.length === 0 && (
            <div className="mt-6 text-center text-gray-500 py-8">
              <ImageOff size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No images yet</p>
              <p className="text-sm">Upload or add images using the options above</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {activeImages.length > 0
                ? `${activeImages.filter((i) => i.isPrimary).length === 1 ? "Primary image selected" : "Select a primary image"}`
                : "Add at least one image"}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading || activeImages.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-green-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Image Card Component
const ImageCard = ({ image, onSetPrimary, onRemove, onDeprecate, isDeprecated = false }) => {
  const statusColors = {
    VERIFIED: "bg-green-500",
    RAW: "bg-amber-500",
    DEPRECATED: "bg-gray-400",
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 ${
        image.isPrimary
          ? "border-green-500 ring-2 ring-green-500/20"
          : "border-gray-200"
      }`}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <ImageIcon size={32} className="text-gray-400" />
        </div>
        {/* Would show actual image: <img src={image.url} alt="" className="w-full h-full object-cover" /> */}
      </div>

      {/* Status Badge */}
      <div className="absolute top-2 left-2">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
            statusColors[image.status]
          }`}
        >
          {image.status}
        </span>
      </div>

      {/* Primary Badge */}
      {image.isPrimary && (
        <div className="absolute top-2 right-2">
          <span className="px-1.5 py-0.5 rounded bg-green-500 text-[10px] font-bold text-white flex items-center gap-1">
            <Star size={10} fill="currentColor" />
            PRIMARY
          </span>
        </div>
      )}

      {/* New Badge */}
      {image.isNew && (
        <div className="absolute bottom-12 left-2">
          <span className="px-1.5 py-0.5 rounded bg-blue-500 text-[10px] font-bold text-white">
            NEW
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          {!isDeprecated && onSetPrimary && !image.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-1.5 rounded-lg bg-white/90 text-gray-700 hover:bg-white transition-colors"
              title="Set as Primary"
            >
              <Star size={14} />
            </button>
          )}
          {isDeprecated && <div />}
          <div className="flex items-center gap-1">
            {onDeprecate && (
              <button
                onClick={onDeprecate}
                className="p-1.5 rounded-lg bg-amber-500/90 text-white hover:bg-amber-600 transition-colors"
                title="Deprecate (keep in history)"
              >
                <AlertTriangle size={14} />
              </button>
            )}
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-colors"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;