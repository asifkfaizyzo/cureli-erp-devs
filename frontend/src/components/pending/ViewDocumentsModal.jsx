// src/components/pending/ViewDocumentsModal.jsx
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panel = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 28 } },
};

const DocumentThumb = ({ title, src, onOpen }) => (
  <div className="w-[200px] md:w-[240px] flex flex-col gap-2 items-center">
    <div
      onClick={() => onOpen(src)}
      role="button"
      className="w-full h-[140px] md:h-[160px] bg-gray-50 rounded-lg shadow-sm overflow-hidden cursor-pointer border border-gray-200 flex items-center justify-center"
    >
      <img src={src} alt={title} className="object-contain w-full h-full" />
    </div>
    <div className="text-sm text-gray-700 font-medium">{title}</div>
  </div>
);

const ViewDocumentsModal = ({ open, onClose, user, onApprove, onReject }) => {
  const [previewSrc, setPreviewSrc] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  if (!open || !user) return null;

  const docs = user.documents || [];

  const handleReject = () => {
    if (!rejectReason.trim()) {
      if (!confirm("No reason provided. Reject anyway?")) return;
    }
    onReject(rejectReason.trim());
    setRejectReason("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          style={{ backdropFilter: "blur(4px)" }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

          <motion.div
            className="relative bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-auto max-h-[92vh] p-6 z-10"
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="hidden"
            role="dialog"
            aria-modal="true"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>

            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#05015A]">{user.name}</h3>
                <p className="text-sm text-gray-600">Phone: {user.phone}</p>
                <p className="text-sm text-gray-600">Submitted: {user.submittedOn}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Status:{" "}
                  <span className="font-semibold">
                    {user.status}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onApprove}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:brightness-105"
                >
                  Approve
                </button>

                <button
                  onClick={() => {
                    const ok = confirm("Reject this submission?");
                    if (ok) handleReject();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:brightness-95"
                >
                  Reject
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Documents</h4>
                <div className="flex flex-wrap gap-4">
                  {docs.map((d) => (
                    <DocumentThumb key={d.key} title={d.title} src={d.url} onOpen={setPreviewSrc} />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Verification Notes</h4>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="If rejecting, add a reason here..."
                  className="w-full min-h-[140px] border border-gray-200 rounded-lg p-3 text-sm"
                />
                <div className="mt-3 text-sm text-gray-600">
                  You can add notes about documents and the verification decision here.
                </div>
              </div>
            </div>

            {/* preview area */}
            <div className="mt-6">
              {previewSrc ? (
                <div className="w-full h-[380px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                  <img src={previewSrc} alt="preview" className="object-contain w-full h-full" />
                </div>
              ) : (
                <div className="w-full h-[160px] rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
                  Click any document to preview
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewDocumentsModal;
