import React, { useEffect, useState } from "react";
import { getPlans, selectPlan } from "../api/subscription";
import { useNavigate } from "react-router-dom";

const PlanSelectionPage = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");

  // Convert paise → rupees
  const toRupees = (amount) => {
    if (amount === null || amount === undefined) return null;
    return Number(amount) / 100;
  };

  // Load backend plans
  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await getPlans();
        const backendPlans = res.data.data.plans || [];

        setPlans(
          backendPlans.map((p) => ({
            id: p.plan_id,
            title: p.name,
            priceYearly: toRupees(p.price),
            branches: `${p.max_branches} Branch${
              p.max_branches > 1 ? "es" : ""
            }`,
            employees: `${p.max_users} Employees`,
            features: p.features_json?.benefits || [],
            isCustom: p.is_customizable,
          }))
        );
      } catch (err) {
        console.error("Failed to load plans", err);
        setError("Failed to load plans.");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  // Select plan
  const handleSelect = async (planId) => {
    try {
      setSelecting(true);

      await selectPlan({ plan_id: planId });

      // Free plan = immediate dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Select plan error:", err);
      setError("Unable to select this plan. Try again.");
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#000060] text-xl font-semibold">
        Loading plans...
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-15 bg-white flex flex-col items-center py-10 font-poppins px-4">
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-[#000060] mb-2">
        Choose Your Plan
      </h1>

      <p className="text-gray-600 text-sm mb-10 text-center max-w-lg">
        Select the plan that fits your business. Upgrade anytime.
      </p>

      {error && <p className="text-red-600 text-sm mb-6">{error}</p>}

      {/* PLAN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-xl transition p-6 flex flex-col items-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-[#000060]">
              {plan.title}
            </h2>

            <p className="text-3xl font-bold text-[#000060] mt-4">
              {plan.priceMonthly === 0
                ? "₹0"
                : plan.priceMonthly === null
                ? "Contact Us"
                : `₹${plan.priceMonthly}`}
            </p>

            {/* BRANCH + USERS */}
            <p className="text-gray-600 text-sm mt-2">{plan.branches}</p>
            <p className="text-gray-600 text-sm">{plan.employees}</p>

            {/* FEATURES */}
            <ul className="mt-4 text-sm text-gray-700 space-y-1">
              {plan.features.map((f, idx) => (
                <li key={idx}>• {f}</li>
              ))}
            </ul>

            {/* SELECT BUTTON */}
            <button
              onClick={() => handleSelect(plan.id)}
              disabled={selecting}
              className="mt-6 bg-[#000060] hover:bg-[#000060c1] text-white w-full py-2 rounded-xl text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {selecting ? "Processing..." : "Select Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanSelectionPage;
