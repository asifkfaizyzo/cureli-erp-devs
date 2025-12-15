import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { CircleCheck } from "lucide-react";

const PricingHero = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="w-full text-center pt-24 xs:pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-8 sm:pb-10 md:pb-12 bg-white px-4 sm:px-6 lg:px-8">
      <h2
        className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#000060]"
        data-aos="fade-up"
      >
        One simple plan for a smarter, safer pharmacy
      </h2>

      {/* Small perks text */}
      <div
        className="flex flex-col md:flex-row justify-center items-center gap-3 sm:gap-4 text-gray-600 mt-3 sm:mt-4 text-xs xs:text-sm"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        <p className="flex items-center gap-2">
          <CircleCheck size={16} className="text-[#05015A] flex-shrink-0" />
          Switch Plans Anytime
        </p>

        <p className="flex items-center gap-2">
          <CircleCheck size={16} className="text-[#05015A] flex-shrink-0" />
          No Credit Card Required
        </p>

        <p className="flex items-center gap-2">
          <CircleCheck size={16} className="text-[#05015A] flex-shrink-0" />
          Cancel Anytime
        </p>
      </div>
    </section>
  );
};

export default PricingHero;
