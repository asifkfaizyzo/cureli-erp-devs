// src/pages/BillingPage.jsx
import BillingHeader from "../components/billing/BillingHeader";
import ProductTable from "../components/billing/ProductTable";
import CustomerDetailsCard from "../components/billing/CustomerDetailsCard";
import BillingSummaryCard from "../components/billing/BillingSummaryCard";
import Breadcrumb from "../components/common/Breadcrumb";

const BillingPage = () => {
  return (
    <div className="w-full  h-full flex flex-col">
      {/* Breadcrumb Component */}
      <Breadcrumb />

  <BillingHeader />

  {/* This section will expand but NOT scroll */}
  <div className="flex-1 mt-1 flex flex-col">

    {/* TABLE becomes scrollable */}
    <div className="overflow-auto max-h-[350px]">
      <ProductTable />
    </div>

    {/* Bottom section stays fixed */}
    <div className="mt-3 flex gap-4 items-start pb-6">
      <CustomerDetailsCard />
      <BillingSummaryCard />
    </div>

  </div>
</div>

  );
};

export default BillingPage;
