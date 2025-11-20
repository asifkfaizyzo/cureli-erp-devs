import { useState } from "react";
import OnboardStepper from "../components/OnboardStepper";
import IdentityForm from "../components/IdentityForm";
import EmailOTP from "../components/EmailOTP";
import PhoneDetails from "../components/PhoneDetails";
import PhoneOTP from "../components/PhoneOTP";
import BusinessInfo  from "../components/BusinessInfo"; 
import BusinessTypeAndGST  from "../components/BusinessTypeAndGST"; 
import UploadDrugLicense  from "../components/UploadDrugLicense"; 
import UploadRegistration  from "../components/UploadRegistration";     
import UploadProof  from "../components/UploadProof";   
import UploadEALisence  from "../components/UploadEALisence";           
import UploadBPan  from "../components/UploadBPan";           
import UploadAddressProof  from "../components/UploadAddressProof"; 
import VerificationPending  from "../components/VerificationPending"; 
import OnboardSuccess  from "../components/OnboardSuccess"; 





// Placeholder components for steps 3–13
const Placeholder = ({ title, onContinue }) => (
    <div className="w-full max-w-md mt-10 text-center">
        <h2 className="text-xl font-bold mb-6">{title}</h2>
        <button
            onClick={onContinue}
            className="w-full bg-[#000060] text-white py-2.5 rounded-lg mt-4"
        >
            Continue
        </button>
    </div>
);

const PENDING_TITLE = "Waiting for Admin Approval";
const SUCCESS_TITLE = "Onboarding Completed Successfully!";

const OnboardingWrapper = () => {
    const [progressStep, setProgressStep] = useState(0);

    const goNext = () => setProgressStep(prev => prev + 1);

    const renderStep = () => {
        switch (progressStep) {
            case 0: return <IdentityForm onContinue={goNext} />;
            case 1: return <EmailOTP onContinue={goNext} />;
            case 2: return <PhoneDetails onContinue={goNext} />;

            // Steps 3–11 → placeholders for now
            case 3: return <PhoneOTP onContinue={goNext} />;
            case 4: return <BusinessInfo onContinue={goNext} />;
            case 5: return <BusinessTypeAndGST onContinue={goNext} />;
            case 6: return <UploadDrugLicense onContinue={goNext} />;
            case 7: return <UploadRegistration onContinue={goNext} />;
            case 8: return <UploadProof onContinue={goNext} />;
            case 9: return <UploadEALisence onContinue={goNext} />;
            case 10: return <UploadBPan onContinue={goNext} />;
            case 11: return <UploadAddressProof onContinue={goNext} />;
            case 12: return <VerificationPending onContinue={goNext} />;
            

            case 13: return <Placeholder title={PENDING_TITLE} onContinue={() => {}} />;
            case 14: return <OnboardSuccess  onContinue={() => {}} />;

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center py-10 font-poppins">
            <OnboardStepper progressStep={progressStep} />
            {renderStep()}
        </div>
    );
};

export default OnboardingWrapper;
