// src/components/Shops/tabs/ShopDocumentsTab.jsx

import { useState, useMemo } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Image,
  File,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Required document types
const REQUIRED_TYPES = [
  "drug_license",
  "pharmacy_registration",
  "business_registration_proof",
  "shop_establishment_license",
  "address_proof",
  "pan_card",
];

// Optional document types
const OPTIONAL_TYPES = ["gst_certificate", "fssai_license"];

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

const ShopDocumentsTab = ({ shop }) => {
  const documents = shop?.shopFiles || [];
  const [previewFile, setPreviewFile] = useState(null);

  // Separate required and optional documents
  const { requiredDocs, optionalDocs } = useMemo(() => {
    const required = [];
    const optional = [];
    
    documents.forEach(doc => {
      if (OPTIONAL_TYPES.includes(doc.file_type)) {
        optional.push(doc);
      } else {
        required.push(doc);
      }
    });
    
    return { requiredDocs: required, optionalDocs: optional };
  }, [documents]);

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

  // Get file icon based on mime type
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("image")) return Image;
    if (mimeType?.includes("pdf")) return FileText;
    return File;
  };

  // Document stats
  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
    pending: documents.filter((d) => d.status === "uploaded").length,
  };

  // Render document card
  const renderDocumentCard = (doc, isOptional = false) => {
    const FileIcon = getFileIcon(doc.mime_type);

    return (
      <div
        key={doc.file_id}
        className={`
          group bg-white rounded-xl border p-4 transition-all hover:shadow-md
          ${
            doc.status === "verified"
              ? "border-l-4 border-l-emerald-500"
              : doc.status === "rejected"
              ? "border-l-4 border-l-red-500"
              : "border-l-4 border-l-yellow-500"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <FileIcon size={18} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-gray-800 truncate">
                  {FILE_TYPE_LABELS[doc.file_type] || doc.file_type}
                </h4>
                {isOptional && (
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

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>Uploaded: {formatDate(doc.uploaded_at)}</span>
          <span>{formatFileSize(doc.file_size)}</span>
        </div>

        {/* Rejection Reason */}
        {doc.status === "rejected" && doc.verification_notes && (
          <div className="mb-3 px-2 py-1.5 bg-red-50 border border-red-100 rounded text-xs text-red-600">
            <strong>Reason:</strong> {doc.verification_notes}
          </div>
        )}

        {/* Verified Date */}
        {doc.status === "verified" && doc.verified_at && (
          <div className="mb-3 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-600">
            Verified on {formatDate(doc.verified_at)}
          </div>
        )}

        {/* Uploader Info */}
        {doc.user && (
          <div className="mb-3 text-xs text-gray-400">
            Uploaded by: {doc.user.full_name}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewFile(doc)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition"
          >
            <Eye size={14} />
            View
          </button>

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
    );
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Documents ({stats.total})
            </h3>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">
                  Verified: <strong className="text-gray-900">{stats.verified}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">
                  Rejected: <strong className="text-gray-900">{stats.rejected}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">
                  Pending: <strong className="text-gray-900">{stats.pending}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        {requiredDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Required Documents</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {requiredDocs.length} / 6
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requiredDocs.map((doc) => renderDocumentCard(doc, false))}
            </div>
          </div>
        )}

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Optional Documents</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {optionalDocs.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optionalDocs.map((doc) => renderDocumentCard(doc, true))}
            </div>
          </div>
        )}
      </div>

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

export default ShopDocumentsTab;