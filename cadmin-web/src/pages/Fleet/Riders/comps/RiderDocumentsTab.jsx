import { useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, Loader2, FileText } from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import { reviewDocument } from "../../../../api/cadminRiders";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const CDN = import.meta.env.VITE_CDN_DOMAIN;

function getDocUrl(key) {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (CDN) return `https://${CDN}/rider_documents/${key}`;
  return `${BACKEND_URL}/api/files/rider_documents/${key}`;
}

const DOC_LABELS = {
  DRIVING_LICENSE_FRONT: "Driving License",
  VEHICLE_RC: "Vehicle RC",
  AADHAAR_FRONT: "Aadhaar Card",
  PAN_FRONT: "PAN Card",
  PROFILE_PHOTO: "Live Photo",
};

const RiderDocumentsTab = ({ rider, onRefresh }) => {
  const toast = useToast();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const docs = rider?.documents || [];

  const handleApprove = async (doc) => {
    setActionLoading(true);
    try {
      await reviewDocument(rider.rider_id, doc.document_id, "APPROVED");
      toast.success("Approved", `${DOC_LABELS[doc.type] || doc.type} approved.`);
      onRefresh?.();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await reviewDocument(rider.rider_id, rejectTarget.document_id, "REJECTED", rejectReason.trim());
      toast.success("Rejected", `${DOC_LABELS[rejectTarget.type] || rejectTarget.type} rejected.`);
      setRejectTarget(null);
      setRejectReason("");
      onRefresh?.();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
        <FileText size={48} className="mx-auto mb-3 opacity-30" />
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => {
          const url = getDocUrl(doc.storage_key);
          const backUrl = getDocUrl(doc.back_storage_key);
          const isImage = true; // rider docs are images

          return (
            <div key={doc.document_id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{DOC_LABELS[doc.type] || doc.type}</h4>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1 px-2 py-0.5 rounded-full
                    ${doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : doc.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {doc.status === "APPROVED" && <CheckCircle size={10} />}
                    {doc.status === "REJECTED" && <XCircle size={10} />}
                    {doc.status === "PENDING" && <Clock size={10} />}
                    {doc.status}
                  </span>
                </div>
                {doc.status !== "APPROVED" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApprove(doc)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectTarget(doc); setRejectReason(""); }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {doc.rejection_reason && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  <strong>Reason:</strong> {doc.rejection_reason}
                </div>
              )}

              {/* Image previews */}
              <div className="flex gap-2">
                {url && (
                  <div className="relative flex-1 group cursor-pointer" onClick={() => setPreviewUrl(url)}>
                    <img src={url} alt="front" className="w-full h-32 object-cover rounded-lg border" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all">
                      <Eye size={20} className="text-white opacity-0 group-hover:opacity-100" />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Front</span>
                  </div>
                )}
                {backUrl && (
                  <div className="relative flex-1 group cursor-pointer" onClick={() => setPreviewUrl(backUrl)}>
                    <img src={backUrl} alt="back" className="w-full h-32 object-cover rounded-lg border" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all">
                      <Eye size={20} className="text-white opacity-0 group-hover:opacity-100" />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Back</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}

      {/* Reject Confirm */}
      <ConfirmDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        title="Reject Document?"
        message={
          <div>
            <p>Reject <strong>{DOC_LABELS[rejectTarget?.type] || rejectTarget?.type}</strong>?</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason (required)..."
              rows={2}
              className="w-full mt-3 px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-300"
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
        loading={actionLoading}
      />
    </>
  );
};

export default RiderDocumentsTab;