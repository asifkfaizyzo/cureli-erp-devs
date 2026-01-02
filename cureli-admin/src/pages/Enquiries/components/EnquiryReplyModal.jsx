import { X, Send, Loader2, AlertCircle, Mail, FileText, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { replyToEnquiry } from "../../../api/cadminEnquiries";
import { useToast } from "../../../components/common/Toast";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const EnquiryReplyModal = ({ enquiry, isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCounts, setCharCounts] = useState({ subject: 0, message: 0 });

  // Reset form when enquiry changes or modal opens
  useEffect(() => {
    if (isOpen && enquiry) {
      const defaultSubject = `Re: Enquiry ${enquiry.enquiry_number || ""}`;
      setFormData({
        subject: defaultSubject,
        message: "",
      });
      setCharCounts({ subject: defaultSubject.length, message: 0 });
      setErrors({});
    }
  }, [isOpen, enquiry]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = "Subject must be less than 200 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !enquiry?.enquiry_id) return;

    setIsSubmitting(true);

    try {
      const response = await replyToEnquiry(enquiry.enquiry_id, {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      console.log("📤 Reply Response:", response);

      // ✅ Handle nested response structure
      let emailSent = false;

      if (response?.data?.data?.emailSent !== undefined) {
        emailSent = response.data.data.emailSent;
      } else if (response?.data?.emailSent !== undefined) {
        emailSent = response.data.emailSent;
      } else if (response?.emailSent !== undefined) {
        emailSent = response.emailSent;
      }

      // ✅ Show success toast
      if (emailSent) {
        toast.success(
          "Reply Sent Successfully",
          `Your reply has been sent to ${enquiry.email}`
        );
      } else {
        toast.warning(
          "Reply Saved",
          "Reply was saved but email could not be sent."
        );
      }

      // ✅ Reset form
      setFormData({ subject: "", message: "" });
      setCharCounts({ subject: 0, message: 0 });

      // ✅ Call onSuccess immediately - this will close all modals and go back to page
      onSuccess?.();

    } catch (error) {
      console.error("Reply error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send reply. Please try again.";
      toast.error("Reply Failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setCharCounts((prev) => ({ ...prev, [name]: value.length }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const subjectProgress = (charCounts.subject / 200) * 100;
  const messageProgress = (charCounts.message / 5000) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-poppins">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#000060] to-[#0000a0] flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-white">Reply to Enquiry</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-white/60" />
                      <p className="text-sm text-white/70 truncate">
                        {enquiry?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
            >
              {/* Original Message Preview */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Original Message
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-md text-[10px] font-mono">
                    {enquiry?.enquiry_number}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#000060] font-bold text-sm">
                      {enquiry?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{enquiry?.name}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {enquiry?.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject Input */}
              <div>
                <label
                  htmlFor="reply-subject"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reply-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={200}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.subject
                        ? "border-red-300 focus:border-red-500 bg-red-50/50"
                        : "border-gray-200 focus:border-[#000060]"
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#000060]/10 disabled:opacity-50 disabled:bg-gray-50 transition-all`}
                    placeholder="Enter email subject"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        subjectProgress > 90
                          ? "bg-red-500"
                          : subjectProgress > 70
                          ? "bg-amber-500"
                          : "bg-[#000060]"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${subjectProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-1.5">
                  {errors.subject ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.subject}
                    </p>
                  ) : (
                    <span></span>
                  )}
                  <p
                    className={`text-xs font-medium ${
                      charCounts.subject > 180
                        ? "text-red-500"
                        : charCounts.subject > 150
                        ? "text-amber-500"
                        : "text-gray-400"
                    }`}
                  >
                    {charCounts.subject}/200
                  </p>
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label
                  htmlFor="reply-message"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="reply-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={8}
                    maxLength={5000}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.message
                        ? "border-red-300 focus:border-red-500 bg-red-50/50"
                        : "border-gray-200 focus:border-[#000060]"
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#000060]/10 resize-none disabled:opacity-50 disabled:bg-gray-50 transition-all leading-relaxed`}
                    placeholder="Type your professional response here...

Dear [Customer Name],

Thank you for reaching out to us. We appreciate your enquiry...

Best regards,
[Your Name]"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        messageProgress > 90
                          ? "bg-red-500"
                          : messageProgress > 70
                          ? "bg-amber-500"
                          : "bg-[#000060]"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${messageProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-1.5">
                  {errors.message ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.message}
                    </p>
                  ) : (
                    <span></span>
                  )}
                  <p
                    className={`text-xs font-medium ${
                      charCounts.message > 4500
                        ? "text-red-500"
                        : charCounts.message > 4000
                        ? "text-amber-500"
                        : "text-gray-400"
                    }`}
                  >
                    {charCounts.message.toLocaleString()}/5,000
                  </p>
                </div>
              </div>

              {/* Email Notice */}
              <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  This reply will be sent directly to{" "}
                  <span className="font-semibold">{enquiry?.email}</span>. You will be
                  redirected back to the enquiries list after sending.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
              <p className="text-xs text-gray-400">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !formData.subject.trim() ||
                    !formData.message.trim()
                  }
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#000060] to-[#0000a0] rounded-xl hover:shadow-lg hover:shadow-[#000060]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnquiryReplyModal;
