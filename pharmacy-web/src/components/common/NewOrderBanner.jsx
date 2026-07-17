// pharmacy-web/src/components/common/NewOrderBanner.jsx
// MODIFIED
// Key fixes:
//   1. Removed clearRefreshCount on route change — was killing the banner
//      when user visited orders page without acting
//   2. Banner re-appears when navigating away because refreshCount is now
//      only decremented by resolvePendingOrder (in the store), not by routing
//   3. Reads getBannerCount + isBannerVisible as plain function calls
//      (Zustand v5 compatible — these are store methods, not selectors)

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

import useOrderAlertStore from '../../store/useOrderAlertStore';
import { useAppModeStore } from '../../store/useAppModeStore';
import { useMenuStore } from '../../store/useMenuStore';
import { getOrders } from '../../api/marketplaceOrders';

// Banner is hidden on the orders page — user is already there
const HIDDEN_ON_ROUTES = new Set(['/marketplace/orders']);

const NewOrderBanner = () => {
  const navigate    = useNavigate();
  const location    = useLocation();

  // Read raw state — recompute visibility on every store change
  const pendingOrderIds = useOrderAlertStore((s) => s.pendingOrderIds);
  const refreshCount    = useOrderAlertStore((s) => s.refreshCount);
  const setRefreshCount = useOrderAlertStore((s) => s.setRefreshCount);

  const setAppMode     = useAppModeStore((s) => s.setAppMode);
  const setActiveMenu  = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  // ── On mount: fetch PLACED orders count for refresh-recovery ───────────
  // Runs once. Gives the banner accurate data even after a page refresh,
  // when the SSE pendingOrderIds registry starts empty.
  useEffect(() => {
    let cancelled = false;

    const fetchPlacedCount = async () => {
      try {
        const res = await getOrders({ status: 'PLACED', page: 1, limit: 1 });
        if (cancelled) return;

        if (res.success) {
          const count = res.data?.meta?.total ?? 0;
          setRefreshCount(count);
        } else {
          setRefreshCount(0);
        }
      } catch {
        if (!cancelled) setRefreshCount(0);
      }
    };

    fetchPlacedCount();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived visibility ────────────────────────────────────────────────
  // Compute inline — no clearRefreshCount on route change.
  // refreshCount is only decremented by resolvePendingOrder in the store.
  // This means the banner correctly reappears when the user navigates
  // away from the orders page without having resolved the orders.
  const sseCount    = Object.keys(pendingOrderIds).length;
  const bannerCount = Math.max(sseCount, refreshCount > 0 ? refreshCount : 0);
  const isVisible   = bannerCount > 0 && !HIDDEN_ON_ROUTES.has(location.pathname);

  // ── Navigate to marketplace orders — New Orders tab ───────────────────
  const handleViewOrders = () => {
    setAppMode('MARKETPLACE');
    setActiveMenu('marketplace-orders');
    setBreadcrumbs(['Marketplace', 'Orders']);
    navigate('/marketplace/orders');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="new-order-banner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          // Fixed below header (h-16 = top-16), above page content
          // z-40: below header (z-50) and dropdowns, above page content
          className="fixed top-16 left-0 right-0 z-40 flex justify-center pointer-events-none"
        >
          <motion.div
            className="
              pointer-events-auto
              flex items-center gap-3
              mx-4 mt-2
              px-4 py-2.5
              rounded-xl
              bg-[#010015]
              border border-white/[0.12]
              shadow-2xl shadow-black/40
            "
            animate={{
              boxShadow: [
                '0 0 0 0px rgba(239,68,68,0)',
                '0 0 0 4px rgba(239,68,68,0.15)',
                '0 0 0 0px rgba(239,68,68,0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Icon with live pulse dot */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <ShoppingBag size={15} className="text-red-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full">
                <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
              </span>
            </div>

            {/* Text */}
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold leading-tight">
                {bannerCount === 1
                  ? '1 new order awaiting action'
                  : `${bannerCount} new orders awaiting action`}
              </span>
              <span className="text-white/40 text-[11px] leading-tight mt-0.5">
                Accept or reject to stop this alert
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={handleViewOrders}
              className="
                ml-2 flex items-center gap-1.5
                px-3 py-1.5 rounded-lg
                bg-white text-[#010015]
                text-xs font-bold
                hover:bg-white/90
                transition-colors duration-150
                flex-shrink-0
              "
            >
              View Orders
              <ArrowRight size={12} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewOrderBanner;