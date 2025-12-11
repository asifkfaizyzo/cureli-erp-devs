// src/components/Shops/tabs/ShopDocumentsTab.jsx

import { useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import ConfirmDialog from "../../common/ConfirmDialog";
import { verifyShopFile, rejectShopFile } from "../../../api/cadminShops";

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

const ShopDocumentsTab = ({ shop, onRefresh }) => {
  const documents = shop?.shopFiles || [];
  
  // Rejection dialog state
  const [rejectingFile, setRejectingFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  // Handle verify
  const handleVerify = async (fileId) => {
    setActionLoading(true);
    try {
      await verifyShopFile(fileId);
      onRefresh?.();
    } catch (err) {
      console.error("Verify failed:", err);
      alert(err.response?.data?.message || "Failed to verify document");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject confirm
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
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="flex items-center gap-6 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-600">
              Verified: <strong className="text-gray-900">{documents.filter(d => d.status === "verified").length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">
              Rejected: <strong className="text-gray-900">{documents.filter(d => d.status === "rejected").length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">
              Pending: <strong className="text-gray-900">{documents.filter(d => d.status === "pending" || d.status === "pending_review").length}</strong>
            </span>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Total: <strong className="text-gray-900">{documents.length}</strong> documents
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.file_id}
              className={`
                group bg-white rounded-xl border p-4 hover:shadow-md transition-all
                ${doc.status === "verified" ? "border-l-4 border-l-emerald-500" : 
                  doc.status === "rejected" ? "border-l-4 border-l-red-500" : 
                  "border-l-4 border-l-yellow-500"}
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-gray-800 truncate">
                      {FILE_TYPE_LABELS[doc.file_type] || doc.file_type}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">{doc.original_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {doc.resubmission_count > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 text-[10px]">
                      <RefreshCw size={10} />
                      {doc.resubmission_count}
                    </span>
                  )}
                  {getStatusBadge(doc.status)}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
                <span>{formatDate(doc.uploaded_at)}</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>

              {/* Rejection Reason */}
              {doc.status === "rejected" && doc.verification_notes && (
                <div className="mb-3 px-2 py-1.5 bg-red-50 border border-red-100 rounded text-[10px] text-red-600">
                  <strong>Reason:</strong> {doc.verification_notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {/* Pending actions */}
                {(doc.status === "pending" || doc.status === "pending_review") && (
                  <>
                    <button
                      onClick={() => handleVerify(doc.file_id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-[10px] font-semibold rounded hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <CheckCircle size={12} />
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingFile(doc)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-semibold rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </>
                )}

                {/* View button */}
                <button
                  onClick={() => setPreviewFile(doc)}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded hover:bg-indigo-100 transition ml-auto"
                >
                  <Eye size={12} />
                  View
                </button>

                {/* Download */}
                {doc.storage_key && (
                  <button
                    onClick={() => window.open(getFileUrl(doc.storage_key), "_blank")}
                    className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <Download size={14} />
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
        title="Reject Document?"
        message={
          <div className="space-y-3">
            <p className="text-gray-600">
              Please provide a reason for rejection. This will be shown to the shop owner.
            </p>
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
        type="warning"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(getFileUrl(previewFile.storage_key), "_blank")}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-white hover:bg-red-500/50 rounded-lg"
                >
                  <XCircle size={18} />
                </button>
              </div>
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
                    className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm"
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

export default ShopDocumentsTab;