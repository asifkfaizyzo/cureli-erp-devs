// src/pages/settings/components/ChangePhoneModal.jsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import {
  initiatePhoneVerifyOld,
  initiatePhoneNew,
  verifyPhoneNew,
} from "../../../../api/profile";

/**
 * ChangePhoneModal
 * Multi-step modal for changing phone number
 * Step 1: Send OTP to old phone & verify
 * Step 2: Enter new phone & send OTP
 * Step 3: Verify new phone OTP
 */
const ChangePhoneModal = ({ currentPhone, onClose }) => {
  // Step state: 1 = verify old, 2 = enter new + verify, 3 = verify new
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    old_otp: "",
    new_phone: "",
    new_otp: "",
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  // OTP timer state
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Format phone for display
  const formatPhone = (phone) => {
    if (!phone) return "Not set";
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  };

  // Start countdown timer
  const startCountdown = (seconds = 30) => {
    setCountdown(seconds);
    setCanResend(false);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && step > 0) {
      setCanResend(true);
    }
  }, [countdown, step]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  // Step 1: Send OTP to old phone
  const handleSendOldOtp = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await initiatePhoneVerifyOld();
      const timeout = response.data?.data?.timeout || 300;
      startCountdown(Math.min(30, timeout));
      // Stay on step 1 for OTP entry
    } catch (err) {
      console.error("Send old OTP error:", err);
      const message = err.response?.data?.message || "Failed to send OTP";
      
      if (err.response?.status === 429) {
        const waitTime = err.response?.data?.data?.waitTime || 30;
        startCountdown(waitTime);
        setSubmitError(`Please wait ${waitTime} seconds before requesting again`);
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Verify old phone OTP + Send OTP to new phone
  const handleVerifyOldAndSendNew = async () => {
    if (!formData.old_otp || formData.old_otp.length < 4) {
      setErrors({ old_otp: "Please enter the OTP" });
      return;
    }

    if (!formData.new_phone) {
      setErrors({ new_phone: "New phone number is required" });
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.new_phone)) {
      setErrors({ new_phone: "Phone must be 10 digits" });
      return;
    }

    if (formData.new_phone === currentPhone) {
      setErrors({ new_phone: "New phone is same as current phone" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await initiatePhoneNew({
        otp: formData.old_otp,
        new_phone: formData.new_phone,
      });

      const timeout = response.data?.data?.timeout || 300;
      startCountdown(Math.min(30, timeout));
      setStep(2);
    } catch (err) {
      console.error("Verify old OTP error:", err);
      const message = err.response?.data?.message || "Failed to verify OTP";
      
      if (message.toLowerCase().includes("otp")) {
        setErrors({ old_otp: message });
      } else if (message.toLowerCase().includes("phone")) {
        setErrors({ new_phone: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify new phone OTP
  const handleVerifyNewOtp = async () => {
    if (!formData.new_otp || formData.new_otp.length < 4) {
      setErrors({ new_otp: "Please enter the OTP" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await verifyPhoneNew({ otp: formData.new_otp });
      setSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onClose(true);
      }, 2000);
    } catch (err) {
      console.error("Verify new OTP error:", err);
      const message = err.response?.data?.message || "Failed to verify OTP";
      
      if (message.toLowerCase().includes("otp") || message.toLowerCase().includes("expired")) {
        setErrors({ new_otp: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP for current step
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (step === 1) {
        await initiatePhoneVerifyOld();
      } else {
        // For step 2, we need to re-send to new phone
        // This requires re-verifying old OTP which we can't do
        // So we restart the flow
        setStep(1);
        setFormData({ old_otp: "", new_phone: formData.new_phone, new_otp: "" });
        await initiatePhoneVerifyOld();
      }
      startCountdown(30);
    } catch (err) {
      console.error("Resend OTP error:", err);
      if (err.response?.status === 429) {
        const waitTime = err.response?.data?.data?.waitTime || 30;
        startCountdown(waitTime);
      } else {
        setSubmitError(err.response?.data?.message || "Failed to resend OTP");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel and go back
  const handleBack = () => {
    if (step === 2) {
      // Going back means restarting the flow
      setStep(1);
      setFormData((prev) => ({ ...prev, old_otp: "", new_otp: "" }));
      setErrors({});
      setSubmitError(null);
    }
  };

  // Initial OTP send on mount
  useEffect(() => {
    handleSendOldOtp();
  }, []);

  // Success State
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Phone Changed!</h3>
          <p className="text-gray-500">
            Your phone has been updated to <strong>{formatPhone(formData.new_phone)}</strong>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">Change Phone Number</h2>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-1.5 rounded-full ${
                step >= 1 ? "bg-[#000060]" : "bg-gray-200"
              }`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full ${
                step >= 2 ? "bg-[#000060]" : "bg-gray-200"
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {step === 1 ? "Verify current phone" : "Verify new phone"}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Verify Old Phone + Enter New Phone */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Current Phone Display */}
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-[#000060]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone size={28} className="text-[#000060]" />
                  </div>
                  <p className="text-sm text-gray-600">
                    We've sent a verification code to your current phone
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatPhone(currentPhone)}
                  </p>
                </div>

                {/* Old OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.old_otp}
                    onChange={(e) =>
                      handleChange("old_otp", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter OTP"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.old_otp
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                    autoFocus
                  />
                  {errors.old_otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">{errors.old_otp}</p>
                  )}

                  {/* Resend OTP */}
                  <div className="flex justify-center mt-2">
                    {countdown > 0 ? (
                      <p className="text-xs text-gray-500">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 text-xs text-[#000060] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                {/* New Phone Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.new_phone}
                      onChange={(e) =>
                        handleChange("new_phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full pl-12 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.new_phone
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                    />
                  </div>
                  {errors.new_phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.new_phone}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Verify New Phone */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone size={28} className="text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    We've sent a verification code to your new phone
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatPhone(formData.new_phone)}
                  </p>
                </div>

                {/* New OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.new_otp}
                    onChange={(e) =>
                      handleChange("new_otp", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter OTP"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.new_otp
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                    autoFocus
                  />
                  {errors.new_otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">{errors.new_otp}</p>
                  )}

                  {/* Resend Info */}
                  <div className="flex justify-center mt-2">
                    {countdown > 0 ? (
                      <p className="text-xs text-gray-500">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 text-xs text-[#000060] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        Start Over (Resend to old phone)
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Error */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4"
            >
              <AlertCircle size={16} />
              {submitError}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={step === 1 ? handleVerifyOldAndSendNew : handleVerifyNewOtp}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {step === 1 ? "Verifying..." : "Confirming..."}
              </>
            ) : step === 1 ? (
              <>
                Verify & Continue
                <ArrowRight size={16} />
              </>
            ) : (
              "Confirm New Phone"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePhoneModal;