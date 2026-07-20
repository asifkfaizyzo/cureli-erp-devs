// pharmacy-web/src/pages/marketplace-orders/MarketplaceOrdersPage.jsx
// MODIFIED — routes Prescriptions tab to PrescriptionRequestsTab

import { useState }          from 'react';
import { ShoppingBag }       from 'lucide-react';
import { useOrdersPage, ORDER_TABS } from '../../hooks/marketplace/useOrdersPage';
import OrdersTabBar, { PRESCRIPTION_TAB_ID } from './components/OrdersTabBar';
import OrderListPanel        from './components/OrderListPanel';
import OrderDetailPanel      from './components/OrderDetailPanel';
import RejectModal           from './components/RejectModal';
import PrescriptionRequestsTab from '../prescription-requests/PrescriptionRequestsTab';
import usePrescriptionRequestAlertStore from '../../store/usePrescriptionRequestAlertStore';

const MarketplaceOrdersPage = () => {
  const page = useOrdersPage();

  // Active tab — starts on 'new' (existing default from useOrdersPage)
  // When user clicks Prescriptions tab we switch locally
  const [activeTab, setActiveTab] = useState(page.activeTab);

  const pendingRequestIds = usePrescriptionRequestAlertStore((s) => s.pendingRequestIds);
  const pendingRequestCount = Object.keys(pendingRequestIds).length;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== PRESCRIPTION_TAB_ID) {
      // Delegate to existing order tab handler
      page.onTabChange(tabId);
    }
  };

  // Tab counts — merge order counts + prescription count
  const tabCounts = {
    [page.activeTab]:    page.total,
    [PRESCRIPTION_TAB_ID]: pendingRequestCount,
  };

  const isPrescriptionTab = activeTab === PRESCRIPTION_TAB_ID;

  return (
    <div className="h-full flex flex-col bg-[#010015] overflow-hidden">

      {/* ── Page Header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={18} className="text-white/60" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Marketplace Orders
            </h1>
            <p className="text-[12px] text-white/35 mt-0.5">
              Review and manage customer orders and prescription requests
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0">
        <OrdersTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={tabCounts}
        />
      </div>

      {/* ── Content ── */}
      {isPrescriptionTab ? (
        // Prescription requests tab — completely separate layout + data
        <PrescriptionRequestsTab />
      ) : (
        // Existing orders layout — unchanged
        <div className="flex-1 overflow-hidden grid grid-cols-[380px_1fr]">
          <OrderListPanel
            activeTab={page.activeTab}
            orders={page.orders}
            isLoading={page.isLoading}
            error={page.error}
            selectedOrderId={page.selectedOrderId}
            onSelectOrder={page.onSelectOrder}
            page={page.page}
            totalPages={page.totalPages}
            total={page.total}
            onPageChange={page.onPageChange}
            onRefresh={page.onRefresh}
          />
          <OrderDetailPanel
            orderId={page.selectedOrderId}
            orderDetail={page.orderDetail}
            isLoading={page.isDetailLoading}
            error={page.detailError}
            actionLoading={page.actionLoading}
            actionError={page.actionError}
            onClose={page.onCloseDetail}
            onAccept={page.onAccept}
            onOpenReject={page.onOpenReject}
            onMarkReady={page.onMarkReady}
            onComplete={page.onComplete}
            onGetPrescriptionUrl={page.onGetPrescriptionUrl}
          />
        </div>
      )}

      {/* ── Reject Modal (orders only) ── */}
      {!isPrescriptionTab && (
        <RejectModal
          open={page.rejectModal.open}
          onClose={page.onCloseReject}
          onSubmit={page.onRejectSubmit}
          isLoading={page.actionLoading}
          error={page.actionError}
        />
      )}
    </div>
  );
};

export default MarketplaceOrdersPage;