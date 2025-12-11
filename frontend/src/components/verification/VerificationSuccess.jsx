// src/components/verification/VerificationSuccess.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Package, Receipt, BarChart3 } from "lucide-react";
import { completeOnboarding } from "../../api/auth";
import { getMySubscription } from "../../api/subscription";

// Compact animated checkmark
const AnimatedCheckmark = () => {
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-3 border-emerald-200"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-400"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute inset-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      />

      {/* Checkmark */}
      <motion.svg
        className="absolute inset-0 w-full h-full p-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <motion.path
          d="M4 12.5L9.5 18L20 6"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        />
      </motion.svg>

      {/* Sparkles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
          style={{ top: "50%", left: "50%" }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * 90 * Math.PI) / 180) * 40,
            y: Math.sin((i * 90 * Math.PI) / 180) * 40,
          }}
          transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
        />
      ))}
    </div>
  );
};

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      const subRes = await getMySubscription();
      const payload = subRes.data?.data;
      const hasActive = payload?.has_active_subscription || payload?.current_plan || false;
      navigate(hasActive ? "/dashboard" : "/plan-selection");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      navigate("/plan-selection");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Package, title: "Inventory", desc: "Track stock levels" },
    { icon: Receipt, title: "Invoices", desc: "GST billing" },
    { icon: BarChart3, title: "Analytics", desc: "Business insights" },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center px-4 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0px 4px 30px rgba(0,0,0,0.08)" }}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#000060] to-emerald-400" />

        <div className="flex flex-col lg:flex-row items-center gap-6 p-6 lg:p-8">
          {/* Left Section - Checkmark & Title */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:flex-1">
            <div className="flex items-center gap-4 mb-3">
              <AnimatedCheckmark />
              
              <div>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-2"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700">Verified</span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-2xl lg:text-3xl font-bold text-[#000060]"
                >
                  Welcome to Cureli
                </motion.h2>
              </div>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-gray-500 text-sm max-w-sm"
            >
              Your pharmacy is verified. Full access to all features is now available.
            </motion.p>

            {/* CTA Button - Desktop */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              onClick={handleGetStarted}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`
                hidden lg:flex items-center justify-center gap-2 mt-4 px-6 py-2.5 rounded-xl font-semibold text-sm
                transition-all duration-200
                ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#000060] hover:bg-[#000080] text-white shadow-lg shadow-[#000060]/20"
                }
              `}
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Setting up...
                </>
              ) : (
                <>
                  Get Started
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={16} />
                  </motion.div>
                </>
              )}
            </motion.button>
          </div>

          {/* Vertical Divider - Desktop */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="hidden lg:block w-px h-32 bg-gradient-to-b from-transparent via-gray-200 to-transparent"
          />

          {/* Horizontal Divider - Mobile */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="lg:hidden w-full max-w-xs h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
          />

          {/* Right Section - Features */}
          {showFeatures && (
            <div className="flex flex-row lg:flex-col gap-3 lg:gap-2 lg:flex-1">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ x: -3, backgroundColor: "#f8fafc" }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-default transition-colors flex-1 lg:flex-none"
                >
                  <div className="w-9 h-9 bg-[#000060]/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon size={18} className="text-[#000060]" />
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="font-medium text-gray-800 text-sm leading-tight">{feature.title}</p>
                    <p className="text-xs text-gray-400 leading-tight">{feature.desc}</p>
                  </div>
                  <div className="sm:hidden">
                    <p className="font-medium text-gray-800 text-xs">{feature.title}</p>
                  </div>
                  <Check size={14} className="text-emerald-500 flex-shrink-0 ml-auto hidden sm:block" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button - Mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="lg:hidden px-6 pb-6"
        >
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
              transition-all duration-200
              ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#000060] hover:bg-[#000080] text-white shadow-lg shadow-[#000060]/20"
              }
            `}
          >
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Setting up...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerificationSuccess;