// src/components/setup/SetupStepper.jsx
import { motion } from "framer-motion";
import { Check, Building2, Users, ClipboardCheck } from "lucide-react";

/**
 * SetupStepper
 * 3-step progress indicator for the setup wizard
 * 
 * Steps:
 * 1. Create Branches
 * 2. Add Users
 * 3. Review & Finish
 */

const steps = [
  {
    id: 1,
    title: "Branches",
    shortTitle: "Branches",
    icon: Building2,
  },
  {
    id: 2,
    title: "Users",
    shortTitle: "Users",
    icon: Users,
  },
  {
    id: 3,
    title: "Review",
    shortTitle: "Review",
    icon: ClipboardCheck,
  },
];

const SetupStepper = ({ currentStep = 1 }) => {
  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLast = index === steps.length - 1;

          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? "#10b981"
                      : isActive
                      ? "#000060"
                      : "#e5e7eb",
                  }}
                  transition={{ duration: 0.2 }}
                  className={`
                    relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    transition-shadow duration-200
                    ${isActive ? "shadow-lg shadow-[#000060]/30" : ""}
                    ${isCompleted ? "shadow-md shadow-emerald-500/30" : ""}
                  `}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check size={20} className="text-white" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <StepIcon
                      size={18}
                      className={isActive ? "text-white" : "text-gray-400"}
                    />
                  )}

                  {/* Pulse animation for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#000060]"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </motion.div>

                {/* Step Label */}
                <motion.span
                  initial={false}
                  animate={{
                    color: isActive
                      ? "#000060"
                      : isCompleted
                      ? "#10b981"
                      : "#9ca3af",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  className="mt-2 text-xs sm:text-sm text-center whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.shortTitle}</span>
                </motion.span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-gray-200 relative overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 bg-emerald-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SetupStepper;