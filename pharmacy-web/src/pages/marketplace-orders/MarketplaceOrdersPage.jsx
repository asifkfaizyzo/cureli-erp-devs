//pharmacy-web\src\pages\marketplace-orders\MarketplaceOrdersPage.jsx
import { useState }    from 'react';
import { ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useOrdersPage } from '../../hooks/marketplace/useOrdersPage';
import OrdersTabBar, { PRESCRIPTION_TAB_ID } from './components/OrdersTabBar';
import OrderListPanel    from './components/OrderListPanel';
import OrderDetailPanel  from './components/OrderDetailPanel';
import RejectModal       from './components/RejectModal';
import PrescriptionRequestsTab from '../prescription-requests/PrescriptionRequestsTab';
import usePrescriptionRequestAlertStore
  from '../../store/usePrescriptionRequestAlertStore';

const MarketplaceOrdersPage = () => {
  const page = useOrdersPage();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'prescriptions'
    ? PRESCRIPTION_TAB_ID
    : page.activeTab;

  const [activeTab, setActiveTab] = useState(initialTab);

  const pendingRequestIds   = usePrescriptionRequestAlertStore((s) => s.pendingRequestIds);
  const requestRefreshCount = usePrescriptionRequestAlertStore((s) => s.refreshCount);
  const prescriptionCount   = Math.max(
    Object.keys(pendingRequestIds).length,
    requestRefreshCount > 0 ? requestRefreshCount : 0,
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== PRESCRIPTION_TAB_ID) {
      page.onTabChange(tabId);
    }
  };

  // ── NEW: pass counts for both alert tabs ──────────────────────────────────
  // new orders count = API total when on 'new' tab, otherwise 0
  // (clearNewOrderCount fires on mount so SSE count is unreliable here)
  const newOrdersCount = page.activeTab === 'new' ? page.total : 0;

  const tabCounts = {
    new:                   newOrdersCount,    // ← API total, not SSE count
    [PRESCRIPTION_TAB_ID]: prescriptionCount,
  };

  const isPrescriptionTab = activeTab === PRESCRIPTION_TAB_ID;

  return (
    <div className="h-full flex flex-col bg-[#010015] overflow-hidden">

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

      <div className="flex-shrink-0">
        <OrdersTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={tabCounts}   
        />
      </div>

      {isPrescriptionTab ? (
        <PrescriptionRequestsTab />
      ) : (
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