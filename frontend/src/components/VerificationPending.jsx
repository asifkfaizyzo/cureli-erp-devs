import { useEffect } from "react";
import { motion } from "framer-motion";

const VerificationPending = ({ onContinue }) => {

    // ⏳ AUTO-MOVE TO NEXT STEP AFTER 5 SECONDS
    useEffect(() => {
        const timer = setTimeout(() => {
            onContinue();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onContinue]);

    return (
        <div className="w-full flex justify-center mt-10 px-4 font-poppins">
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-[650px] max-w-4xl bg-white rounded-2xl shadow-lg p-16 text-center relative overflow-hidden"
            >
                {/* BACKGROUND GLOW */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br 
                    from-transparent-[#f5faff] opacity-60 blur-[90px]">
                </div>

                {/* GIF ICON */}
                <div className="relative z-10 flex justify-center mb-3">
                    <img 
                        src="/assets/loading.gif"
                        alt="Verifying"
                        className="w-30 h-30"
                    />
                </div>

                {/* TITLE */}
                <h2 className="relative z-10 text-[32px] font-bold text-[#000066] mb-3">
                    We’re verifying your documents
                </h2>

                {/* SUBTEXT */}
                <p className="relative z-10 text-gray-500 text-[15px] max-w-xl mx-auto leading-relaxed">
                    We have received your documents. It might <br />
                    take up to <span className="font-semibold">3–4 business days</span> 
                    to complete verification process.
                </p>
            </motion.div>
        </div>
    );
};

export default VerificationPending;
