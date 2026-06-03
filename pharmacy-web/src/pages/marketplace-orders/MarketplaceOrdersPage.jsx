// ============================================
// pharmacy-web/src/pages/marketplace-orders/MarketplaceOrdersPage.jsx
// ============================================

import { ShoppingBag } from 'lucide-react';
import { useOrdersPage, ORDER_TABS } from '../../hooks/marketplace/useOrdersPage';
import OrdersTabBar from './components/OrdersTabBar';
import OrderListPanel from './components/OrderListPanel';
import OrderDetailPanel from './components/OrderDetailPanel';
import RejectModal from './components/RejectModal';

const MarketplaceOrdersPage = () => {
  const page = useOrdersPage();

  // Build tab counts from current data
  // We only know the count for the active tab since we fetch per-tab
  const tabCounts = {
    [page.activeTab]: page.total,
  };

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
              Review and manage customer orders from your storefront
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0">
        <OrdersTabBar
          activeTab={page.activeTab}
          onTabChange={page.onTabChange}
          counts={tabCounts}
        />
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-[380px_1fr]">

        {/* Left: Order list */}
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

        {/* Right: Order detail */}
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

      {/* ── Reject Modal ── */}
      <RejectModal
        open={page.rejectModal.open}
        onClose={page.onCloseReject}
        onSubmit={page.onRejectSubmit}
        isLoading={page.actionLoading}
        error={page.actionError}
      />
    </div>
  );
};

export default MarketplaceOrdersPage;