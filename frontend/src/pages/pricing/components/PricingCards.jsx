import { useState, useEffect } from "react";
import AOS from "aos";
import { Check } from "lucide-react";

const PricingCards = () => {
  const [billing, setBilling] = useState("monthly");

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  const plans = [
    {
      name: "Basic Plan",
      price: "FREE",
      period: "/month",
      description: "Get started with our Basic plan kickstart your Cureli journey.",
      features: [
        "Only 2 users",
        "Single Branch",
      ],
    },
    {
      name: "Professional",
      price: "₹1,499",
      period: "/month",
      description: "Perfect for growing businesses with advanced features.",
      features: [
        "Up to 6 users",
        "Two Branch",
      ],
    },
    {
      name: "Enterprise",
      price: "₹2,999",
      period: "/month",
      description: "Complete solution for large-scale operations.",
      features: [
        "12 Users",
        "Three Branches",
      ],
    },
    {
      name: "Custom",
      price: "Contact",
      period: "us",
      description: "Tailored solutions for your unique business needs.",
      features: [
        "Custom users",
        "Custom Branches",
        "Custom Pricing",
      ],
    },
  ];

  return (
    <section className="w-full bg-white pt-2 xs:pt-3 sm:pt-4 pb-12 sm:pb-14 md:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        
        {/* Toggle */}
        <div className="flex justify-center mt-4 xs:mt-5 sm:mt-6 mb-8 sm:mb-10 md:mb-12" data-aos="fade-up">
          <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-inner">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 xs:px-5 sm:px-6 py-2 rounded-full text-xs xs:text-sm font-medium transition-all duration-300 ${
                billing === "monthly"
                  ? "bg-white shadow text-[#05015A]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 xs:px-5 sm:px-6 py-2 rounded-full text-xs xs:text-sm font-medium transition-all duration-300 ${
                billing === "yearly"
                  ? "bg-white shadow text-[#05015A]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
};

const PricingCard = ({ plan, index }) => {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 100}
      className="
        group relative flex flex-col 
        p-5 xs:p-6 sm:p-7 md:p-8 lg:p-10
        rounded-xl xs:rounded-2xl sm:rounded-3xl
        bg-gradient-to-b from-[#B8A8E8]/60 to-[#E8DFF5]/40
        backdrop-blur-sm 
        border border-white/40 
        shadow-lg 
        hover:shadow-2xl 
        transition-all duration-500 ease-out 
        hover:scale-[1.04] hover:-translate-y-3
        min-h-[380px] xs:min-h-[400px] sm:min-h-[420px] md:min-h-[450px] lg:min-h-[480px]
        cursor-pointer
      "
    >
      {/* Name */}
      <h3 className="
        text-base xs:text-lg sm:text-xl lg:text-2xl 
        font-bold text-[#05015A] 
        mb-3 xs:mb-4 
        group-hover:text-[#6B46C1] 
        transition-colors duration-300
      ">
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-3 xs:mb-4">
        <span className="
          text-lg xs:text-xl sm:text-2xl 
          font-bold text-[#05015A] 
          group-hover:text-[#6B46C1] 
          transition-colors duration-300
        ">
          {plan.price}
        </span>
        <span className="text-xs sm:text-sm text-gray-700 ml-1">
          {plan.period}
        </span>
      </div>

      {/* Description */}
      <p className="
        text-xs sm:text-sm 
        text-gray-700 
        leading-relaxed 
        min-h-[40px] xs:min-h-[45px] sm:min-h-[50px]
        mb-4 xs:mb-5 
        group-hover:text-gray-800 
        transition-colors duration-300
      ">
        {plan.description}
      </p>

      {/* Features */}
      <ul className="space-y-1.5 xs:space-y-2 sm:space-y-3 mb-5 xs:mb-6 flex-grow">
        {plan.features.map((feature, i) => (
          <li
            key={i}
            className="
              flex items-start gap-2 
              group-hover:translate-x-1 
              transition-transform duration-300
            "
          >
            <Check
              className="
                w-3.5 h-3.5 xs:w-4 xs:h-4
                text-[#05015A] 
                group-hover:text-[#6B46C1] 
                group-hover:scale-110 
                transition-all duration-300
                flex-shrink-0
                mt-0.5
              "
            />
            <span className="
              text-xs sm:text-sm 
              text-gray-800 
              group-hover:text-gray-900 
              transition-colors duration-300
            ">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        className="
          w-full py-2.5 xs:py-3 bg-[#05015A] text-white 
          font-semibold text-xs xs:text-sm sm:text-base 
          rounded-lg hover:bg-[#6B46C1] 
          transition-all duration-300 shadow-md 
          hover:shadow-xl mt-auto hover:scale-[1.02]
        "
      >
        Get Plan
      </button>

      {/* Glow Effect */}
      <div
        className="
          absolute inset-0 rounded-xl xs:rounded-2xl sm:rounded-3xl
          bg-gradient-to-br from-[#6B46C1]/0 to-[#6B46C1]/0 
          group-hover:from-[#6B46C1]/10 
          group-hover:to-[#6B46C1]/5 
          transition-all duration-500 pointer-events-none
        "
      ></div>
    </div>
  );
};

export default PricingCards;
