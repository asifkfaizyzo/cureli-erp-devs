// frontend/src/pages/tickets/components/ViewTicketModal.jsx

import { X, Download, Calendar, Phone, User, Building2, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import {
  STATUS_COLORS,
  CATEGORY_COLORS,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
} from "../../../constant/tickets";

const ViewTicketModal = ({ isOpen, onClose, ticket, onCancelClick, onRefresh }) => {
  if (!isOpen || !ticket) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");
    } catch {
      return "-";
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.OPEN;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
                    ${colors.bg} ${colors.text} border ${colors.border}`}
      >
        {TICKET_STATUSES[status] || status}
      </span>
    );
  };

  const CategoryBadge = ({ category, otherText }) => {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;
    const label =
      category === "OTHER" && otherText
        ? otherText
        : TICKET_CATEGORIES[category] || category;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
                    ${colors.bg} ${colors.text} border ${colors.border}`}
      >
        {label}
      </span>
    );
  };

  const canCancel = ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {ticket.ticket_number}
              </h2>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-sm text-gray-500">
              Created {formatDate(ticket.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Subject & Category */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {ticket.subject}
                </h3>
                <CategoryBadge
                  category={ticket.category}
                  otherText={ticket.other_category_text}
                />
              </div>
              {ticket.description && (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Number */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact Number</p>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.contact_number}
                  </p>
                </div>
              </div>

              {/* Preferred Time Slot */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preferred Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.preferred_slot}
                  </p>
                </div>
              </div>

              {/* Branch */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.branch_name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Created By */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.created_by_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Attachments ({ticket.attachments.length})
                </h4>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.attachment_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg 
                                 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.original_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        className="ml-3 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {ticket.status === "CANCELLED" && ticket.cancellation_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Ticket Cancelled
                    </p>
                    <p className="text-sm text-red-700 mb-2">
                      {ticket.cancellation_reason}
                    </p>
                    <p className="text-xs text-red-600">
                      By {ticket.cancelled_by_name || "Unknown"} •{" "}
                      {formatDate(ticket.cancelled_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reopen Info */}
            {ticket.reopen_count > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Note:</span> This ticket has been
                  reopened {ticket.reopen_count} time(s)
                </p>
                {ticket.reopened_at && (
                  <p className="text-xs text-blue-700 mt-1">
                    Last reopened {formatDate(ticket.reopened_at)} by{" "}
                    {ticket.reopened_by_name || "Unknown"}
                  </p>
                )}
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-3">
                {/* Created */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Ticket created</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.created_at)}
                    </p>
                  </div>
                </div>

                {/* Updated */}
                {ticket.updated_at !== ticket.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Last updated</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(ticket.updated_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancelled */}
                {ticket.cancelled_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Ticket cancelled</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(ticket.cancelled_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reopened */}
                {ticket.reopened_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Ticket reopened</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(ticket.reopened_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg 
                       hover:bg-gray-50 transition-all"
          >
            Close
          </button>
          {canCancel && (
            <button
              onClick={() => {
                onClose();
                onCancelClick(ticket);
              }}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg 
                         hover:bg-red-700 transition-all"
            >
              Cancel Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTicketModal;
