import AppLayout from "../components/layout/AppLayout";
import BillingHeader from "../components/Billing/BillingHeader";
import ProductTable from "../components/Billing/ProductTable";
import CustomerDetailsCard from "../components/Billing/CustomerDetailsCard";
import BillingSummaryCard from "../components/Billing/BillingSummaryCard";

const BillingPage = () => {
  return (
    <AppLayout>
      {/* Header + table */}
      <BillingHeader />
      <ProductTable />

      {/* Bottom row: customer card + summary */}
      <div className="mt-5 flex gap-4 items-start">
        <CustomerDetailsCard />
        <BillingSummaryCard />
      </div>
    </AppLayout>
  );
};

export default BillingPage;
