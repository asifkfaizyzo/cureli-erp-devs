// pages/OnboardingPage.jsx
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


const OnboardingPage = () => {
    const [progressStep, setProgressStep] = useState(0);

    const handleContinue = () => {
        setProgressStep((prev) => prev + 1);
    };

    return (
        <div className="w-full min-h-screen bg-white flex flex-col items-center py-10 font-poppins">

            <OnboardStepper progressStep={progressStep} />

            {/* STEP 0: Identity */}
            {progressStep === 0 && <IdentityForm onContinue={handleContinue} />}

            {/* STEP 1: Email OTP */}
            {progressStep === 1 && <EmailOTP onContinue={handleContinue} />}

            {/* STEP 2: Phone Details */}
            {progressStep === 2 && <PhoneDetails onContinue={handleContinue} />}

            {/* STEP 3: Phone OTP */}
            {progressStep === 3 && <PhoneOTP onContinue={handleContinue} />}
            {/* STEP 4: Business Details */}
            {progressStep === 4 && <BusinessInfo onContinue={handleContinue} />}
            {/* STEP 5: Business Type & GST */}
            {progressStep === 5 && <BusinessTypeAndGST onContinue={handleContinue} />}
            {/* STEP 6: Upload Drug License */}
            {progressStep === 6 && <UploadDrugLicense onContinue={handleContinue} />}
            {/* STEP 7: Upload Registration Certificate */}
            {progressStep === 7 && <UploadRegistration onContinue={handleContinue} />}
            {/* STEP 8: Upload Proof */}
            {progressStep === 8 && <UploadProof onContinue={handleContinue} />}
            {/* STEP 9: Upload Shop and Establishment Act Licence */}
            {progressStep === 9 && <UploadEALisence onContinue={handleContinue} />}
            {/* STEP 10: Upload Business PAN */}
            {progressStep === 10 && <UploadBPan onContinue={handleContinue} />}
            {/* STEP 11: Upload Address Proof */}
            {progressStep === 11 && <UploadAddressProof onContinue={handleContinue} />}
            {/* STEP 12: Verification Pending */}
            {progressStep === 12 && <VerificationPending onContinue={handleContinue} />}
            {/* STEP 13: Onboard Success */}
            {progressStep === 13 && <OnboardSuccess onStart={handleContinue} />}

            {/* More steps later */}
        </div>
    );
};

export default OnboardingPage;
