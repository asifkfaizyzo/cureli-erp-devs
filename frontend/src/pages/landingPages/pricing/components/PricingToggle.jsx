import { useState } from "react";

const PricingToggle = ({ onChange }) => {
  const [billing, setBilling] = useState("monthly");

  const handleToggle = (value) => {
    setBilling(value);
    if (onChange) onChange(value); // Send selected value to parent
  };

  return (
    <div className="flex justify-center mt-6" data-aos="fade-up">
      <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-inner">
        
        {/* Monthly */}
        <button
          onClick={() => handleToggle("monthly")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all
            ${
              billing === "monthly"
                ? "bg-white shadow text-[#05015A]"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          Monthly
        </button>

        {/* Yearly */}
        <button
          onClick={() => handleToggle("yearly")}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all
            ${
              billing === "yearly"
                ? "bg-white shadow text-[#05015A]"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          Yearly
        </button>

      </div>
    </div>
  );
};

export default PricingToggle;
