// src/pages/BillingPage.jsx
import BillingHeader from "../components/billing/BillingHeader";
import ProductTable from "../components/billing/ProductTable";
import CustomerDetailsCard from "../components/billing/CustomerDetailsCard";
import BillingSummaryCard from "../components/billing/BillingSummaryCard";

const BillingPage = () => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      {/* Header (fixed, always visible) */}
      <BillingHeader />

      {/* Main section (fixed height layout, no page scroll) */}
      <div className="flex-1 flex flex-col overflow-hidden mt-2">

        {/* TABLE (only this part scrolls) */}
        <div className="flex-1 overflow-y-auto">
          <ProductTable />
        </div>

        {/* Bottom Section (fixed, no scroll) */}
        <div className="mt-3 flex gap-4 items-start">
          <CustomerDetailsCard />
          <BillingSummaryCard />
        </div>

      </div>
    </div>
  );
};

export default BillingPage;
