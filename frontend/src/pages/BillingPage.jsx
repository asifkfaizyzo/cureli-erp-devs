// src/pages/BillingPage.jsx
import AppLayout from "../components/layout/AppLayout";
import BillingHeader from "../components/Billing/BillingHeader";
import ProductTable from "../components/Billing/ProductTable";
import CustomerDetailsCard from "../components/Billing/CustomerDetailsCard";
import BillingSummaryCard from "../components/Billing/BillingSummaryCard";

const BillingPageContent = ({ activeMenu }) => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <BillingHeader activeMenu={activeMenu} />

      <div className="flex-1 overflow-auto mt-3">
        <ProductTable />

        <div className="mt-5 flex gap-4 items-start pb-6">
          <CustomerDetailsCard />
          <BillingSummaryCard />
        </div>
      </div>
    </div>
  );
};

const BillingPage = () => {
  return (
    <AppLayout>
      <BillingPageContent />
    </AppLayout>
  );
};

export default BillingPage;



// const BillingPage = ({ activeMenu }) => {
//   return (
//     <Layout>
//       <div className="w-full h-full flex flex-col overflow-hidden">

//         <BillingHeader activeId={activeMenu} />

//         <div className="flex-1 overflow-auto mt-3">
//           <ProductTable />

//           <div className="mt-5 flex gap-4 items-start pb-6">
//             <CustomerDetailsCard />
//             <BillingSummaryCard />
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default BillingPage;

// import Layout from "../components/layout/AppLayout";
// import BillingHeader from "../components/Billing/BillingHeader";
// import ProductTable from "../components/Billing/ProductTable";
// import CustomerDetailsCard from "../components/Billing/CustomerDetailsCard";
// import BillingSummaryCard from "../components/Billing/BillingSummaryCard";