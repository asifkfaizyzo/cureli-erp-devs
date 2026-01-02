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
  ChevronRight,
  FileText,
  Send,
  History,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getEnquiryDetails,
  updateEnquiryStatus,
} from "../../../api/cadminEnquiries";
import { useToast } from "../../../components/common/Toast";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, x: 50, transition: { duration: 0.2 } },
};

const statusConfig = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
    label: "Pending",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: AlertCircle,
    label: "In Progress",
  },
  REPLIED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: CheckCircle,
    label: "Replied",
  },
  CLOSED: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    icon: XCircle,
    label: "Closed",
  },
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

const formatRelativeTime = (date) => {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

const EnquiryDetailsModal = ({
  enquiry,
  isOpen,
  onClose,
  onReply,
  onStatusChange,
}) => {
  const toast = useToast();
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

      console.log("📋 Enquiry Details Response:", response);

      let enquiryData = null;

      if (response?.data?.data?.enquiry) {
        enquiryData = response.data.data.enquiry;
      } else if (response?.data?.enquiry) {
        enquiryData = response.data.enquiry;
      } else if (response?.enquiry) {
        enquiryData = response.enquiry;
      } else if (response?.data?.data) {
        enquiryData = response.data.data;
      } else if (response?.data) {
        enquiryData = response.data;
      }

      console.log("📋 Parsed Enquiry Details:", enquiryData);

      setDetails(enquiryData);
    } catch (err) {
      console.error("Failed to fetch enquiry details:", err);
      setError("Failed to load enquiry details");
      toast.error("Error", "Failed to load enquiry details");
    } finally {
      setIsLoading(false);
    }
  }, [enquiry?.enquiry_id, toast]);

  useEffect(() => {
    if (isOpen && enquiry?.enquiry_id) {
      fetchDetails();
    } else {
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
      toast.success("Status Updated", `Status changed to ${newStatus.replace("_", " ")}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Error", "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReplyClick = () => {
    onReply(details || enquiry);
  };

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

  const currentStatus = statusConfig[details?.status] || statusConfig.PENDING;
  const StatusIcon = currentStatus.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end font-poppins">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Horizontal Slide-in Modal */}
          <motion.div
            className="relative bg-white w-full max-w-5xl h-full shadow-2xl border-l border-gray-200 flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#000060] to-[#0000a0] flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        Enquiry Details
                      </h2>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white/90">
                        {enquiry?.enquiry_number}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mt-0.5">
                      {details?.name || enquiry?.name || "Loading..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {details && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 shadow-lg ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-semibold text-sm">
                        {currentStatus.label}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Horizontal Layout */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#000060] border-t-transparent animate-spin"></div>
                  </div>
                  <p className="mt-4 text-gray-500 text-sm">Loading details...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={fetchDetails}
                    className="mt-4 px-4 py-2 text-sm font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : details ? (
                <div className="h-full flex">
                  {/* Left Panel - Contact Info & Message */}
                  <div className="w-1/2 border-r border-gray-100 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      {/* Contact Information */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          {/* Name */}
                          <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 hover:border-[#000060]/20 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center group-hover:bg-[#000060]/20 transition-colors flex-shrink-0">
                                <User className="w-5 h-5 text-[#000060]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                  Full Name
                                </p>
                                <p className="font-semibold text-gray-900 truncate">
                                  {details.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 hover:border-[#000060]/20 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center group-hover:bg-[#000060]/20 transition-colors flex-shrink-0">
                                <Mail className="w-5 h-5 text-[#000060]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                  Email Address
                                </p>
                                <a
                                  href={`mailto:${details.email}`}
                                  className="font-semibold text-gray-900 hover:text-[#000060] transition-colors truncate block"
                                >
                                  {details.email}
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Phone */}
                          {details.phone && (
                            <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 hover:border-[#000060]/20 hover:shadow-sm transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center group-hover:bg-[#000060]/20 transition-colors flex-shrink-0">
                                  <Phone className="w-5 h-5 text-[#000060]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                    Phone Number
                                  </p>
                                  <a
                                    href={`tel:${details.phone}`}
                                    className="font-semibold text-gray-900 hover:text-[#000060] transition-colors"
                                  >
                                    {details.phone}
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Date */}
                          <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 hover:border-[#000060]/20 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center group-hover:bg-[#000060]/20 transition-colors flex-shrink-0">
                                <Calendar className="w-5 h-5 text-[#000060]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                  Submitted On
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {formatDate(details.created_at)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatRelativeTime(details.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Management */}
                      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-100">
                        <div className="flex flex-col gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">
                              Status Management
                            </h4>
                            <p className="text-xs text-gray-500">
                              Update the enquiry status to track progress
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={details.status}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              disabled={isUpdatingStatus}
                              className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] disabled:opacity-50 bg-white cursor-pointer"
                            >
                              <option value="PENDING">⏳ Pending</option>
                              <option value="IN_PROGRESS">🔄 In Progress</option>
                              <option value="REPLIED">✅ Replied</option>
                              <option value="CLOSED">🔒 Closed</option>
                            </select>
                            {isUpdatingStatus && (
                              <div className="w-5 h-5 rounded-full border-2 border-[#000060] border-t-transparent animate-spin flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Customer Message
                        </h3>
                        <div className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-100/50">
                          <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                            {details.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Reply History */}
                  <div className="w-1/2 flex flex-col bg-gray-50/50">
                    <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Reply History
                        {details.replies?.length > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                            {details.replies.length}
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      {details.replies?.length > 0 ? (
                        <div className="space-y-4">
                          {details.replies.map((reply, index) => (
                            <motion.div
                              key={reply.reply_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Send className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                      {reply.subject}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      by {reply.replied_by?.name || "Admin"}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md flex-shrink-0">
                                  {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed mb-3 pl-10">
                                {reply.message}
                              </p>
                              <div className="flex items-center gap-2 pl-10">
                                {reply.email_sent ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Email Sent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Email Failed
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center p-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium mb-1">No replies yet</p>
                            <p className="text-sm text-gray-400 mb-4">
                              Send your first response to this enquiry
                            </p>
                            <button
                              onClick={handleReplyClick}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              Send First Reply
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
              <p className="text-xs text-gray-400">
                {details?.enquiry_number && `ID: ${details.enquiry_number}`}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleReplyClick}
                  disabled={isLoading || !!error}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#000060] to-[#0000a0] rounded-xl hover:shadow-lg hover:shadow-[#000060]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Reply
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnquiryDetailsModal;

