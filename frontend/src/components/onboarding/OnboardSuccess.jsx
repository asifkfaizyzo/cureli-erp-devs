import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import success from "../assets/images/success.jpg";
import { completeOnboarding } from "../../api/auth";
import { getMySubscription } from "../../api/subscription";

const OnboardSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

const handleGetStarted = async () => {
  setLoading(true);

  try {
    // Mark onboarding as complete
    await completeOnboarding();

    // 🔥 Check subscription
    const subRes = await getMySubscription();
    const payload = subRes.data?.data;

    const hasActive =
      payload?.has_active_subscription ||
      payload?.current_plan ||
      false;

    if (!hasActive) {
      navigate("/plan-selection");
      return;
    }

    navigate("/dashboard");
    return;

  } catch (err) {
    console.error("Failed to complete onboarding:", err);
    alert("Something went wrong. Please try again.");
  }

  setLoading(false);
};


  return (
    <div className="w-full flex flex-col items-center mt-5 px-4 font-poppins">
      {/* CARD */}
      <div
        className="w-full max-w-3xl bg-white rounded-xl shadow-md flex flex-col items-center py-16 px-6"
        style={{ boxShadow: "0px 4px 35px rgba(0,0,0,0.08)" }}
      >
        {/* SUCCESS ICON */}
        <img src={success} alt="success" className="w-32 h-30 mb-2" />

        {/* TITLE */}
        <h2 className="text-[28px] font-semibold text-[#000060] text-center">
          Welcome to Cureli
        </h2>

        {/* SUBTEXT */}
        <p className="text-gray-600 text-sm text-center mt-2">
          We're excited to have you get started.
        </p>
      </div>

      {/* BUTTON */}
      <button
        onClick={handleGetStarted}
        disabled={loading}
        className="w-full max-w-md bg-[#000060] text-white py-3 rounded-xl 
                   hover:bg-[#000060d1] transition font-medium mt-4
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Loading..." : "Get Started"}
      </button>
    </div>
  );
};

export default OnboardSuccess;
