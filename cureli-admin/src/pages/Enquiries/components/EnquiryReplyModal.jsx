import { X, Send, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { replyToEnquiry } from "../../../api/cadminEnquiries";

const EnquiryReplyModal = ({ enquiry, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Reset form when enquiry changes or modal opens
  useEffect(() => {
    if (isOpen && enquiry) {
      setFormData({
        subject: `Re: Enquiry ${enquiry.enquiry_number || ""}`,
        message: "",
      });
      setErrors({});
      setSubmitResult(null);
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
    setSubmitResult(null);

    try {
      const response = await replyToEnquiry(enquiry.enquiry_id, {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      const emailSent = response.data?.emailSent;
      
      setSubmitResult({
        type: emailSent ? "success" : "warning",
        message: emailSent 
          ? "Reply sent successfully!" 
          : response.message || "Reply saved but email could not be sent.",
      });

      // Reset form and close after delay
      setTimeout(() => {
        setFormData({ subject: "", message: "" });
        setSubmitResult(null);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Reply error:", error);
      setSubmitResult({
        type: "error",
        message: error.response?.data?.message || "Failed to send reply. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    
    // Clear submit result on new input
    if (submitResult) {
      setSubmitResult(null);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Reply to Enquiry</h2>
            <p className="text-sm text-gray-500 truncate">
              Sending to: <span className="font-medium">{enquiry?.email}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Result Message */}
          {submitResult && (
            <div
              className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                submitResult.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : submitResult.type === "warning"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitResult.message}</span>
            </div>
          )}

          {/* Original Message Preview */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">
                Original message from <span className="font-medium">{enquiry?.name}</span>:
              </p>
              <span className="text-xs text-gray-400 font-mono">
                {enquiry?.enquiry_number}
              </span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
              {enquiry?.message}
            </p>
          </div>

          {/* Subject */}
          <div>
            <label 
              htmlFor="reply-subject"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="reply-subject"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              disabled={isSubmitting}
              maxLength={200}
              className={`w-full px-4 py-2.5 border ${
                errors.subject ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-[#000060]"
              } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 disabled:opacity-50 disabled:bg-gray-50 transition-colors`}
              placeholder="Enter email subject"
            />
            <div className="flex justify-between mt-1">
              {errors.subject ? (
                <p className="text-red-500 text-xs">{errors.subject}</p>
              ) : (
                <span></span>
              )}
              <p className="text-xs text-gray-400">
                {formData.subject.length}/200
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <label 
              htmlFor="reply-message"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reply-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={6}
              maxLength={5000}
              className={`w-full px-4 py-2.5 border ${
                errors.message ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-[#000060]"
              } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 resize-none disabled:opacity-50 disabled:bg-gray-50 transition-colors`}
              placeholder="Type your reply message here..."
            />
            <div className="flex justify-between mt-1">
              {errors.message ? (
                <p className="text-red-500 text-xs">{errors.message}</p>
              ) : (
                <span></span>
              )}
              <p className="text-xs text-gray-400">
                {formData.message.length}/5000
              </p>
            </div>
          </div>

          {/* Email Notice */}
          <p className="text-xs text-gray-400">
            This reply will be sent to the customer's email address. Make sure your response is professional and helpful.
          </p>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-[#000050] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};

export default EnquiryReplyModal;

// import { X, Send, Loader2 } from "lucide-react";
// import { useState } from "react";
// import { replyToEnquiry } from "../../../api/cadminEnquiries";

// const EnquiryReplyModal = ({ enquiry, isOpen, onClose, onSuccess }) => {
//   const [formData, setFormData] = useState({
//     subject: `Re: Enquiry ${enquiry?.enquiry_number || ""}`,
//     message: "",
//   });
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitResult, setSubmitResult] = useState(null);

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.subject.trim()) {
//       newErrors.subject = "Subject is required";
//     }
//     if (!formData.message.trim()) {
//       newErrors.message = "Message is required";
//     } else if (formData.message.trim().length < 10) {
//       newErrors.message = "Message must be at least 10 characters";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setIsSubmitting(true);
//     setSubmitResult(null);

//     try {
//       const response = await replyToEnquiry(enquiry.enquiry_id, formData);
      
//       setSubmitResult({
//         type: response.data.emailSent ? "success" : "warning",
//         message: response.message,
//       });

//       // Reset form and close after delay
//       setTimeout(() => {
//         setFormData({ subject: "", message: "" });
//         onSuccess?.();
//         onClose();
//       }, 2000);
//     } catch (error) {
//       setSubmitResult({
//         type: "error",
//         message: error.response?.data?.message || "Failed to send reply",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
//         {/* Header */}
//         <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold text-gray-900">Reply to Enquiry</h2>
//             <p className="text-sm text-gray-500">
//               Sending to: {enquiry?.email}
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             disabled={isSubmitting}
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {/* Result Message */}
//           {submitResult && (
//             <div
//               className={`p-3 rounded-lg text-sm ${
//                 submitResult.type === "success"
//                   ? "bg-green-50 text-green-700 border border-green-200"
//                   : submitResult.type === "warning"
//                   ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
//                   : "bg-red-50 text-red-700 border border-red-200"
//               }`}
//             >
//               {submitResult.message}
//             </div>
//           )}

//           {/* Original Message Preview */}
//           <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
//             <p className="text-xs text-gray-500 mb-1">Original message from {enquiry?.name}:</p>
//             <p className="text-sm text-gray-700 line-clamp-3">{enquiry?.message}</p>
//           </div>

//           {/* Subject */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Subject <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               name="subject"
//               value={formData.subject}
//               onChange={handleChange}
//               disabled={isSubmitting}
//               className={`w-full px-4 py-2.5 border ${
//                 errors.subject ? "border-red-300" : "border-gray-200"
//               } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] disabled:opacity-50`}
//               placeholder="Enter email subject"
//             />
//             {errors.subject && (
//               <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
//             )}
//           </div>

//           {/* Message */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Message <span className="text-red-500">*</span>
//             </label>
//             <textarea
//               name="message"
//               value={formData.message}
//               onChange={handleChange}
//               disabled={isSubmitting}
//               rows={6}
//               className={`w-full px-4 py-2.5 border ${
//                 errors.message ? "border-red-300" : "border-gray-200"
//               } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] resize-none disabled:opacity-50`}
//               placeholder="Type your reply message here..."
//             />
//             {errors.message && (
//               <p className="text-red-500 text-xs mt-1">{errors.message}</p>
//             )}
//           </div>
//         </form>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl">
//           <button
//             type="button"
//             onClick={onClose}
//             disabled={isSubmitting}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={isSubmitting}
//             className="px-4 py-2 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-[#000050] transition-colors disabled:opacity-50 flex items-center gap-2"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Sending...
//               </>
//             ) : (
//               <>
//                 <Send className="w-4 h-4" />
//                 Send Reply
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EnquiryReplyModal;