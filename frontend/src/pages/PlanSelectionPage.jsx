import React from "react";

const plans = [
  {
    title: "Free Plan",
    price: "₹0",
    branches: "1 Branch",
    employees: "2 Employees",
    features: [
      "Basic Billing",
      "Basic Reports",
      "Local Backup"
    ],
  },
  {
    title: "Starter",
    price: "₹499 / mo",
    branches: "2 Branches",
    employees: "6 Employees",
    features: [
      "Cloud Backup",
      "Expiry Alerts",
      "Purchase Invoices"
    ],
  },
  {
    title: "Growth",
    price: "₹999 / mo",
    branches: "5 Branches",
    employees: "15 Employees",
    features: [
      "Advanced Inventory",                                                                                                     
      "SMS Alerts",
      "Multi-Store Reports"
    ],
  },
  {
    title: "Custom / Enterprise",
    price: "Contact Us",
    branches: "Unlimited Branches",
    employees: "Unlimited Employees",
    features: [
      "Custom ERP",
      "Dedicated Support",
      "On-site Training"
    ],
  }
];

const PlanSelectionPage = () => {
  return (
    <div className="min-h-screen mt-15 bg-white flex flex-col items-center py-10 font-poppins px-4">

      <h1 className="text-3xl font-bold text-[#000060] mb-2">
        Choose Your Plan
      </h1>
      <p className="text-gray-600 text-sm mb-10 text-center max-w-lg">
        Select the plan that fits your business. Upgrade anytime.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-xl transition p-6 flex flex-col items-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-[#000060]">{plan.title}</h2>
            <p className="text-3xl font-bold text-[#000060] mt-4">{plan.price}</p>

            <p className="text-gray-600 text-sm mt-2">{plan.branches}</p>
            <p className="text-gray-600 text-sm">{plan.employees}</p>

            <ul className="mt-4 text-sm text-gray-700 space-y-1">
              {plan.features.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>

            <button className="mt-6 bg-[#000060] hover:bg-[#000060c1] text-white w-full py-2 rounded-xl text-sm font-semibold">
              Select Plan
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PlanSelectionPage;
