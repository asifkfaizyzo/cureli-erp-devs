// pharmacy-web/src/pages/marketplace-orders/components/OrderDetailPanel.jsx
// Updated:
//   - Accept button now labelled "Bill & Accept" and fires onBillAndAccept
//   - Added "Download Invoice" button for READY_FOR_PICKUP and COMPLETED
//   - Everything else unchanged

import { useState, useCallback } from 'react';
import {
  X, Loader2, User, Users, Phone, MapPin, Package, FileText,
  Clock, CheckCircle, XCircle, AlertCircle, ExternalLink,
  ShoppingBag, Download,
} from 'lucide-react';

const STATUS_LABELS = {
  PLACED:           'Placed',
  ACCEPTED:         'Accepted',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED:        'Completed',
  REJECTED:         'Rejected',
  CANCELLED:        'Cancelled',
};

const SEX_LABEL = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-white/40" />
      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</span>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-white/35 flex-shrink-0">{label}</span>
    <span className="text-xs text-white/70 text-right">{value || '—'}</span>
  </div>
);

function PatientSection({ patient }) {
  if (!patient || (!patient.name && patient.age === null && !patient.sex)) return null;
  const sexLabel = patient.sex ? (SEX_LABEL[patient.sex] ?? patient.sex) : null;
  const meta = [sexLabel, patient.age !== null ? `${patient.age} yrs` : null].filter(Boolean).join(' · ');
  return (
    <SectionCard title="Ordering For" icon={Users}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
          <User size={15} className="text-white/40" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">{patient.name}</span>
            {patient.is_self && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/[0.08] text-white/40 border border-white/[0.08] uppercase tracking-wide flex-shrink-0">Self</span>
            )}
          </div>
          {meta ? <p className="text-xs text-white/40 mt-0.5">{meta}</p> : null}
        </div>
      </div>
    </SectionCard>
  );
}

