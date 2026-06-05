// pharmacy-web/src/hooks/marketplace/useOrdersPage.js
// Full file — adds lastOrderUpdate reaction. Everything else unchanged.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import * as ordersAPI from '../../api/marketplaceOrders';

export const ORDER_TABS = [
  {
    id:         'new',
    label:      'New Orders',
    statuses:   'PLACED',
    emptyLabel: 'No new orders',
    emptyDesc:  'New customer orders will appear here.',
  },
  {
    id:         'active',
    label:      'Active',
    statuses:   'ACCEPTED,READY_FOR_PICKUP',
    emptyLabel: 'No active orders',
    emptyDesc:  'Accepted orders will appear here.',
  },
  {
    id:         'completed',
    label:      'Completed',
    statuses:   'COMPLETED',
    emptyLabel: 'No completed orders',
    emptyDesc:  'Completed orders will appear here.',
  },
  {
    id:         'rejected',
    label:      'Rejected / Cancelled',
    statuses:   'REJECTED,CANCELLED',
    emptyLabel: 'No rejected orders',
    emptyDesc:  'Rejected and cancelled orders will appear here.',
  },
];

const PAGE_SIZE = 20;

export function useOrdersPage() {
  const clearNewOrderCount  = useNotificationStore((s) => s.clearNewOrderCount);
  const clearLastOrderUpdate = useNotificationStore((s) => s.clearLastOrderUpdate);
  const newOrderCount       = useNotificationStore((s) => s.newOrderCount);
  const lastOrderUpdate     = useNotificationStore((s) => s.lastOrderUpdate);

  const [activeTab,       setActiveTab]       = useState('new');
  const [orders,          setOrders]          = useState([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState(null);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [total,           setTotal]           = useState(0);

  const [selectedOrderId,   setSelectedOrderId]   = useState(null);
  const [orderDetail,       setOrderDetail]       = useState(null);
  const [isDetailLoading,   setIsDetailLoading]   = useState(false);
  const [detailError,       setDetailError]       = useState(null);

  const [actionLoading,   setActionLoading]   = useState(false);
  const [actionError,     setActionError]     = useState(null);

  const [rejectModal,     setRejectModal]     = useState({ open: false, orderId: null });

  const prevOrderCount = useRef(newOrderCount);

  // ── Clear badge on mount ──────────────────────────────────────────────────
  useEffect(() => {
    clearNewOrderCount();
  }, [clearNewOrderCount]);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (tabId = activeTab, pageNum = 1) => {
    const tab = ORDER_TABS.find((t) => t.id === tabId);
    if (!tab) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await ordersAPI.getOrders({
        status: tab.statuses,
        page:   pageNum,
        limit:  PAGE_SIZE,
      });

      if (res.success) {
        setOrders(res.data.orders);
        setPage(res.data.meta.page);
        setTotalPages(res.data.meta.total_pages);
        setTotal(res.data.meta.total);
      }
    } catch (err) {
      setError('Failed to load orders');
      console.error('[OrdersPage] fetchOrders error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // ── Initial load + tab change ─────────────────────────────────────────────
  useEffect(() => {
    fetchOrders(activeTab, 1);
  }, [activeTab]);

  // ── SSE: new order arrives → refresh New Orders tab ───────────────────────
  useEffect(() => {
    if (newOrderCount > prevOrderCount.current) {
      if (activeTab === 'new') {
        fetchOrders('new', 1);
      }
      prevOrderCount.current = newOrderCount;
    }
  }, [newOrderCount, activeTab, fetchOrders]);

  // ── SSE: order status changed ─────────────────────────────────────────────
  // Fires when ANY order transitions: ACCEPTED, REJECTED, READY_FOR_PICKUP,
  // COMPLETED, CANCELLED (customer or system).
  //
  // Strategy:
  //   1. Always refresh the current tab list — the changed order may have
  //      moved into or out of this tab.
  //   2. If the changed order is currently open in the detail panel,
  //      reload the detail so the panel reflects the new status immediately.
  //   3. Clear the signal so this effect doesn't re-fire on unrelated renders.
  useEffect(() => {
    if (!lastOrderUpdate) return;

    fetchOrders(activeTab, page);

    if (selectedOrderId && selectedOrderId === lastOrderUpdate.order_id) {
      handleSelectOrder(lastOrderUpdate.order_id);
    }

    clearLastOrderUpdate();
  }, [lastOrderUpdate]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: intentionally omitting fetchOrders, activeTab, page, selectedOrderId,
  // handleSelectOrder from deps to avoid re-triggering on their own changes.
  // lastOrderUpdate is the only signal we react to here.

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedOrderId(null);
    setOrderDetail(null);
    setPage(1);
  }, []);

  // ── Open order detail ─────────────────────────────────────────────────────
  const handleSelectOrder = useCallback(async (orderId) => {
    setSelectedOrderId(orderId);
    setOrderDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);

    try {
      const res = await ordersAPI.getOrderDetail(orderId);
      if (res.success) {
        setOrderDetail(res.data);
      }
    } catch (err) {
      setDetailError('Failed to load order details');
      console.error('[OrdersPage] getOrderDetail error:', err);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // ── Close detail panel ────────────────────────────────────────────────────
  const handleCloseDetail = useCallback(() => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setDetailError(null);
  }, []);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async (orderId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.acceptOrder(orderId);
      if (res.success) {
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) {
          await handleSelectOrder(orderId);
        }
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  }, [activeTab, page, selectedOrderId, fetchOrders, handleSelectOrder]);

  // ── Open reject modal ─────────────────────────────────────────────────────
  const handleOpenReject = useCallback((orderId) => {
    setRejectModal({ open: true, orderId });
  }, []);

  const handleCloseReject = useCallback(() => {
    setRejectModal({ open: false, orderId: null });
    setActionError(null);
  }, []);

  // ── Submit reject ─────────────────────────────────────────────────────────
  const handleRejectSubmit = useCallback(async (reason, reasonOther) => {
    const { orderId } = rejectModal;
    if (!orderId) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.rejectOrder(orderId, {
        rejection_reason:       reason,
        rejection_reason_other: reasonOther || undefined,
      });
      if (res.success) {
        // Route close through handleCloseReject so modal state is reset cleanly
        handleCloseReject();
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) {
          handleCloseDetail();
        }
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  }, [rejectModal, activeTab, page, selectedOrderId, fetchOrders, handleCloseDetail, handleCloseReject]);

  // ── Mark ready ────────────────────────────────────────────────────────────
  const handleMarkReady = useCallback(async (orderId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.markReady(orderId);
      if (res.success) {
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) {
          await handleSelectOrder(orderId);
        }
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  }, [activeTab, page, selectedOrderId, fetchOrders, handleSelectOrder]);

  // ── Complete ──────────────────────────────────────────────────────────────
  const handleComplete = useCallback(async (orderId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.completeOrder(orderId);
      if (res.success) {
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) {
          handleCloseDetail();
        }
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to complete order');
    } finally {
      setActionLoading(false);
    }
  }, [activeTab, page, selectedOrderId, fetchOrders, handleCloseDetail]);

  // ── Get prescription URL ──────────────────────────────────────────────────
  const handleGetPrescriptionUrl = useCallback(async (orderId, prescriptionId) => {
    try {
      const res = await ordersAPI.getPrescriptionUrl(orderId, prescriptionId);
      if (res.success) return res.data.url;
    } catch (err) {
      console.error('[OrdersPage] getPrescriptionUrl error:', err);
    }
    return null;
  }, []);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    fetchOrders(activeTab, page);
  }, [activeTab, page, fetchOrders]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((newPage) => {
    fetchOrders(activeTab, newPage);
  }, [activeTab, fetchOrders]);

  return {
    activeTab,
    onTabChange: handleTabChange,

    orders,
    isLoading,
    error,
    page,
    totalPages,
    total,
    PAGE_SIZE,
    onPageChange: handlePageChange,
    onRefresh:    handleRefresh,

    selectedOrderId,
    orderDetail,
    isDetailLoading,
    detailError,
    onSelectOrder:  handleSelectOrder,
    onCloseDetail:  handleCloseDetail,

    actionLoading,
    actionError,
    onAccept:              handleAccept,
    onMarkReady:           handleMarkReady,
    onComplete:            handleComplete,
    onGetPrescriptionUrl:  handleGetPrescriptionUrl,

    rejectModal,
    onOpenReject:   handleOpenReject,
    onCloseReject:  handleCloseReject,
    onRejectSubmit: handleRejectSubmit,
  };
}