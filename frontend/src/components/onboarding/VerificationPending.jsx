// cureli/src/components/VerificationPending.jsx

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AlertCircle, Upload, FileText, Loader2 } from "lucide-react";
import axios from "axios";

const VerificationPending = () => {
  const [loading, setLoading] = useState(true);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [resubmitting, setResubmitting] = useState(null);

  useEffect(() => {
    fetchRejectedFiles();
  }, []);

  const fetchRejectedFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/shop/files/rejected`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const files = response.data?.data?.files || [];
      setRejectedFiles(files);
    } catch (err) {
      console.error("Failed to fetch rejected files:", err);
      setRejectedFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (file) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/*";

    input.onchange = async (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      try {
        setResubmitting(file.file_id);

        const formData = new FormData();
        formData.append("file", selectedFile);

        const token = localStorage.getItem("access_token");

        await axios.post(
          `${import.meta.env.VITE_API_URL}/shop/files/${file.file_id}/resubmit`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        alert("✅ Document resubmitted successfully!");
        await fetchRejectedFiles();
      } catch (err) {
        console.error("Failed to resubmit:", err);
        alert(err.response?.data?.message || "Failed to resubmit document");
      } finally {
        setResubmitting(null);
      }
    };

    input.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full flex justify-center mt-10 px-4 font-poppins">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000066]" />
          <p className="text-gray-500">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // If NO rejected files → Show pending message
  if (rejectedFiles.length === 0) {
    return (
      <div className="w-full flex justify-center mt-10 px-4 font-poppins">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-[650px] max-w-4xl bg-white rounded-2xl shadow-lg p-16 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-br 
            from-transparent via-[#f5faff] to-transparent opacity-60 blur-[90px]"
          />

          <div className="relative z-10 flex justify-center mb-3">
            <img
              src="/assets/loading.gif"
              alt="Verifying"
              className="w-30 h-30"
            />
          </div>

          <h2 className="relative z-10 text-[32px] font-bold text-[#000066] mb-3">
            We're verifying your documents
          </h2>

          <p className="relative z-10 text-gray-500 text-[15px] max-w-xl mx-auto leading-relaxed">
            We have received your documents. It might <br />
            take up to <span className="font-semibold">3–4 business days</span>{" "}
            to complete the verification process.
          </p>
        </motion.div>
      </div>
    );
  }

  // If there ARE rejected files → Show resubmission UI
  return (
    <div className="w-full flex justify-center mt-10 px-4 font-poppins mb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 md:p-12 relative overflow-hidden"
      >
        {/* Background Gradient */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-br 
          from-orange-50 via-red-50 to-transparent opacity-40 blur-[90px]"
        />

        {/* Header */}
        <div className="relative z-10 text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle size={40} className="text-orange-500" />
            </div>
          </div>

          <h2 className="text-[28px] md:text-[32px] font-bold text-[#000066] mb-3">
            Action Required: Document Review
          </h2>

          <p className="text-gray-600 text-[15px] max-w-2xl mx-auto leading-relaxed">
            Some of your documents need to be resubmitted. Please review the
            feedback below and upload the corrected documents.
          </p>
        </div>

        {/* Rejected Documents */}
        <div className="relative z-10 space-y-4">
          {rejectedFiles.map((file, index) => (
            <motion.div
              key={file.file_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 
                rounded-xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Left: Document Info */}
                <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <FileText size={24} className="text-red-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-800 mb-1">
                      {file.file_type?.replace(/_/g, " ").toUpperCase() ||
                        file.original_name}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span>
                        Uploaded:{" "}
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </span>
                      {file.resubmission_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600 font-medium">
                            Resubmitted {file.resubmission_count}x
                          </span>
                        </>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    <div className="bg-white/80 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {file.verification_notes || "No reason provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Resubmit Button */}
                <button
                  onClick={() => handleResubmit(file)}
                  disabled={resubmitting === file.file_id}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#000066] 
                    hover:bg-[#000088] text-white rounded-lg text-sm font-semibold 
                    transition-all shadow-md hover:shadow-lg disabled:opacity-50 
                    disabled:cursor-not-allowed"
                >
                  {resubmitting === file.file_id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Resubmit
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-blue-900 mb-2">
              📋 What happens next?
            </p>
            <ul className="space-y-1 text-gray-600 text-[13px]">
              <li>• Upload the corrected documents using the "Resubmit" button</li>
              <li>• Our team will review them within 2-3 business days</li>
              <li>• You'll receive an email once verification is complete</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerificationPending;
