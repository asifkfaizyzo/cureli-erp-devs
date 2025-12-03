import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const CustomStepper = ({ currentStep = 1 }) => {
  // 1. Define the structure of your stepper here
  const stepsConfig = [
    { id: 1, type: "main", label: "Basic Details" },
    { id: 2, type: "sub" },
    { id: 3, type: "sub" },
    { id: 4, type: "main", label: "Business Details" },
    { id: 5, type: "sub" },
    { id: 6, type: "sub" },
    { id: 7, type: "sub" },
    { id: 8, type: "sub" },
    { id: 9, type: "sub" },
    { id: 10, type: "sub" },
    { id: 11, type: "sub" },
    { id: 12, type: "sub" },
    { id: 13, type: "main", label: "Pending" },
    { id: 14, type: "main", label: "Successfull" },
  ];

  // Colors
  const COLOR_NAVY = "#000066";
  const COLOR_GRAY = "#e5e7eb";
  const COLOR_ORANGE = "#f97316";

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* 🔵 Heading — Smaller Size */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-lg font-semibold mb-2 tracking-wide"
      >
        <span className="text-gray-500">Onboarding:</span>{" "}
        <span className="text-[#000066] font-bold">Cureli</span>
      </motion.h1>

      {/* Container — Reduced max-width and padding */}
      <div className="flex items-center w-full max-w-3xl px-2 sm:px-4">
        {stepsConfig.map((step, index) => {
          
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPendingAction = step.label === "Pending" && isCurrent; 
          const isLastStep = index === stepsConfig.length - 1;

          return (
            <React.Fragment key={step.id}>
              
              {/* --- RENDER THE NODE --- */}
              <div className="relative flex flex-col items-center justify-center">
                
                {/* 1. SMALL DOT (Reduced to 1.5 (6px)) */}
                {step.type === "sub" && (
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted || isCurrent ? COLOR_NAVY : COLOR_GRAY,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-1.5 h-1.5 rounded-full z-10"
                  />
                )}

                {/* 2. BIG CIRCLE (Reduced to w-6 h-6 (24px)) */}
                {step.type === "main" && (
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted ? COLOR_NAVY : "#fff",
                      borderColor: isPendingAction
                        ? COLOR_ORANGE
                        : isCompleted || isCurrent
                        ? COLOR_NAVY
                        : "#d1d5db",
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center z-10 
                      ${isCompleted ? "text-white" : ""} 
                      ${isPendingAction ? "text-orange-500" : "text-gray-400"}`}
                  >
                    <AnimatePresence mode="wait">
                      {/* Checkmark (Smaller) */}
                      {isCompleted && (
                        <motion.svg
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-3 h-3 font-bold"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}

                      {/* Pending Warning (!) */}
                      {isPendingAction && (
                        <motion.span
                          key="warning"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-bold text-[10px]"
                        >
                          !
                        </motion.span>
                      )}

                      {/* Active Dot (Smaller) */}
                      {isCurrent && !isPendingAction && (
                        <motion.div
                          key="active-dot"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 bg-[#000066] rounded-full"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* LABEL (Moved closer via top-7, smaller font) */}
                {step.type === "main" && (
                  <motion.div
                    animate={{
                        color: isCurrent || isCompleted ? COLOR_NAVY : "#9ca3af"
                    }}
                    className={`absolute top-7 text-[10px] font-bold whitespace-nowrap 
                      ${isPendingAction ? "!text-orange-500" : ""}`}
                  >
                    {step.label}
                  </motion.div>
                )}
              </div>

              {/* --- LINE (Thinner and tighter margins) --- */}
              {!isLastStep && (
                <div className="flex-1 mx-0.5 h-[2px] bg-gray-200 relative rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="h-full bg-[#000066]"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CustomStepper;





// import React from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const CustomStepper = ({ currentStep = 1 }) => {
//   // 1. Define the structure of your stepper here
//   // type: 'main' (Big Circle) or 'sub' (Small Dot)
//   const stepsConfig = [
//     { id: 1, type: "main", label: "Basic Details" },
//     { id: 2, type: "sub" },
//     { id: 3, type: "sub" },
//     { id: 4, type: "main", label: "Business Details" },
//     { id: 5, type: "sub" },
//     { id: 6, type: "sub" },
//     { id: 7, type: "sub" },
//     { id: 8, type: "sub" },
//     { id: 9, type: "sub" },
//     { id: 10, type: "sub" },
//     { id: 11, type: "sub" },
//     { id: 12, type: "sub" },
//     { id: 13, type: "main", label: "Pending" }, // Special Orange State
//     { id: 14, type: "main", label: "Successfull" },
//   ];

//   // Colors
//   const COLOR_NAVY = "#000066";
//   const COLOR_GRAY = "#e5e7eb"; // Tailwind gray-200
//   const COLOR_ORANGE = "#f97316";

//   return (
//     <div className="w-full flex flex-col items-center justify-center">
//          {/* 🔵 Heading — Matches Screenshot Exactly */}
//       <motion.h1
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="text-[26px] font-semibold mb-1 tracking-wide"
//       >
//         <span className="text-gray-500">Onboarding:</span>{" "}
//         <span className="text-[#000066] font-bold">Cureli</span>
//       </motion.h1>
//       {/* Container for the Stepper */}
//       <div className="flex items-center w-full max-w-4xl px-6">
//         {stepsConfig.map((step, index) => {
          
//           // LOGIC: determine state based on currentStep prop
//           const isCompleted = currentStep > step.id;
//           const isCurrent = currentStep === step.id;
//           const isPendingAction = step.label === "Pending" && isCurrent; // Special case for the Orange '!'
          
//           // Is this the last item? (Don't draw a line after the last one)
//           const isLastStep = index === stepsConfig.length - 1;

//           return (
//             <React.Fragment key={step.id}>
              
//               {/* --- RENDER THE NODE (Big or Small) --- */}
//               <div className="relative flex flex-col items-center justify-center">
                
//                 {/* 1. SMALL DOT LOGIC */}
//                 {step.type === "sub" && (
//                   <motion.div
//                     animate={{
//                       backgroundColor: isCompleted || isCurrent ? COLOR_NAVY : COLOR_GRAY,
//                     }}
//                     transition={{ duration: 0.3 }}
//                     className="w-3 h-3 rounded-full z-10"
//                   />
//                 )}

//                 {/* 2. BIG CIRCLE LOGIC */}
//                 {step.type === "main" && (
//                   <motion.div
//                     animate={{
//                       backgroundColor: isCompleted ? COLOR_NAVY : "#fff",
//                       borderColor: isPendingAction
//                         ? COLOR_ORANGE
//                         : isCompleted || isCurrent
//                         ? COLOR_NAVY
//                         : "#d1d5db", // gray-300
//                       scale: isCurrent ? 1.1 : 1,
//                     }}
//                     transition={{ duration: 0.3 }}
//                     className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center z-10 
//                       ${isCompleted ? "text-white" : ""} 
//                       ${isPendingAction ? "text-orange-500" : "text-gray-400"}`}
//                   >
//                     <AnimatePresence mode="wait">
//                       {/* State: Completed (Checkmark) */}
//                       {isCompleted && (
//                         <motion.svg
//                           key="check"
//                           initial={{ scale: 0 }}
//                           animate={{ scale: 1 }}
//                           exit={{ scale: 0 }}
//                           className="w-4 h-4 font-bold"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         >
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                         </motion.svg>
//                       )}

//                       {/* State: Pending Warning (!) */}
//                       {isPendingAction && (
//                         <motion.span
//                           key="warning"
//                           initial={{ opacity: 0 }}
//                           animate={{ opacity: 1 }}
//                           className="font-bold text-sm"
//                         >
//                           !
//                         </motion.span>
//                       )}

//                       {/* State: Current Active (Inner Dot) */}
//                       {isCurrent && !isPendingAction && (
//                         <motion.div
//                           key="active-dot"
//                           initial={{ scale: 0 }}
//                           animate={{ scale: 1 }}
//                           className="w-2.5 h-2.5 bg-[#000066] rounded-full"
//                         />
//                       )}
//                     </AnimatePresence>
//                   </motion.div>
//                 )}

//                 {/* LABEL (Only for Main steps) */}
//                 {step.type === "main" && (
//                   <motion.div
//                     animate={{
//                         color: isCurrent || isCompleted ? COLOR_NAVY : "#9ca3af"
//                     }}
//                     className={`absolute top-10 text-[10px] sm:text-xs font-bold whitespace-nowrap 
//                       ${isPendingAction ? "!text-orange-500" : ""}`}
//                   >
//                     {step.label}
//                   </motion.div>
//                 )}
//               </div>

//               {/* --- RENDER THE CONNECTING LINE --- */}
//               {!isLastStep && (
//                 <div className="flex-1 mx-1 sm:mx-2 h-[3px] bg-gray-200 relative rounded-full overflow-hidden">
//                    {/* The colored fill animation */}
//                   <motion.div
//                     initial={{ width: "0%" }}
//                     animate={{ width: isCompleted ? "100%" : "0%" }}
//                     transition={{ duration: 0.4, ease: "easeInOut" }}
//                     className="h-full bg-[#000066]"
//                   />
//                 </div>
//               )}
//             </React.Fragment>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default CustomStepper;
