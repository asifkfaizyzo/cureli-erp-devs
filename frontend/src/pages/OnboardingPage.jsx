// pages/OnboardingPage.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

import OnboardStepper from "../components/OnboardStepper";
import IdentityForm from "../components/IdentityForm";
import EmailOTP from "../components/EmailOTP";
import PhoneDetails from "../components/PhoneDetails";
import PhoneOTP from "../components/PhoneOTP";
import BusinessInfo from "../components/BusinessInfo";
import BusinessTypeAndGST from "../components/BusinessTypeAndGST";
import UploadDrugLicense from "../components/UploadDrugLicense";
import UploadRegistration from "../components/UploadRegistration";
import UploadProof from "../components/UploadProof";
import UploadEALisence from "../components/UploadEALisence";
import UploadBPan from "../components/UploadBPan";
import UploadAddressProof from "../components/UploadAddressProof";
import VerificationPending from "../components/VerificationPending";
import OnboardSuccess from "../components/OnboardSuccess";
import CreatePassword from "../components/CreatePassword";

const OnboardingPage = () => {
  const location = useLocation();
  const pending_id = location.state?.pending_id;
  const email = location.state?.email;
  const first_name = location.state?.first_name;
  const last_name = location.state?.last_name;
  const [progressStep, setProgressStep] = useState(
    location.state?.resume_step ?? 0
  );

  // Skip pending-user steps if logged-in user resumes onboarding
  useEffect(() => {
    if (progressStep < 4 && location.state?.resume_step >= 4) {
      setProgressStep(location.state.resume_step);
    }
  }, []);

  const provider = location.state?.provider || "password";

  const handleContinue = () => {
    setProgressStep((prev) => prev + 1);
  };

  const renderStep = () => {
    switch (progressStep) {
      case 0:
        return provider === "google" ? (
          <CreatePassword pending_id={pending_id} onContinue={handleContinue} />
        ) : (
          <EmailOTP
            pending_id={pending_id}
            email={email}
            onContinue={handleContinue}
          />
        );

      case 1:
        return (
          <PhoneDetails pending_id={pending_id} onContinue={handleContinue} />
        );

      case 2:
        return <PhoneOTP pending_id={pending_id} onContinue={handleContinue} />;

      case 3:
        return (
          <IdentityForm
            pending_id={pending_id}
            onContinue={handleContinue}
            onNext={handleContinue}
          />
        );
      case 4:
        return <BusinessInfo onContinue={handleContinue} />;
      case 5:
        return <BusinessTypeAndGST onContinue={handleContinue} />;
      case 6:
        return <UploadDrugLicense onContinue={handleContinue} />;
      case 7:
        return <UploadRegistration onContinue={handleContinue} />;
      case 8:
        return <UploadProof onContinue={handleContinue} />;
      case 9:
        return <UploadEALisence onContinue={handleContinue} />;
      case 10:
        return <UploadBPan onContinue={handleContinue} />;
      case 11:
        return <UploadAddressProof onContinue={handleContinue} />;
      case 12:
        return <VerificationPending onContinue={handleContinue} />;
      case 13:
        return <OnboardSuccess onStart={handleContinue} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-white flex flex-col items-center py-10 font-poppins">
      <OnboardStepper progressStep={progressStep} />

      {/* ANIMATED STEP CONTENT */}
      <div className="w-full flex justify-center mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={progressStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full flex justify-center"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
