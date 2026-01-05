// src/components/Shops/tabs/ShopEditDocumentsTab.jsx

import { useState, useRef, useMemo } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Image,
  File,
  Plus,
} from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { verifyShopFile, rejectShopFile, uploadShopDocument } from "../../../../api/cadminShops";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ✅ 6 REQUIRED document types
const REQUIRED_DOCUMENT_TYPES = [
  { key: "drug_license", label: "Drug License" },
  { key: "pharmacy_registration", label: "Pharmacy Registration" },
  { key: "business_registration_proof", label: "Business Registration" },
  { key: "shop_establishment_license", label: "Shop Establishment" },
  { key: "address_proof", label: "Address Proof" },
  { key: "pan_card", label: "PAN Card" },
];

// ✅ 2 OPTIONAL document types
const OPTIONAL_DOCUMENT_TYPES = [
  { key: "gst_certificate", label: "GST Certificate" },
  { key: "fssai_license", label: "FSSAI License" },
];

// All document types combined
const ALL_DOCUMENT_TYPES = [...REQUIRED_DOCUMENT_TYPES, ...OPTIONAL_DOCUMENT_TYPES];

const FILE_TYPE_LABELS = {
  drug_license: "Drug License",
  pharmacy_registration: "Pharmacy Registration",
  gst_certificate: "GST Certificate",
  business_registration_proof: "Business Registration",
  shop_establishment_license: "Shop Establishment",
  address_proof: "Address Proof",
  pan_card: "PAN Card",
  fssai_license: "FSSAI License",
};

