// src/pages/sales/billing/components/SalesHeader.jsx

import { 
  Save, Printer, CheckCircle, Clock, AlertCircle, Loader2,
  Trash2, FilePlus, User
} from "lucide-react";

const SalesHeader = ({ 
  onSave, 
  onConfirmPrint,
  onPrint,
  onClearTable,
  onNewBill,
  invoiceStatus,
  isLoading = false,
  isSaving = false,
  hasUnsavedData = false,
  billedBy = "Staff",
}) => {

  const getStatusConfig = (status) => {
    switch(status) {
      case 'CONFIRMED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: CheckCircle
        };
      case 'DRAFT':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: Clock
        };
      case 'PARKED':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: Clock
        };
      case 'CANCELLED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: AlertCircle
        };
      default:
        return null;
    }
  };

  const statusConfig = invoiceStatus ? getStatusConfig(invoiceStatus) : null;
  const StatusIcon = statusConfig?.icon;
  const isConfirmed = invoiceStatus === 'CONFIRMED';

  const Skeleton = ({ className }) => (
    <div className={`bg-slate-200 rounded animate-pulse ${className}`} />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-48 h-3" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="w-20 h-9 rounded-lg" />
          <Skeleton className="w-20 h-9 rounded-lg" />
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <Skeleton className="w-24 h-9 rounded-lg" />
          <Skeleton className="w-32 h-9 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
      
      {/* Left: Title & Info */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-[#05015A] to-[#0a0280] rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#05015A] font-bold text-lg">Sales Billing</h1>

            {/* Status */}
            {invoiceStatus && statusConfig && (
              <div className={`flex items-center gap-1 px-2 py-1 ${statusConfig.bg} border ${statusConfig.border} rounded-lg`}>
                <StatusIcon size={12} className={statusConfig.text} />
                <span className={`text-[10px] font-medium ${statusConfig.text} uppercase`}>
                  {invoiceStatus}
                </span>
              </div>
            )}

            {/* Unsaved */}
            {hasUnsavedData && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-amber-700 font-medium">Unsaved</span>
              </div>
            )}

            {/* Billed By */}
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg">
              <User size={10} className="text-purple-600" />
              <span className="text-[10px] text-purple-600 font-medium">By:</span>
              <span className="text-[10px] font-semibold text-purple-800">{billedBy}</span>
            </div>
          </div>
          
          <p className="text-slate-500 text-xs mt-0.5">
            Create sales invoice
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        
        <button
          onClick={onNewBill}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-colors text-sm font-medium border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start a new bill"
        >
          <FilePlus size={14} />
          <span className="hidden lg:inline">New</span>
        </button>

        <button
          onClick={onClearTable}
          disabled={isSaving || !hasUnsavedData}
          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors text-sm font-medium border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear all items"
        >
          <Trash2 size={14} />
          <span className="hidden lg:inline">Clear</span>
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        {/* Save Draft */}
        <button
          onClick={onSave}
          disabled={isConfirmed || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm
            ${isConfirmed || isSaving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#05015A] hover:bg-[#0a0280] text-white'
            }`}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>

        {/* Print Only (for confirmed) */}
        {isConfirmed && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border bg-indigo-50 text-[#05015A] hover:bg-indigo-100 border-indigo-200"
          >
            <Printer size={14} />
            Print
          </button>
        )}

        {/* Confirm & Print */}
        {!isConfirmed && (
          <button
            onClick={onConfirmPrint}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border
              ${isSaving
                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-indigo-50 text-[#05015A] hover:bg-indigo-100 border-indigo-200'
              }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            {isSaving ? 'Processing...' : 'Confirm & Print'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SalesHeader;
