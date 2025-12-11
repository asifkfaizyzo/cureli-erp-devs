// src/pages/VerificationPage.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import OnboardingHeader from "../components/layout/OnboardingHeader";
import VerificationStepper from "../components/verification/VerificationStepper";
import VerificationPending from "../components/verification/VerificationPending";
import DocumentResubmission from "../components/verification/DocumentResubmission";
import VerificationSuccess from "../components/verification/VerificationSuccess";
import { getVerificationStatus } from "../api/shopFiles";

const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialStep = location.state?.resume_step ?? null;

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(initialStep || 12);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user name from localStorage
    setUserName(localStorage.getItem("user_name") || "");
    initializeVerification();
  }, []);

  const initializeVerification = async () => {
    if (initialStep && [12, 14, 15].includes(initialStep)) {
      console.log("✅ Using navigation step:", initialStep);
      setCurrentStep(initialStep);
      setLoading(false);
      return;
    }
    await fetchStatus();
  };

  const fetchStatus = async () => {
    try {
      const resp = await getVerificationStatus();
      const data = resp.data?.data;

      console.log("📡 Verification Status Response:", data);

      const shopStatus = data?.verification_status;
      const userStatus = data?.user_status;
      const firstLogin = data?.first_login_after_verification;

      // Update username if available
      if (data?.user_name) {
        setUserName(data.user_name);
        localStorage.setItem("user_name", data.user_name);
      }

      console.log("🔍 Status check:", { shopStatus, userStatus, firstLogin });

      let step = 12;

      if (shopStatus === "verified") {
        if (userStatus === "verified" && firstLogin) {
          console.log("→ Verified + seen success, going to dashboard");
          navigate("/dashboard");
          return;
        } else {
          console.log("→ Verified, showing success");
          step = 15;
        }
      } else if (shopStatus === "rejected" || shopStatus === "partially_rejected") {
        console.log("→ Has rejections, showing resubmission");
        step = 14;
      } else if (shopStatus === "pending_review" || shopStatus === "pending") {
        console.log("→ Pending review, showing pending page");
        step = 12;
      } else {
        console.log("→ Unknown status, defaulting to pending");
        step = 12;
      }

      console.log("📍 Final step:", step);
      setCurrentStep(step);
    } catch (e) {
      console.error("Failed to fetch verification status:", e);

      if (e.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("shop_id");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        navigate("/", { replace: true });
        return;
      }

      setError("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusRefresh = async () => {
    console.log("🔄 Refreshing status...");
    setLoading(true);
    await fetchStatus();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 12:
        return <VerificationPending onRefresh={handleStatusRefresh} />;
      case 14:
        return <DocumentResubmission refreshStatus={handleStatusRefresh} />;
      case 15:
        return <VerificationSuccess />;
      default:
        return <VerificationPending onRefresh={handleStatusRefresh} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#000060] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh h-dvh bg-gray-50 flex flex-col font-poppins">
      {/* Header */}
      <OnboardingHeader userName={userName} />

      {/* Stepper */}
      <div className="flex-shrink-0 w-full flex justify-center px-4 pt-3 pb-2">
        <VerificationStepper currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-3xl flex-1 flex flex-col"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerificationPage;