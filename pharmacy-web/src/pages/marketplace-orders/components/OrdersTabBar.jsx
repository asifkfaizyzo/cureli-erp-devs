// ============================================
// components/OrdersTabBar.jsx
// ============================================

import { ORDER_TABS } from '../../../hooks/marketplace/useOrdersPage';

const OrdersTabBar = ({ activeTab, onTabChange, counts = {} }) => {
  return (
    <div className="flex items-center gap-1 border-b border-white/[0.06] px-6">
      {ORDER_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 text-sm font-medium
              border-b-2 transition-all duration-150
              ${
                isActive
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }
            `}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center
                  ${
                    isActive && tab.id === 'new'
                      ? 'bg-red-500 text-white animate-pulse'
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/50'
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OrdersTabBar;