import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const OnboardStepper = ({ progressStep }) => {
    // Dot Steps (2 basic + 7 business)
    const dotSteps = [1, 3, 4, 5, 6, 7, 8, 9, 10];

    /* ---------------- Small Dot ---------------- */
    const SmallDot = ({ filled }) => (
        <motion.div
            animate={{
                backgroundColor: filled ? "#000066" : "#d1d5db",
                opacity: filled ? 1 : 0.4,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-3 h-3 rounded-full"
            style={{ marginLeft: -2, marginRight: -2, marginTop: -20 }}
        />
    );

    /* ---------------- Line ---------------- */
    const Line = ({ active }) => (
        <motion.div
            animate={{
                backgroundColor: active ? "#000066" : "#d1d5db",
                opacity: active ? 1 : 0.3,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="h-[3px] flex-1"
            style={{ marginLeft: -35, marginRight: -35, marginTop: -20 }}
        />
    );

    /* ---------------- Big Circle ---------------- */
    const BigCircle = ({ active, completed, pending, label }) => (
        <div className="flex flex-col items-center z-10">
            <motion.div
                animate={{
                    backgroundColor: completed ? "#000066" : "white",
                    borderColor: pending
                        ? "#f97316"
                        : active || completed
                        ? "#000066"
                        : "#9ca3af",
                    scale: active ? 1.05 : 1,
                    opacity: active || completed ? 1 : 0.6,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-7 h-7 rounded-full flex items-center justify-center border-[3px]"
            >
                {/* ✓ Checkmark */}
                <AnimatePresence>
                    {completed && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-white font-bold text-[12px]"
                        >
                            ✓
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Pending ! */}
                {pending && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-orange-500 font-bold text-[12px]"
                    >
                        !
                    </motion.span>
                )}

                {/* Active pulsing dot */}
                {active && !completed && !pending && (
                    <motion.div
                        className="w-2 h-2 rounded-full bg-[#000066]"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                )}
            </motion.div>

            {/* Label */}
            <motion.p
                animate={{
                    color: active || completed ? "#000066" : "#6b7280",
                }}
                transition={{ duration: 0.3 }}
                className="mt-2 text-xs font-medium"
            >
                {label}
            </motion.p>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full mt-4" style={{ marginTop: -10 }}>
            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-semibold text-gray-500 mb-6"
            >
                Onboarding: <span className="text-[#000066] font-bold">Cureli</span>
            </motion.h1>

            {/* STEP FLOW */}
            <div className="flex items-center w-full max-w-3xl">

                {/* BASIC ••• */}
                <BigCircle
                    active={progressStep >= 0 && progressStep < 4}
                    completed={progressStep >= 4}
                    label="Basic Details"
                />

                {/* BASIC DOTS */}
                {dotSteps.slice(0, 2).map((step, i) => (
                    <React.Fragment key={`basic-${i}`}>
                        <Line active={progressStep >= step} />
                        <SmallDot filled={progressStep >= step} />
                    </React.Fragment>
                ))}

                <Line active={progressStep >= 4} />

                {/* BUSINESS ••• */}
                <BigCircle
                    active={progressStep >= 4 && progressStep < 12}
                    completed={progressStep >= 12}
                    label="Business Details"
                />

                {/* BUSINESS DOTS */}
                {dotSteps.slice(2).map((step, i) => (
                    <React.Fragment key={`bus-${i}`}>
                        <Line active={progressStep >= step} />
                        <SmallDot filled={progressStep >= step} />
                    </React.Fragment>
                ))}

                <Line active={progressStep >= 12} />

                {/* PENDING */}
                <BigCircle
                    pending={progressStep === 12}
                    completed={progressStep === 13}
                    label="Pending"
                />

                <Line active={progressStep === 13} />

                {/* SUCCESS */}
                <BigCircle
                    active={progressStep === 13}
                    completed={progressStep === 13}
                    label="Successfull"
                />
            </div>
        </div>
    );
};

export default OnboardStepper;
