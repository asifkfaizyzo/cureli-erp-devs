// frontend/src/pages/purchase/invoice/components/PurchaseTable.jsx

import React from "react";
import { 
  Eye, 
  Pencil, 
  Trash2, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Shield,
  AlertTriangle,
} from "lucide-react";
import TableSkeleton from "../../../../components/common/TableSkeleton";

const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || 'DRAFT';
  
  const badges = {
    DRAFT: { bg: 'bg-[#000060]/10', text: 'text-[#000060]', border: 'border-[#000060]/30', icon: Clock },
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: CheckCircle2 },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: XCircle },
  };

  const config = badges[normalizedStatus] || badges.DRAFT;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={10} />
      {normalizedStatus}
    </span>
  );
};

const PaymentStatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || 'UNPAID';
  
  const badges = {
    UNPAID: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  };

  const config = badges[normalizedStatus] || badges.UNPAID;
  const displayText = normalizedStatus.replace('_', ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {displayText}
    </span>
  );
};

const PurchaseTable = ({
  invoices = [],
  onRowClick,
  onView,
  onEdit,
  onDelete,
  children,
  rowsPerPage = 6,
  currentPage = 1,
  isLoading = false,
  isSuperAdmin = false, // ✅ NEW PROP
}) => {
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const startIndex = (currentPage - 1) * rowsPerPage;

  const cellClass = "text-xs py-3 px-4 border-b border-gray-100 group-hover:border-[#000060]/20 transition";
  const headerClass = "px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 sticky top-0 z-10 whitespace-nowrap";
  
  const emptyRowsCount = Math.max(0, rowsPerPage - safeInvoices.length);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ✅ UPDATED: Helper function to check if invoice is editable
  const isEditable = (invoice) => {
    const status = invoice?.status?.toUpperCase();
    // Draft is always editable
    if (status === 'DRAFT') return true;
    // Confirmed is editable only for super_admin
    if (status === 'CONFIRMED' && isSuperAdmin) return true;
    // Everything else is not editable
    return false;
  };

  // ✅ Helper function to check if invoice is deletable
  const isDeletable = (invoice) => {
    const status = invoice?.status?.toUpperCase();
    return status !== 'CONFIRMED';
  };

  // ✅ NEW: Get edit button styling based on status and permissions
  const getEditButtonConfig = (invoice) => {
    const status = invoice?.status?.toUpperCase();
    const canEdit = isEditable(invoice);
    
    if (!canEdit) {
      return {
        className: 'text-gray-200 cursor-not-allowed',
        icon: Pencil,
        title: `Cannot edit - Status: ${status}`,
      };
    }
    
    if (status === 'CONFIRMED') {
      return {
        className: 'hover:bg-amber-50 hover:text-amber-600 text-amber-500 cursor-pointer',
        icon: Shield,
        title: 'Edit as Super Admin (Stock will be adjusted)',
      };
    }
    
    return {
      className: 'hover:bg-amber-50 hover:text-amber-600 text-gray-400 cursor-pointer',
      icon: Pencil,
      title: 'Edit Invoice',
    };
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex-1 relative overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={headerClass}>#</th>
              <th className={headerClass}>
                <div className="flex items-center gap-1.5">
                  <FileText size={12} />
                  Invoice Number
                </div>
              </th>
              <th className={headerClass}>
                <div className="flex items-center gap-1.5">
                  <Package size={12} />
                  Supplier
                </div>
              </th>
              <th className={headerClass}>Invoice Date</th>
              <th className={headerClass}>Items</th>
              <th className={headerClass}>Net Amount</th>
              <th className={headerClass}>Payment</th>
              <th className={headerClass}>Status</th>
              <th className={`${headerClass} text-center`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={9} />
            ) : safeInvoices.length > 0 ? (
              <>
                {safeInvoices.map((invoice, i) => {
                  const serialNumber = startIndex + i + 1;
                  const canEdit = isEditable(invoice);
                  const canDelete = isDeletable(invoice);
                  const status = invoice?.status?.toUpperCase();
                  const editConfig = getEditButtonConfig(invoice);
                  const EditIcon = editConfig.icon;

                  return (
                    <tr 
                      key={invoice.invoice_id} 
                      onClick={() => onRowClick?.(invoice)}
                      className="hover:bg-[#000060]/5 group cursor-pointer transition-colors"
                    >
                      {/* Serial Number */}
                      <td className={`${cellClass} text-gray-400 font-medium`}>
                        {String(serialNumber).padStart(2, "0")}
                      </td>

                      {/* Invoice Number */}
                      <td className={cellClass}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#000060] font-semibold">
                            {invoice.invoice_number}
                          </span>
                          {/* ✅ Show super admin edit indicator for confirmed invoices */}
                          {status === 'CONFIRMED' && isSuperAdmin && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-medium">
                              <Shield size={8} />
                              Editable
                            </span>
                          )}
                        </div>
                        {invoice.supplier_invoice_no && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Ref: {invoice.supplier_invoice_no}
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className={cellClass}>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700">
                            {invoice.supplier?.name || '-'}
                          </span>
                          {invoice.supplier?.gst_number && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              GST: {invoice.supplier.gst_number}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Invoice Date */}
                      <td className={`${cellClass} text-gray-600`}>
                        {formatDate(invoice.invoice_date)}
                      </td>

                      {/* Items Count */}
                      <td className={`${cellClass} text-center`}>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#000060]/10 text-[#000060] text-[10px] font-bold">
                          {invoice._count?.lineItems || invoice.lineItems?.length || 0}
                        </span>
                      </td>

                      {/* Net Amount */}
                      <td className={`${cellClass} text-right`}>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(invoice.net_amount)}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Taxable: {formatCurrency(invoice.taxable_amount)}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className={cellClass}>
                        <PaymentStatusBadge status={invoice.payment_status} />
                        {invoice.payment_status?.toUpperCase() !== 'PAID' && parseFloat(invoice.balance_amount) > 0 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Due: {formatCurrency(invoice.balance_amount)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className={cellClass}>
                        <StatusBadge status={invoice.status} />
                        {invoice.confirmed_at && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {formatDate(invoice.confirmed_at)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={`${cellClass} text-center`}>
                        <div className="flex justify-center gap-1">
                          {/* VIEW */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onView?.(invoice, e);
                            }}
                            className="p-1.5 rounded hover:bg-[#000060]/10 hover:text-[#000060] text-gray-400 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* ✅ UPDATED: EDIT - Shows Shield for confirmed + super_admin */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canEdit) {
                                onEdit?.(invoice, e);
                              }
                            }}
                            disabled={!canEdit}
                            className={`p-1.5 rounded transition-colors ${editConfig.className}`}
                            title={editConfig.title}
                          >
                            <EditIcon size={14} />
                          </button>

                          {/* DELETE */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canDelete) {
                                onDelete?.(invoice, e);
                              }
                            }}
                            disabled={!canDelete}
                            className={`p-1.5 rounded transition-colors ${
                              canDelete
                                ? 'hover:bg-red-50 hover:text-red-600 text-gray-400 cursor-pointer'
                                : 'text-gray-200 cursor-not-allowed'
                            }`}
                            title={canDelete ? "Delete Invoice" : "Confirmed invoices cannot be deleted"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty Rows for Consistent Height */}
                {emptyRowsCount > 0 &&
                  Array.from({ length: emptyRowsCount }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-14">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className={`${cellClass} border-transparent`}>
                          &nbsp;
                        </td>
                      ))}
                    </tr>
                  ))}
              </>
            ) : (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#000060]/5 flex items-center justify-center">
                      <Package size={24} className="text-[#000060]/40" />
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">No purchase invoices found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new purchase</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-gray-200 bg-gray-50/50">
        {children}
      </div>
    </div>
  );
};

export default PurchaseTable;