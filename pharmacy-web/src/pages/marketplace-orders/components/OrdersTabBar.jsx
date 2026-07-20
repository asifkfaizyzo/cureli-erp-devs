// pharmacy-web/src/pages/marketplace-orders/components/OrdersTabBar.jsx
// MODIFIED — adds Prescriptions tab with separate active state

import { FileText } from 'lucide-react';
import { ORDER_TABS } from '../../../hooks/marketplace/useOrdersPage';

// Prescription requests tab definition — kept here, not in ORDER_TABS
// because it routes to a completely different data source and hook
export const PRESCRIPTION_TAB_ID = 'prescriptions';

const PRESCRIPTION_TAB = {
  id:    PRESCRIPTION_TAB_ID,
  label: 'Prescriptions',
};

const OrdersTabBar = ({ activeTab, onTabChange, counts = {} }) => {
  const allTabs = [...ORDER_TABS, PRESCRIPTION_TAB];

  return (
    <div className="flex items-center gap-1 border-b border-white/[0.06] px-6">
      {allTabs.map((tab) => {
        const isActive  = activeTab === tab.id;
        const count     = counts[tab.id];
        const isPrescription = tab.id === PRESCRIPTION_TAB_ID;

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
            {isPrescription && (
              <FileText size={13} className={isActive ? 'text-white' : 'text-white/40'} />
            )}
            {tab.label}
            {count > 0 && (
              <span
                className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center
                  ${
                    isActive && (tab.id === 'new' || isPrescription)
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