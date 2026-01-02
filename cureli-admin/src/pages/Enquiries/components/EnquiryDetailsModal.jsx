import {
  X,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  getEnquiryDetails,
  updateEnquiryStatus,
} from "../../../api/cadminEnquiries";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  REPLIED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EnquiryDetailsModal = ({
  enquiry,
  isOpen,
  onClose,
  onReply,
  onStatusChange,
}) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!enquiry?.enquiry_id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await getEnquiryDetails(enquiry.enquiry_id);
      setDetails(response.data.enquiry);
    } catch (err) {
      console.error("Failed to fetch enquiry details:", err);
      setError("Failed to load enquiry details");
    } finally {
      setIsLoading(false);
    }
  }, [enquiry?.enquiry_id]);

  useEffect(() => {
    if (isOpen && enquiry?.enquiry_id) {
      fetchDetails();
    } else {
      // Reset state when modal closes
      setDetails(null);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, enquiry?.enquiry_id, fetchDetails]);

  const handleStatusChange = async (newStatus) => {
    if (!details || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await updateEnquiryStatus(enquiry.enquiry_id, newStatus);
      setDetails((prev) => ({ ...prev, status: newStatus }));
      onStatusChange?.();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReplyClick = () => {
    onReply(details || enquiry);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#000060] to-[#1a1a8f]">
          <div>
            <h2 className="text-lg font-semibold text-white">Enquiry Details</h2>
            <p className="text-sm text-white/70">{enquiry?.enquiry_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000060]"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              <XCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
              <p>{error}</p>
              <button
                onClick={fetchDetails}
                className="mt-3 px-4 py-2 text-sm text-[#000060] hover:bg-[#000060]/5 rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#000060]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-gray-900 break-words">
                      {details.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#000060]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <a 
                      href={`mailto:${details.email}`}
                      className="font-medium text-gray-900 break-all hover:text-[#000060] transition-colors"
                    >
                      {details.email}
                    </a>
                  </div>
                </div>

                {details.phone && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#000060]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <a 
                        href={`tel:${details.phone}`}
                        className="font-medium text-gray-900 hover:text-[#000060] transition-colors"
                      >
                        {details.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#000060]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Submitted On</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(details.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      statusColors[details.status] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {details.status?.replace("_", " ") || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="status-select" className="text-sm text-gray-500">
                    Change:
                  </label>
                  <select
                    id="status-select"
                    value={details.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000060]/20 disabled:opacity-50 bg-white cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REPLIED">Replied</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  {isUpdatingStatus && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#000060]"></div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                    {details.message}
                  </p>
                </div>
              </div>

              {/* Reply History */}
              {details.replies?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Reply History ({details.replies.length})
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {details.replies.map((reply) => (
                      <div
                        key={reply.reply_id}
                        className="p-4 bg-green-50 border border-green-100 rounded-xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <p className="font-medium text-gray-900">
                            {reply.subject}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3 break-words leading-relaxed">
                          {reply.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 pt-2 border-t border-green-100">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {reply.replied_by?.name || "Admin"}
                          </span>
                          <span className="text-green-200">•</span>
                          {reply.email_sent ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Email sent
                              {reply.email_sent_at && (
                                <span className="text-gray-400 ml-1">
                                  at {formatDate(reply.email_sent_at)}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Email failed
                              {reply.email_error && (
                                <span 
                                  className="text-gray-400 ml-1 truncate max-w-[150px]"
                                  title={reply.email_error}
                                >
                                  - {reply.email_error}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Replies Message */}
              {(!details.replies || details.replies.length === 0) && (
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No replies yet</p>
                  <button
                    onClick={handleReplyClick}
                    className="mt-2 text-sm text-[#000060] hover:underline"
                  >
                    Send first reply
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleReplyClick}
            disabled={isLoading || !!error}
            className="px-4 py-2 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-[#000050] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetailsModal;


// import { X, Mail, Phone, Calendar, MessageSquare, User, Clock } from "lucide-react";
// import { useState, useEffect } from "react";
// import { getEnquiryDetails, updateEnquiryStatus } from "../../../api/cadminEnquiries";

// const statusColors = {
//   PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
//   IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
//   REPLIED: "bg-green-100 text-green-800 border-green-200",
//   CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
// };

// const formatDate = (date) => {
//   return new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const EnquiryDetailsModal = ({ enquiry, isOpen, onClose, onReply, onStatusChange }) => {
//   const [details, setDetails] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

//   useEffect(() => {
//     if (isOpen && enquiry) {
//       fetchDetails();
//     }
//   }, [isOpen, enquiry]);

//   const fetchDetails = async () => {
//     setIsLoading(true);
//     try {
//       const response = await getEnquiryDetails(enquiry.enquiry_id);
//       setDetails(response.data.enquiry);
//     } catch (error) {
//       console.error("Failed to fetch enquiry details:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleStatusChange = async (newStatus) => {
//     setIsUpdatingStatus(true);
//     try {
//       await updateEnquiryStatus(enquiry.enquiry_id, newStatus);
//       setDetails((prev) => ({ ...prev, status: newStatus }));
//       onStatusChange?.();
//     } catch (error) {
//       console.error("Failed to update status:", error);
//     } finally {
//       setIsUpdatingStatus(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
//         {/* Header */}
//         <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#000060] to-[#1a1a8f]">
//           <div>
//             <h2 className="text-lg font-semibold text-white">Enquiry Details</h2>
//             <p className="text-sm text-white/70">{enquiry?.enquiry_number}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
//           {isLoading ? (
//             <div className="flex items-center justify-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000060]"></div>
//             </div>
//           ) : details ? (
//             <div className="space-y-6">
//               {/* Contact Info */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
//                   <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
//                     <User className="w-5 h-5 text-[#000060]" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500 mb-1">Name</p>
//                     <p className="font-medium text-gray-900">{details.name}</p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
//                   <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
//                     <Mail className="w-5 h-5 text-[#000060]" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500 mb-1">Email</p>
//                     <p className="font-medium text-gray-900">{details.email}</p>
//                   </div>
//                 </div>

//                 {details.phone && (
//                   <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
//                     <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
//                       <Phone className="w-5 h-5 text-[#000060]" />
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500 mb-1">Phone</p>
//                       <p className="font-medium text-gray-900">{details.phone}</p>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
//                   <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
//                     <Calendar className="w-5 h-5 text-[#000060]" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500 mb-1">Submitted On</p>
//                     <p className="font-medium text-gray-900">{formatDate(details.created_at)}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Status */}
//               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                 <div className="flex items-center gap-3">
//                   <span className="text-sm text-gray-600">Status:</span>
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[details.status]}`}>
//                     {details.status.replace("_", " ")}
//                   </span>
//                 </div>
//                 <select
//                   value={details.status}
//                   onChange={(e) => handleStatusChange(e.target.value)}
//                   disabled={isUpdatingStatus}
//                   className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000060]/20 disabled:opacity-50"
//                 >
//                   <option value="PENDING">Pending</option>
//                   <option value="IN_PROGRESS">In Progress</option>
//                   <option value="REPLIED">Replied</option>
//                   <option value="CLOSED">Closed</option>
//                 </select>
//               </div>

//               {/* Message */}
//               <div>
//                 <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                   <MessageSquare className="w-4 h-4" />
//                   Message
//                 </h3>
//                 <div className="p-4 bg-gray-50 rounded-xl">
//                   <p className="text-gray-700 whitespace-pre-wrap">{details.message}</p>
//                 </div>
//               </div>

//               {/* Reply History */}
//               {details.replies?.length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                     <Clock className="w-4 h-4" />
//                     Reply History ({details.replies.length})
//                   </h3>
//                   <div className="space-y-3">
//                     {details.replies.map((reply) => (
//                       <div
//                         key={reply.reply_id}
//                         className="p-4 bg-green-50 border border-green-100 rounded-xl"
//                       >
//                         <div className="flex items-center justify-between mb-2">
//                           <p className="font-medium text-gray-900">{reply.subject}</p>
//                           <span className="text-xs text-gray-500">
//                             {formatDate(reply.created_at)}
//                           </span>
//                         </div>
//                         <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
//                           {reply.message}
//                         </p>
//                         <div className="flex items-center gap-2 text-xs text-gray-500">
//                           <span>By: {reply.replied_by?.name || "Admin"}</span>
//                           {reply.email_sent ? (
//                             <span className="text-green-600">✓ Email sent</span>
//                           ) : (
//                             <span className="text-red-500">✗ Email failed</span>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <p className="text-center text-gray-500 py-8">Failed to load details</p>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             Close
//           </button>
//           <button
//             onClick={() => onReply(details || enquiry)}
//             className="px-4 py-2 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-[#000050] transition-colors"
//           >
//             Send Reply
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EnquiryDetailsModal;