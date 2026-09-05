import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  FileText,
  User,
  Truck,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import {
  getRiderDetail,
  reviewDocument,
  approveRider,
  rejectRider,
} from "../../../../api/cadminRiders";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const CDN = import.meta.env.VITE_CDN_DOMAIN;

function getDocUrl(key) {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (CDN) return `https://${CDN}/rider_documents/${key}`;
  return `${BACKEND_URL}/api/files/rider_documents/${key}`;
}

const DOC_GROUP_LABELS = {
  DRIVING_LICENSE_FRONT: "Driving License",
  VEHICLE_RC: "Vehicle RC Document",
  AADHAAR_FRONT: "Aadhaar Card",
  PAN_FRONT: "PAN Card",
  PROFILE_PHOTO: "Live Selfie Photo",
};

const RiderVerificationModal = ({ rider: initialRider, onClose }) => {
  const toast = useToast();
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Preview Image state
  const [previewImage, setPreviewImage] = useState(null);

  // Single doc rejection dialog state
  const [rejectDocTarget, setRejectDocTarget] = useState(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [docActionLoading, setDocActionLoading] = useState(false);

  // Overall application approval & rejection states
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectAppConfirm, setShowRejectAppConfirm] = useState(false);
  const [appRejectReason, setAppRejectReason] = useState("");
  const [overallActionLoading, setOverallActionLoading] = useState(false);

  const fetchFullDetail = async (riderId) => {
    setLoading(true);
    try {
      const resp = await getRiderDetail(riderId);
      setRider(resp.data?.data || resp.data);
    } catch {
      toast.error("Error", "Failed to load full application data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRider?.rider_id) {
      fetchFullDetail(initialRider.rider_id);
    }
  }, [initialRider?.rider_id]);

  // Handle single doc approve
  const handleDocApprove = async (doc) => {
    setDocActionLoading(true);
    try {
      await reviewDocument(rider.rider_id, doc.document_id, "APPROVED");
      toast.success("Document Approved", `${DOC_GROUP_LABELS[doc.type] || doc.type} marked as approved.`);
      await fetchFullDetail(rider.rider_id);
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to approve document.");
    } finally {
      setDocActionLoading(false);
    }
  };

  // Handle single doc reject confirm
  const handleDocRejectConfirm = async () => {
    if (!rejectDocTarget || !docRejectReason.trim()) return;
    setDocActionLoading(true);
    try {
      await reviewDocument(
        rider.rider_id,
        rejectDocTarget.document_id,
        "REJECTED",
        docRejectReason.trim()
      );
      toast.success("Document Rejected", `${DOC_GROUP_LABELS[rejectDocTarget.type] || rejectDocTarget.type} marked as rejected.`);
      setRejectDocTarget(null);
      setDocRejectReason("");
      await fetchFullDetail(rider.rider_id);
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to reject document.");
    } finally {
      setDocActionLoading(false);
    }
  };

  // Handle overall application approval (activates rider)
  const handleApproveApplication = async () => {
    setOverallActionLoading(true);
    try {
      await approveRider(rider.rider_id);
      toast.success("Application Approved", `${rider.full_name}'s account has been verified and activated.`);
      setShowApproveConfirm(false);
      onClose(true);
    } catch (err) {
      toast.error("Approval Failed", err.response?.data?.message || "All documents must be approved before activating.");
    } finally {
      setOverallActionLoading(false);
    }
  };

  // Handle overall application rejection
  const handleRejectApplication = async () => {
    if (!appRejectReason.trim()) return;
    setOverallActionLoading(true);
    try {
      await rejectRider(rider.rider_id, appRejectReason.trim());
      toast.success("Application Rejected", "Rider has been notified to re-upload required items.");
      setShowRejectAppConfirm(false);
      onClose(true);
    } catch (err) {
      toast.error("Rejection Failed", err.response?.data?.message || "Failed to reject application.");
    } finally {
      setOverallActionLoading(false);
    }
  };

  const docs = rider?.documents || [];
  const allDocsApproved = docs.length >= 5 && docs.every((d) => d.status === "APPROVED");
  const anyDocRejected = docs.some((d) => d.status === "REJECTED");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => onClose(false)}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {rider?.full_name
                ? rider.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                : "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-lg font-semibold">
                  {rider?.full_name || "New Applicant"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  {rider?.status === "REJECTED" ? "Needs Re-review" : "Pending Verification"}
                </span>
              </div>
              <p className="text-white/70 text-xs mt-0.5">
                +91 {rider?.phone} • {rider?.email || "No email provided"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onClose(false)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Strip */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-600 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" />
            <span>
              <strong>City:</strong> {rider?.current_city || "—"} ({rider?.residential_address || "No address"})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck size={14} className="text-gray-400" />
            <span>
              <strong>Vehicle:</strong> {rider?.vehicle_type || "—"} ({rider?.vehicle_number || "No plate"})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-gray-400" />
            <span>
              <strong>DOB:</strong> {rider?.date_of_birth ? new Date(rider.date_of_birth).toLocaleDateString("en-IN") : "—"}
            </span>
          </div>
        </div>

        {/* Body — Document Review Queue */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText size={48} className="mx-auto mb-2 opacity-30" />
              <p>No documents uploaded yet by this rider.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {docs.map((doc) => {
                const frontUrl = getDocUrl(doc.storage_key);
                const backUrl = getDocUrl(doc.back_storage_key);

                return (
                  <div
                    key={doc.document_id}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
                      doc.status === "APPROVED"
                        ? "border-emerald-200 bg-emerald-50/20"
                        : doc.status === "REJECTED"
                        ? "border-red-200 bg-red-50/20"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Doc Title + Actions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900">
                            {DOC_GROUP_LABELS[doc.type] || doc.type}
                          </h4>
                          {doc.resubmission_count > 1 && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                              Re-uploaded #{doc.resubmission_count}
                            </span>
                          )}
                        </div>

                        {/* Status Tag */}
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            doc.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : doc.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {doc.status === "APPROVED" && <CheckCircle2 size={12} />}
                          {doc.status === "REJECTED" && <XCircle size={12} />}
                          {doc.status === "PENDING" && <Clock size={12} />}
                          {doc.status}
                        </span>
                      </div>

                      {/* Rejection Note */}
                      {doc.status === "REJECTED" && doc.rejection_reason && (
                        <div className="mb-3 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-md text-xs text-red-700">
                          <strong>Rejection reason:</strong> {doc.rejection_reason}
                        </div>
                      )}

                      {/* Images Preview Grid */}
                      <div className="flex gap-2 mb-3">
                        {frontUrl ? (
                          <div
                            className="relative flex-1 group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                            onClick={() => setPreviewImage(frontUrl)}
                          >
                            <img
                              src={frontUrl}
                              alt="Front preview"
                              className="w-full h-36 object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                              <Eye size={22} className="text-white opacity-0 group-hover:opacity-100" />
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                              Front Side
                            </span>
                          </div>
                        ) : (
                          <div className="flex-1 h-36 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed">
                            No front image
                          </div>
                        )}

                        {backUrl && (
                          <div
                            className="relative flex-1 group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                            onClick={() => setPreviewImage(backUrl)}
                          >
                            <img
                              src={backUrl}
                              alt="Back preview"
                              className="w-full h-36 object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                              <Eye size={22} className="text-white opacity-0 group-hover:opacity-100" />
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                              Back Side
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Single Doc Controls */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setRejectDocTarget(doc);
                          setDocRejectReason("");
                        }}
                        disabled={docActionLoading}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          doc.status === "REJECTED"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                        }`}
                      >
                        {doc.status === "REJECTED" ? "Edit Rejection" : "Reject"}
                      </button>

                      <button
                        onClick={() => handleDocApprove(doc)}
                        disabled={docActionLoading || doc.status === "APPROVED"}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                          doc.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 cursor-default"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        {doc.status === "APPROVED" ? "Approved" : "Approve"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Decision Bar */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {allDocsApproved ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> All documents approved. Ready to activate.
              </span>
            ) : anyDocRejected ? (
              <span className="text-red-700 font-semibold flex items-center gap-1">
                <AlertTriangle size={14} /> Rejections recorded. Reject application to prompt rider.
              </span>
            ) : (
              <span>Please review and approve each document above.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAppRejectReason("");
                setShowRejectAppConfirm(true);
              }}
              disabled={overallActionLoading}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Reject Application
            </button>

            <button
              onClick={() => setShowApproveConfirm(true)}
              disabled={!allDocsApproved || overallActionLoading}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={16} />
              Approve & Activate Rider
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={previewImage}
              alt="Enlarged preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-3 px-4 py-1.5 bg-white/20 text-white rounded-full text-xs font-semibold hover:bg-white/30 transition-colors"
            >
              Click anywhere to close
            </button>
          </div>
        </div>
      )}

      {/* Single Document Rejection Reason Dialog */}
      <ConfirmDialog
        isOpen={!!rejectDocTarget}
        onClose={() => setRejectDocTarget(null)}
        onConfirm={handleDocRejectConfirm}
        title="Reject Document"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Provide a clear reason for rejecting{" "}
              <strong>{DOC_GROUP_LABELS[rejectDocTarget?.type] || rejectDocTarget?.type}</strong>:
            </p>
            <textarea
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              placeholder="e.g. Expired document, photo is blurry, name does not match..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
          </div>
        }
        confirmText="Confirm Rejection"
        cancelText="Cancel"
        type="warning"
        loading={docActionLoading}
      />

      {/* Application Approval Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApproveApplication}
        title="Approve & Activate Rider?"
        message={`This will approve ${rider?.full_name}'s application and change their status to ACTIVE. They will now be allowed to enter bank details and accept deliveries.`}
        confirmText="Approve Application"
        cancelText="Cancel"
        type="success"
        loading={overallActionLoading}
      />

      {/* Application Overall Rejection Dialog */}
      <ConfirmDialog
        isOpen={showRejectAppConfirm}
        onClose={() => setShowRejectAppConfirm(false)}
        onConfirm={handleRejectApplication}
        title="Reject Rider Application"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Enter overall rejection instructions for <strong>{rider?.full_name}</strong>:
            </p>
            <textarea
              value={appRejectReason}
              onChange={(e) => setAppRejectReason(e.target.value)}
              placeholder="e.g. Please re-upload a clear copy of your driving license and Aadhaar card back side."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
          </div>
        }
        confirmText="Reject Application"
        cancelText="Cancel"
        type="warning"
        loading={overallActionLoading}
      />
    </div>
  );
};

export default RiderVerificationModal;