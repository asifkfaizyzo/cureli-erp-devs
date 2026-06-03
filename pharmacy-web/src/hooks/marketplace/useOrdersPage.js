// ============================================
// pharmacy-web/src/hooks/marketplace/useOrdersPage.js
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import * as ordersAPI from '../../api/marketplaceOrders';

// Tab definitions
export const ORDER_TABS = [
  {
    id: 'new',
    label: 'New Orders',
    statuses: 'PLACED',
    emptyLabel: 'No new orders',
    emptyDesc: 'New customer orders will appear here.',
  },
  {
    id: 'active',
    label: 'Active',
    statuses: 'ACCEPTED,READY_FOR_PICKUP',
    emptyLabel: 'No active orders',
    emptyDesc: 'Accepted orders will appear here.',
  },
  {
    id: 'completed',
    label: 'Completed',
    statuses: 'COMPLETED',
    emptyLabel: 'No completed orders',
    emptyDesc: 'Completed orders will appear here.',
  },
  {
    id: 'rejected',
    label: 'Rejected / Cancelled',
    statuses: 'REJECTED,CANCELLED',
    emptyLabel: 'No rejected orders',
    emptyDesc: 'Rejected and cancelled orders will appear here.',
  },
];

const PAGE_SIZE = 20;

export function useOrdersPage() {
  const clearNewOrderCount = useNotificationStore((s) => s.clearNewOrderCount);
  const newOrderCount = useNotificationStore((s) => s.newOrderCount);

  const [activeTab, setActiveTab] = useState('new');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Order detail panel
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState({ open: false, orderId: null });

  // Track last SSE count to detect new orders
  const prevOrderCount = useRef(newOrderCount);

  // ── Clear badge when page mounts ─────────────────────────────────────────
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
        page: pageNum,
        limit: PAGE_SIZE,
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

  // ── Initial load and tab change ───────────────────────────────────────────
  useEffect(() => {
    fetchOrders(activeTab, 1);
  }, [activeTab]);

  // ── SSE: auto-refresh New Orders tab when new order arrives ───────────────
  useEffect(() => {
    if (newOrderCount > prevOrderCount.current) {
      if (activeTab === 'new') {
        fetchOrders('new', 1);
      }
      prevOrderCount.current = newOrderCount;
    }
  }, [newOrderCount, activeTab, fetchOrders]);

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
        // Refresh list and detail
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
        rejection_reason: reason,
        rejection_reason_other: reasonOther || undefined,
      });
      if (res.success) {
        setRejectModal({ open: false, orderId: null });
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
  }, [rejectModal, activeTab, page, selectedOrderId, fetchOrders, handleCloseDetail]);

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
      if (res.success) {
        return res.data.url;
      }
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
    // Tabs
    activeTab,
    onTabChange: handleTabChange,

    // List
    orders,
    isLoading,
    error,
    page,
    totalPages,
    total,
    PAGE_SIZE,
    onPageChange: handlePageChange,
    onRefresh: handleRefresh,

    // Detail panel
    selectedOrderId,
    orderDetail,
    isDetailLoading,
    detailError,
    onSelectOrder: handleSelectOrder,
    onCloseDetail: handleCloseDetail,

    // Actions
    actionLoading,
    actionError,
    onAccept: handleAccept,
    onMarkReady: handleMarkReady,
    onComplete: handleComplete,
    onGetPrescriptionUrl: handleGetPrescriptionUrl,

    // Reject modal
    rejectModal,
    onOpenReject: handleOpenReject,
    onCloseReject: handleCloseReject,
    onRejectSubmit: handleRejectSubmit,
  };
}