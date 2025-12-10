// src/components/verification/VerificationSuccess.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Package, Receipt, BarChart3 } from "lucide-react";
import { completeOnboarding } from "../../api/auth";
import { getMySubscription } from "../../api/subscription";

// Animated checkmark component
const AnimatedCheckmark = () => {
  return (
    <div className="relative w-32 h-32">
      {/* Outer ring pulse */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-emerald-200"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Success ring animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-emerald-400"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      />

      {/* Checkmark SVG with draw animation */}
      <motion.svg
        className="absolute inset-0 w-full h-full p-8"
        viewBox="0 0 24 24"
        fill="none"
        initial="hidden"
        animate="visible"
      >
        <motion.path
          d="M4 12.5L9.5 18L20 6"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        />
      </motion.svg>

      {/* Sparkle particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-emerald-400 rounded-full"
          style={{
            top: "50%",
            left: "50%",
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * 60 * Math.PI) / 180) * 60,
            y: Math.sin((i * 60 * Math.PI) / 180) * 60,
          }}
          transition={{ duration: 0.8, delay: 0.7 + i * 0.05 }}
        />
      ))}
    </div>
  );
};

// Floating particles background
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#000060]/10 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
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
    // Delay showing features for staggered effect
    const timer = setTimeout(() => setShowFeatures(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = async () => {
    setLoading(true);

    try {
      await completeOnboarding();

      const subRes = await getMySubscription();
      const payload = subRes.data?.data;

      const hasActive =
        payload?.has_active_subscription || payload?.current_plan || false;

      navigate(hasActive ? "/dashboard" : "/plan-selection");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      navigate("/plan-selection");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Package,
      title: "Manage Inventory",
      desc: "Track stock levels in real-time",
    },
    {
      icon: Receipt,
      title: "Generate Invoices",
      desc: "Create professional GST invoices",
    },
    {
      icon: BarChart3,
      title: "Business Analytics",
      desc: "Insights to grow your business",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center px-4 font-poppins">
      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl flex flex-col items-center py-16 px-8 overflow-hidden"
        style={{ boxShadow: "0px 4px 35px rgba(0,0,0,0.08)" }}
      >
        {/* Background particles */}
        <FloatingParticles />

        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#000060] to-emerald-400" />

        {/* ANIMATED CHECKMARK */}
        <AnimatedCheckmark />

        {/* VERIFIED BADGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2 mt-6 mb-4"
        >
          <motion.div
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">
              Verified & Approved
            </span>
          </motion.div>
        </motion.div>

        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-[32px] font-bold text-[#000060] text-center"
        >
          Welcome to Cureli
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-gray-600 text-center mt-3 max-w-md"
        >
          Your pharmacy has been successfully verified. You now have full access
          to all features of our platform.
        </motion.p>

        {/* DIVIDER */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="w-full max-w-sm h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8"
        />

        {/* FEATURES - Staggered animation */}
        {showFeatures && (
          <div className="w-full max-w-lg space-y-3">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                whileHover={{ x: 5, backgroundColor: "#f8fafc" }}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 cursor-default transition-colors"
              >
                <div className="w-12 h-12 bg-[#000060]/5 rounded-xl flex items-center justify-center">
                  <feature.icon size={22} className="text-[#000060]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{feature.title}</p>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + idx * 0.1 }}
                >
                  <Check size={20} className="text-emerald-500" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* GET STARTED BUTTON */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        onClick={handleGetStarted}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className={`
          w-full max-w-md py-4 rounded-xl font-semibold mt-6
          flex items-center justify-center gap-2
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
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Setting up your account...
          </>
        ) : (
          <>
            Get Started
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight size={20} />
            </motion.div>
          </>
        )}
      </motion.button>

      {/* HELP TEXT */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-gray-400 text-xs text-center mt-4"
      >
        You can always access settings and help from your dashboard
      </motion.p>
    </div>
  );
};

export default VerificationSuccess;