const ShopEditDocumentsTab = ({ shop, onRefresh, onValidationChange }) => {
  const documents = shop?.shopFiles || [];

  // File input refs for each document type
  const fileInputRefs = useRef({});

  // Rejection dialog state
  const [rejectingFile, setRejectingFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Upload state - tracks which file type is currently uploading
  const [uploadingFileType, setUploadingFileType] = useState(null);

  // Preview modal
  const [previewFile, setPreviewFile] = useState(null);

  // Build a map of existing documents by file_type
  const documentsByType = useMemo(() => {
    const map = {};
    documents.forEach((doc) => {
      map[doc.file_type] = doc;
    });
    return map;
  }, [documents]);

  // ✅ Calculate missing REQUIRED documents only
  const missingRequiredTypes = useMemo(() => {
    return REQUIRED_DOCUMENT_TYPES.filter((type) => !documentsByType[type.key]);
  }, [documentsByType]);

  // ✅ Calculate missing OPTIONAL documents
  const missingOptionalTypes = useMemo(() => {
    return OPTIONAL_DOCUMENT_TYPES.filter((type) => !documentsByType[type.key]);
  }, [documentsByType]);

  // ✅ Check if all REQUIRED documents are present
  const allRequiredPresent = missingRequiredTypes.length === 0;

  // Notify parent about validation status
  useMemo(() => {
    onValidationChange?.(allRequiredPresent);
  }, [allRequiredPresent, onValidationChange]);

  // Stats
  const stats = useMemo(() => ({
    requiredTotal: REQUIRED_DOCUMENT_TYPES.length,
    requiredUploaded: REQUIRED_DOCUMENT_TYPES.length - missingRequiredTypes.length,
    requiredMissing: missingRequiredTypes.length,
    optionalTotal: OPTIONAL_DOCUMENT_TYPES.length,
    optionalUploaded: OPTIONAL_DOCUMENT_TYPES.length - missingOptionalTypes.length,
    verified: documents.filter((d) => d.status === "verified").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
    pending: documents.filter((d) => d.status === "uploaded").length,
  }), [documents, missingRequiredTypes, missingOptionalTypes]);

  // Helper functions
  const getFileUrl = (storageKey) => {
    if (!storageKey) return null;
    if (storageKey.startsWith("http")) return storageKey;
    return `${BACKEND_URL}/uploads/shop_files/${storageKey}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("image")) return Image;
    if (mimeType?.includes("pdf")) return FileText;
    return File;
  };

  // Status badge
  const getStatusBadge = (status) => {
    const config = {
      verified: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        icon: CheckCircle,
        label: "Verified",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: XCircle,
        label: "Rejected",
      },
      uploaded: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: Clock,
        label: "Pending Review",
      },
    };
    const style = config[status] || config.uploaded;
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        <Icon size={10} />
        {style.label}
      </span>
    );
  };

  // Handle file upload (new or replace)
  const handleFileSelect = async (fileType, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload JPG, PNG, WebP or PDF.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    setUploadingFileType(fileType);
    try {
      await uploadShopDocument(shop.shop_id, fileType, file);
      onRefresh?.();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingFileType(null);
      // Reset file input
      if (fileInputRefs.current[fileType]) {
        fileInputRefs.current[fileType].value = "";
      }
    }
  };

  // Trigger file input click
  const triggerFileInput = (fileType) => {
    fileInputRefs.current[fileType]?.click();
  };

  // Handle reject (for verified documents)
  const handleRejectConfirm = async () => {
    if (!rejectingFile || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      await rejectShopFile(rejectingFile.file_id, rejectionReason.trim());
      setRejectingFile(null);
      setRejectionReason("");
      onRefresh?.();
    } catch (err) {
      console.error("Reject failed:", err);
      alert(err.response?.data?.message || "Failed to reject document");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Render document card (reusable for both required and optional)
  const renderDocumentCard = (docType, isRequired = true) => {
    const doc = documentsByType[docType.key];
    const isUploading = uploadingFileType === docType.key;
    const FileIcon = doc ? getFileIcon(doc.mime_type) : FileText;

    return (
      <div
        key={docType.key}
        className={`
          group bg-white rounded-xl border p-4 transition-all
          ${doc
            ? doc.status === "verified"
              ? "border-l-4 border-l-emerald-500"
              : doc.status === "rejected"
              ? "border-l-4 border-l-red-500"
              : "border-l-4 border-l-yellow-500"
            : isRequired
            ? "border-l-4 border-l-gray-300 border-dashed bg-red-50/30"
            : "border-l-4 border-l-gray-200 border-dashed bg-gray-50/50"
          }
        `}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={(el) => (fileInputRefs.current[docType.key] = el)}
          onChange={(e) => handleFileSelect(docType.key, e)}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
        />

        {doc ? (
          /* ═══════════════════════════════════════════
             EXISTING DOCUMENT
          ═══════════════════════════════════════════ */
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileIcon size={18} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">
                      {docType.label}
                    </h4>
                    {!isRequired && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate" title={doc.original_name}>
                    {doc.original_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {doc.resubmission_count > 0 && (
                  <span
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 text-xs"
                    title={`Resubmitted ${doc.resubmission_count} time(s)`}
                  >
                    <RefreshCw size={10} />
                    {doc.resubmission_count}
                  </span>
                )}
                {getStatusBadge(doc.status)}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
              <span>{formatDate(doc.uploaded_at)}</span>
              <span>{formatFileSize(doc.file_size)}</span>
            </div>

            {/* Rejection Reason */}
            {doc.status === "rejected" && doc.verification_notes && (
              <div className="mb-3 px-2 py-1.5 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                <strong>Reason:</strong> {doc.verification_notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Replace Button */}
              <button
                onClick={() => triggerFileInput(docType.key)}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Replace
                  </>
                )}
              </button>

              {/* Reject Button (only for verified documents) */}
              {doc.status === "verified" && (
                <button
                  onClick={() => setRejectingFile(doc)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              )}

              {/* View Button */}
              <button
                onClick={() => setPreviewFile(doc)}
                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="View"
              >
                <Eye size={16} />
              </button>

              {/* Download Button */}
              {doc.storage_key && (
                <button
                  onClick={() => window.open(getFileUrl(doc.storage_key), "_blank")}
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                  title="Download"
                >
                  <Download size={16} />
                </button>
              )}
            </div>
          </>
        ) : (
          /* ═══════════════════════════════════════════
             MISSING DOCUMENT - Upload Placeholder
          ═══════════════════════════════════════════ */
          <div className="flex flex-col items-center justify-center py-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isRequired ? "bg-red-100" : "bg-gray-100"
            }`}>
              <FileText size={24} className={isRequired ? "text-red-300" : "text-gray-300"} />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-gray-600">
                {docType.label}
              </h4>
              {!isRequired && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                  Optional
                </span>
              )}
            </div>

            <p className={`text-xs mb-3 flex items-center gap-1 ${
              isRequired ? "text-red-500" : "text-gray-400"
            }`}>
              {isRequired ? (
                <>
                  <XCircle size={12} />
                  Required - Not uploaded
                </>
              ) : (
                <>
                  <Clock size={12} />
                  Not uploaded
                </>
              )}
            </p>

            <button
              onClick={() => triggerFileInput(docType.key)}
              disabled={isUploading}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                isRequired
                  ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Upload Document
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* ═══════════════════════════════════════════
            VALIDATION STATUS
        ═══════════════════════════════════════════ */}
        
        {/* Warning - Missing Required Documents */}
        {!allRequiredPresent && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 mb-1">
                Missing Required Documents ({stats.requiredMissing} of {stats.requiredTotal})
              </p>
              <p className="text-sm text-red-600 mb-2">
                All 6 required documents must be uploaded before saving.
              </p>
              <div className="flex flex-wrap gap-2">
                {missingRequiredTypes.map((type) => (
                  <span
                    key={type.key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                  >
                    <XCircle size={12} />
                    {type.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Success - All Required Documents Present */}
        {allRequiredPresent && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">All Required Documents Uploaded</p>
              <p className="text-sm text-emerald-600">
                All {stats.requiredTotal} required documents are present. You can now save changes.
              </p>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Document Management
            </h3>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">
                  Verified: <strong className="text-gray-900">{stats.verified}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">
                  Pending: <strong className="text-gray-900">{stats.pending}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-600">
                  Rejected: <strong className="text-gray-900">{stats.rejected}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            REQUIRED DOCUMENTS SECTION
        ═══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Required Documents
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              allRequiredPresent 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-red-100 text-red-700"
            }`}>
              {stats.requiredUploaded} / {stats.requiredTotal}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REQUIRED_DOCUMENT_TYPES.map((docType) => renderDocumentCard(docType, true))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            OPTIONAL DOCUMENTS SECTION
        ═══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Optional Documents
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {stats.optionalUploaded} / {stats.optionalTotal}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPTIONAL_DOCUMENT_TYPES.map((docType) => renderDocumentCard(docType, false))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
          <AlertTriangle size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Document Management Instructions</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li><strong>6 required documents</strong> must be uploaded before saving</li>
              <li><strong>2 optional documents</strong> (GST Certificate, FSSAI License) can be added later</li>
              <li>You can <strong>replace</strong> any existing document with a new file</li>
              <li>You can <strong>reject</strong> verified documents (requires reason)</li>
              <li>Accepted formats: PDF, JPG, PNG, WebP (max 5MB)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      <ConfirmDialog
        isOpen={!!rejectingFile}
        onClose={() => {
          setRejectingFile(null);
          setRejectionReason("");
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Verified Document?"
        message={
          <div className="space-y-3">
            <p className="text-gray-600">
              You are rejecting a <strong>verified</strong> document. This action will:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
              <li>Mark this document as rejected</li>
              <li>Change shop verification status</li>
              <li>Require the shop owner to re-upload this document</li>
            </ul>
            <p className="text-gray-600 mt-3">Please provide a reason for rejection:</p>
            <textarea
              className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
          </div>
        }
        confirmText="Reject Document"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading}
        confirmDisabled={!rejectionReason.trim()}
      />

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#05015A]">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-white" />
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {FILE_TYPE_LABELS[previewFile.file_type] || previewFile.file_type}
                  </h3>
                  <p className="text-white/60 text-xs">{previewFile.original_name}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-white hover:bg-red-500/50 rounded-lg"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 h-[calc(100%-56px)] bg-gray-900 flex items-center justify-center">
              {previewFile.mime_type?.includes("image") ? (
                <img
                  src={getFileUrl(previewFile.storage_key)}
                  alt={previewFile.original_name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : previewFile.mime_type?.includes("pdf") ? (
                <iframe
                  src={`${getFileUrl(previewFile.storage_key)}#toolbar=1`}
                  className="w-full h-full border-0"
                  title={previewFile.original_name}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Preview not available</p>
                  <button
                    onClick={() => window.open(getFileUrl(previewFile.storage_key), "_blank")}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopEditDocumentsTab;