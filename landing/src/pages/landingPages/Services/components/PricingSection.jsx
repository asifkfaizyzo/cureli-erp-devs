// src/pages/landingPages/services/components/PricingSection.jsx

import { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Check, Users, Building2, CircleCheck } from "lucide-react";

const PricingSection = () => {
  const [billing, setBilling] = useState("yearly");

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: "ease-out-cubic" });
  }, []);

  const perks = [
    "Switch Plans Anytime",
    "No Credit Card Required",
    "Cancel Anytime",
  ];

  const pricingData = {
    free: { monthly: 0, yearly: 0 },
    starter: { monthly: 499, yearly: 4990 },
    professional: { monthly: 1499, yearly: 14990 },
    custom: { monthly: null, yearly: null },
  };

  const plans = [
    {
      id: "free",
      name: "Free Trial",
      users: "2 Users",
      branches: "1 Branch",
      description: "Try Cureli free for 14 days",
      features: [
        "Up to 2 users",
        "Single branch",
        "Basic support",
        "Email assistance",
      ],
      button: "Start Free",
      color: "primary",
    },
    {
      id: "starter",
      name: "Starter",
      users: "5 Users",
      branches: "2 Branches",
      description: "Ideal for small pharmacies",
      features: [
        "Up to 5 users",
        "Up to 2 branches",
        "Priority support",
        "All core features",
      ],
      button: "Select Plan",
      color: "primary",
    },
    {
      id: "professional",
      name: "Professional",
      users: "15 Users",
      branches: "5 Branches",
      description: "Best for growing pharmacies",
      features: [
        "Up to 15 users",
        "Up to 5 branches",
        "Priority 24/7 support",
        "All core features",
      ],
      button: "Select Plan",
      color: "primary",
      popular: true,
    },
    {
      id: "custom",
      name: "Custom Plan",
      users: "Flexible",
      branches: "Flexible",
      description: "For large businesses",
      features: [
        "Unlimited users & branches",
        "Priority 24/7 support",
        "Custom integrations",
        "Dedicated account manager",
      ],
      button: "Contact Sales",
      color: "custom",
    },
  ];

  const getPrice = (planId) => {
    const data = pricingData[planId];

    if (data.monthly === null) {
      return { display: "Custom", period: "", subtext: "Contact us" };
    }

    if (data.monthly === 0) {
      return { display: "FREE", period: "", subtext: "14 days" };
    }

    if (billing === "yearly") {
      const monthlyEquivalent = Math.round(data.yearly / 12);
      return {
        display: `₹${monthlyEquivalent.toLocaleString("en-IN")}`,
        period: "/ month",
        subtext: `Billed ₹${data.yearly.toLocaleString("en-IN")}/year`,
      };
    }

    return {
      display: `₹${data.monthly.toLocaleString("en-IN")}`,
      period: "/ month",
      subtext: "Billed monthly",
    };
  };

  return (
    <section className="w-full bg-[#F5F7FA] pt-24 xs:pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          {/* Main Heading */}
          <h1
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-[#05015A] max-w-4xl mx-auto leading-tight"
            data-aos="fade-up"
          >
            One simple plan for a smarter, safer pharmacy
          </h1>

          {/* Subtitle */}
          <p
            className="mt-4 text-gray-500 text-sm sm:text-base max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="50"
          >
            Choose the perfect plan that fits your pharmacy's needs. Scale as you grow.
          </p>

          {/* Perks */}
          <div
            className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 md:gap-6 text-gray-600 mt-6 sm:mt-8"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {perks.map((perk, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#05015A]/20 transition-all duration-300 cursor-default"
              >
                <CircleCheck
                  size={18}
                  className="text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xs xs:text-sm font-medium group-hover:text-[#05015A] transition-colors duration-300">
                  {perk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* TOGGLE */}
        {/* ============================================ */}
        <div className="flex justify-center mb-10 sm:mb-12" data-aos="fade-up">
          <div className="bg-white rounded-xl p-1 flex relative shadow-sm border border-gray-200">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#05015A] rounded-lg transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                billing === "yearly"
                  ? "translate-x-[calc(100%+4px)]"
                  : "translate-x-0"
              }`}
            />

            <button
              onClick={() => setBilling("monthly")}
              className={`relative z-10 px-6 sm:px-8 py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 ${
                billing === "monthly" ? "text-white" : "text-gray-600"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("yearly")}
              className={`relative z-10 px-6 sm:px-8 py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 ${
                billing === "yearly" ? "text-white" : "text-gray-600"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* CARDS GRID */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {plans.map((plan, index) => {
            const pricing = getPrice(plan.id);

            return (
              <div
                key={plan.id}
                data-aos="fade-up"
                data-aos-delay={index * 75}
                className={`group relative rounded-2xl p-5 sm:p-6 text-left transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-1.5 ${
                  plan.color === "custom"
                    ? "bg-[#FFF8EF] border-2 border-dashed border-orange-300 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100"
                    : "bg-white border border-[#D7DFF2] hover:border-[#05015A]/20 hover:shadow-xl hover:shadow-[#05015A]/5"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#05015A] text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-lg font-semibold text-[#05015A] mb-1 group-hover:text-[#1a1a8a] transition-colors duration-300">
                  {plan.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold text-[#05015A]">
                      {pricing.display}
                    </span>
                    <span className="text-sm text-gray-500">
                      {pricing.period}
                    </span>
                  </div>

                  {/* Subtext */}
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    {pricing.subtext}
                  </span>
                </div>

                {/* Users & Branch */}
                <div className="flex gap-4 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-gray-400" />
                    <span>{plan.users}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-gray-400" />
                    <span>{plan.branches}</span>
                  </div>
                </div>

                <hr
                  className={`mb-4 ${
                    plan.color === "custom"
                      ? "border-orange-200"
                      : "border-gray-100"
                  }`}
                />

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <Check
                        size={14}
                        className={`flex-shrink-0 mt-0.5 ${
                          plan.color === "custom"
                            ? "text-orange-500"
                            : "text-green-500"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out ${
                    plan.color === "custom"
                      ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md hover:shadow-orange-200"
                      : "bg-[#05015A] text-white hover:bg-[#1a1a8a] hover:shadow-md hover:shadow-[#05015A]/20"
                  } active:scale-[0.98]`}
                >
                  {plan.button}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <p
          className="text-center text-xs text-gray-500 mt-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          All plans include a 14-day money-back guarantee.{" "}
          <a
            href="/contact"
            className="text-[#05015A] font-medium hover:underline"
          >
            Need help choosing?
          </a>
        </p>
      </div>
    </section>
  );
};

export default PricingSection;