import { X, Mail, Phone, Calendar, MessageSquare, User, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { getEnquiryDetails, updateEnquiryStatus } from "../../../api/cadminEnquiries";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  REPLIED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EnquiryDetailsModal = ({ enquiry, isOpen, onClose, onReply, onStatusChange }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && enquiry) {
      fetchDetails();
    }
  }, [isOpen, enquiry]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const response = await getEnquiryDetails(enquiry.enquiry_id);
      setDetails(response.data.enquiry);
    } catch (error) {
      console.error("Failed to fetch enquiry details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateEnquiryStatus(enquiry.enquiry_id, newStatus);
      setDetails((prev) => ({ ...prev, status: newStatus }));
      onStatusChange?.();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#000060] to-[#1a1a8f]">
          <div>
            <h2 className="text-lg font-semibold text-white">Enquiry Details</h2>
            <p className="text-sm text-white/70">{enquiry?.enquiry_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
          ) : details ? (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#000060]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-gray-900">{details.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#000060]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{details.email}</p>
                  </div>
                </div>

                {details.phone && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#000060]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{details.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#000060]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Submitted On</p>
                    <p className="font-medium text-gray-900">{formatDate(details.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[details.status]}`}>
                    {details.status.replace("_", " ")}
                  </span>
                </div>
                <select
                  value={details.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000060]/20 disabled:opacity-50"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REPLIED">Replied</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-700 whitespace-pre-wrap">{details.message}</p>
                </div>
              </div>

              {/* Reply History */}
              {details.replies?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Reply History ({details.replies.length})
                  </h3>
                  <div className="space-y-3">
                    {details.replies.map((reply) => (
                      <div
                        key={reply.reply_id}
                        className="p-4 bg-green-50 border border-green-100 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{reply.subject}</p>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                          {reply.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>By: {reply.replied_by?.name || "Admin"}</span>
                          {reply.email_sent ? (
                            <span className="text-green-600">✓ Email sent</span>
                          ) : (
                            <span className="text-red-500">✗ Email failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Failed to load details</p>
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
            onClick={() => onReply(details || enquiry)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-[#000050] transition-colors"
          >
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetailsModal;