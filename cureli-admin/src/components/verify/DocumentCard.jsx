// src/components/verify/DocumentCard.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { verifyAdminFile, rejectAdminFile } from "../../api/cadminDocs";
import { FaCheck, FaTimes } from "react-icons/fa";

const DocumentCard = ({ file, onSelect, selected, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      await verifyAdminFile(file.file_id);
      await refresh();
    } catch (err) {
      console.error("approve failed", err);
      alert("Approve failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert("Provide a reason");
      return;
    }
    setLoading(true);
    try {
      await rejectAdminFile(file.file_id, reason);
      setShowReject(false);
      setReason("");
      await refresh();
    } catch (err) {
      console.error("reject failed", err);
      alert("Reject failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`p-3 rounded-2xl border ${selected ? "ring-2 ring-[#000060]" : "border-gray-100"} bg-white flex flex-col justify-between`}
      style={{ minHeight: 180 }}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-800">{file.file_type}</div>
          <div className={`text-xs px-2 py-1 rounded-full ${file.status==="verified" ? "bg-green-50 text-green-700" : file.status==="rejected" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
            {file.status}
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-2">{file.original_name}</div>

        {/* Thumbnail preview — clicking opens raw in new tab */}
        <div className="w-full h-28 bg-gray-50 rounded-md flex items-center justify-center mb-3 overflow-hidden">
          {/* Assuming your storage exposes files at /uploads/shop-files/<storage_key> */}
          <img
            src={`/uploads/shop-files/${file.storage_key}`}
            alt={file.original_name}
            className="max-h-full object-contain"
            onError={(e) => { e.target.src = "/assets/images/success.jpg"; }}
          />
        </div>

        {file.verification_notes && (
          <div className="text-xs text-red-600 mb-2">Admin note: {file.verification_notes}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleApprove(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#000060] text-white hover:bg-[#000060d1]"
          disabled={loading || file.status === "verified"}
        >
          <FaCheck /> Approve
        </button>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowReject((s) => !s); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[#000060] bg-white"
            disabled={loading}
          >
            <FaTimes /> Reject
          </button>

          {showReject && (
            <div className="absolute right-0 mt-2 w-64 bg-white p-3 rounded-lg shadow-lg z-50">
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rejection reason (required)"
                className="w-full border rounded-md p-2 text-sm outline-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowReject(false)} className="px-3 py-1 rounded-md border text-sm">Cancel</button>
                <button onClick={handleReject} className="px-3 py-1 rounded-md bg-red-600 text-white text-sm">Reject</button>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto text-xs text-gray-400">{file.resubmission_count || 0} tries</div>
      </div>
    </motion.div>
  );
};

export default DocumentCard;
