// src/components/Shops/tabs/ShopEditDocumentsTab.jsx

import { useState, useRef } from "react";
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
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../../common/ConfirmDialog";
import { verifyShopFile, rejectShopFile, uploadShopDocument } from "../../../api/cadminShops";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

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

const ShopEditDocumentsTab = ({ shop, onRefresh }) => {
  const documents = shop?.shopFiles || [];
  
  // File input refs for each document type
  const fileInputRefs = useRef({});
  
  // Rejection dialog state
  const [rejectingFile, setRejectingFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Upload state
  const [uploadingFileType, setUploadingFileType] = useState(null);
  
  // Preview modal
  const [previewFile, setPreviewFile] = useState(null);

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

  // Status badge
  const getStatusBadge = (status) => {
    const config = {
      verified: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle, label: "Verified" },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Rejected" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "Pending" },
      pending_review: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock, label: "Pending Review" },
    };
    const style = config[status] || config.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon size={10} />
        {style.label}
      </span>
    );
  };

  // Handle file upload (replace document)
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

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No documents uploaded</p>
        <p className="text-sm text-gray-400 mt-1">Documents can only be uploaded by the shop owner</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
          <AlertTriangle size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Document Management</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>You can <strong>replace</strong> any existing document with a new file</li>
              <li>You can <strong>reject</strong> verified documents (requires reason)</li>
              <li>Rejecting documents may change shop verification status</li>
              <li>You cannot add new document types beyond the existing ones</li>
            </ul>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.file_id}
              className={`
                group bg-white rounded-xl border p-4 transition-all
                ${doc.status === "verified" ? "border-l-4 border-l-emerald-500" : 
                  doc.status === "rejected" ? "border-l-4 border-l-red-500" : 
                  "border-l-4 border-l-yellow-500"}
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">
                      {FILE_TYPE_LABELS[doc.file_type] || doc.file_type}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">{doc.original_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {doc.resubmission_count > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 text-xs">
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
                {/* Replace Document Button */}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[doc.file_type] = el)}
                    onChange={(e) => handleFileSelect(doc.file_type, e)}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefs.current[doc.file_type]?.click()}
                    disabled={uploadingFileType === doc.file_type}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
                  >
                    {uploadingFileType === doc.file_type ? (
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
                </div>

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
            </div>
          ))}
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
              <li>Potentially change shop verification status to "Partially Rejected"</li>
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