const OrderDetailPanel = ({
  orderId,
  orderDetail,
  isLoading,
  error,
  actionLoading,
  actionError,
  onClose,
  onBillAndAccept,        // ← RENAMED from onAccept
  onOpenReject,
  onMarkReady,
  onComplete,
  onGetPrescriptionUrl,
  onGetInvoiceUrl,        // ← NEW
}) => {
  const [loadingPrescriptionId, setLoadingPrescriptionId] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const handleOpenPrescription = useCallback(async (prescriptionId) => {
    setLoadingPrescriptionId(prescriptionId);
    try {
      const url = await onGetPrescriptionUrl(orderId, prescriptionId);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingPrescriptionId(null);
    }
  }, [orderId, onGetPrescriptionUrl]);

  // ── NEW: Download Invoice ─────────────────────────────────────────────────
  const handleDownloadInvoice = useCallback(async () => {
    setInvoiceLoading(true);
    try {
      const url = await onGetInvoiceUrl(orderId);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, onGetInvoiceUrl]);

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Package size={22} className="text-white/20" />
        </div>
        <p className="text-sm text-white/30 text-center">Select an order to view details</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={24} className="animate-spin text-white/20" />
        <p className="text-xs text-white/30">Loading order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <p className="text-sm text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!orderDetail) return null;

  const {
    order_number, status, customer_name, customer_phone, delivery_address,
    items, prescriptions, total_amount, subtotal, service_charge, delivery_fee,
    km_surcharge, tip, requires_prescription, notes, rejection_reason,
    rejection_reason_other, placed_at, accepted_at, ready_at, completed_at,
    rejected_at, cancelled_at, payment_method, patient,
  } = orderDetail;

  const canBillAndAccept = status === 'PLACED';
  const canReject        = status === 'PLACED';
  const canMarkReady     = status === 'ACCEPTED';
  const canComplete      = status === 'READY_FOR_PICKUP';
  const isTerminal       = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(status);
  const hasInvoice       = ['READY_FOR_PICKUP', 'COMPLETED'].includes(status);

  const hasFeeBreakdown =
    (service_charge && Number(service_charge) > 0) ||
    (delivery_fee   && Number(delivery_fee)   > 0) ||
    (km_surcharge   && Number(km_surcharge)   > 0) ||
    (tip            && Number(tip)            > 0);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-white">{order_number}</h2>
          <p className="text-xs text-white/35 mt-0.5">
            {STATUS_LABELS[status]}{placed_at ? ` · ${formatDateTime(placed_at)}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {actionError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            <AlertCircle size={14} className="flex-shrink-0" />
            {actionError}
          </div>
        )}

        <SectionCard title="Customer" icon={User}>
          <InfoRow label="Name"  value={customer_name}  />
          <InfoRow label="Phone" value={customer_phone} />
        </SectionCard>

        <PatientSection patient={patient} />

        {delivery_address && (
          <SectionCard title="Delivery Address" icon={MapPin}>
            <p className="text-xs text-white/60 leading-relaxed">
              {[delivery_address.address_line_1, delivery_address.address_line_2,
                delivery_address.landmark, delivery_address.city,
                delivery_address.state, delivery_address.pincode].filter(Boolean).join(', ')}
            </p>
            {delivery_address.recipient_name  && <InfoRow label="Recipient" value={delivery_address.recipient_name} />}
            {delivery_address.recipient_phone && <InfoRow label="Phone"     value={delivery_address.recipient_phone} />}
          </SectionCard>
        )}

        <SectionCard title="Order Items" icon={Package}>
          <div className="space-y-3">
            {items?.map((item) => (
              <div key={item.item_id} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium leading-tight truncate">{item.medicine_name}</p>
                  <p className="text-xs text-white/35 mt-0.5">{[item.brand, item.pack_size].filter(Boolean).join(' · ')}</p>
                  <p className="text-xs text-white/35">Qty: {item.quantity} × ₹{Number(item.unit_price).toFixed(2)}</p>
                </div>
                <span className="text-sm font-semibold text-white flex-shrink-0">₹{Number(item.line_total).toFixed(2)}</span>
              </div>
            ))}

            <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Subtotal</span>
                <span className="text-xs text-white/60">₹{Number(subtotal).toFixed(2)}</span>
              </div>
              {hasFeeBreakdown && (
                <>
                  {Number(service_charge) > 0 && <div className="flex justify-between"><span className="text-xs text-white/40">Service charge</span><span className="text-xs text-white/60">₹{Number(service_charge).toFixed(2)}</span></div>}
                  {Number(delivery_fee) > 0   && <div className="flex justify-between"><span className="text-xs text-white/40">Delivery fee</span><span className="text-xs text-white/60">₹{Number(delivery_fee).toFixed(2)}</span></div>}
                  {Number(km_surcharge) > 0   && <div className="flex justify-between"><span className="text-xs text-white/40">Distance surcharge</span><span className="text-xs text-white/60">₹{Number(km_surcharge).toFixed(2)}</span></div>}
                  {Number(tip) > 0            && <div className="flex justify-between"><span className="text-xs text-white/40">Tip</span><span className="text-xs text-white/60">₹{Number(tip).toFixed(2)}</span></div>}
                </>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-sm font-bold text-white">₹{Number(total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Payment</span>
                <span className="text-xs text-white/60">{payment_method}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {requires_prescription && prescriptions?.length > 0 && (
          <SectionCard title="Prescriptions" icon={FileText}>
            <div className="space-y-2">
              {prescriptions.map((p) => (
                <button
                  key={p.prescription_id}
                  onClick={() => handleOpenPrescription(p.prescription_id)}
                  disabled={loadingPrescriptionId === p.prescription_id}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-white/40 flex-shrink-0" />
                    <span className="text-xs text-white/60 truncate">{p.original_name}</span>
                  </div>
                  {loadingPrescriptionId === p.prescription_id
                    ? <Loader2 size={13} className="animate-spin text-white/30 flex-shrink-0" />
                    : <ExternalLink size={13} className="text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />}
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {notes && (
          <SectionCard title="Customer Notes" icon={FileText}>
            <p className="text-sm text-white/60 leading-relaxed">{notes}</p>
          </SectionCard>
        )}

        {status === 'REJECTED' && rejection_reason && (
          <SectionCard title="Rejection Reason" icon={XCircle}>
            <InfoRow label="Reason"  value={rejection_reason.replace(/_/g, ' ')} />
            {rejection_reason_other && <InfoRow label="Details" value={rejection_reason_other} />}
          </SectionCard>
        )}

        <SectionCard title="Timeline" icon={Clock}>
          <div className="space-y-2">
            {placed_at    && <InfoRow label="Placed"    value={formatDateTime(placed_at)}    />}
            {accepted_at  && <InfoRow label="Accepted"  value={formatDateTime(accepted_at)}  />}
            {ready_at     && <InfoRow label="Ready"     value={formatDateTime(ready_at)}     />}
            {completed_at && <InfoRow label="Completed" value={formatDateTime(completed_at)} />}
            {rejected_at  && <InfoRow label="Rejected"  value={formatDateTime(rejected_at)}  />}
            {cancelled_at && <InfoRow label="Cancelled" value={formatDateTime(cancelled_at)} />}
          </div>
        </SectionCard>

      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06] space-y-2">

        {/* ── Invoice download — shown when invoice exists ───────────────── */}
        {hasInvoice && onGetInvoiceUrl && (
          <button
            onClick={handleDownloadInvoice}
            disabled={invoiceLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white/60 hover:text-white/80 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {invoiceLoading
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            Download Invoice (2-page PDF)
          </button>
        )}

        {!isTerminal && (
          <>
            {/* ── PLACED: Bill & Accept + Reject ───────────────────────────── */}
            {canBillAndAccept && (
              <div className="flex gap-2">
                <button
                  onClick={() => onBillAndAccept(orderDetail.order_id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <ShoppingBag size={15} />}
                  Bill & Accept
                </button>
                <button
                  onClick={() => onOpenReject(orderDetail.order_id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </div>
            )}

            {/* ── ACCEPTED: Mark Ready for Pickup ──────────────────────────── */}
            {canMarkReady && (
              <button
                onClick={() => onMarkReady(orderDetail.order_id)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Mark Ready for Pickup
              </button>
            )}

            {/* ── READY_FOR_PICKUP: Complete ────────────────────────────────── */}
            {canComplete && (
              <button
                onClick={() => onComplete(orderDetail.order_id)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Mark Completed
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPanel;