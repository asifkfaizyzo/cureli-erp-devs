// src/pages/landingPages/home/components/Features.jsx

import { useEffect, memo } from "react";
import AOS from "aos";
import {
  ShoppingCart,
  Package,
  Clock,
  MapPin,
  CreditCard,
  Star,
} from "lucide-react";
import featuresImage from "../../../../assets/images/layout-left.svg";

// ============================================
// CONSTANTS
// ============================================
const FEATURES_DATA = [
  {
    id: 1,
    icon: ShoppingCart,
    title: "Order Management",
    desc: "Enable seamless order customization and management capabilities to greatly enhance customer satisfaction outcomes.",
  },
  {
    id: 2,
    icon: Package,
    title: "Inventory Management",
    desc: "Enable seamless order customization and management capabilities to greatly enhance customer satisfaction outcomes.",
  },
  {
    id: 3,
    icon: Clock,
    title: "Real-time Order Status",
    desc: "Enable seamless order customization and management capabilities to greatly enhance customer satisfaction outcomes.",
  },
  {
    id: 4,
    icon: MapPin,
    title: "Delivering Zoning",
    desc: "Serve steaming hot food in minutes! Assign drivers to their specific delivery zones to make rapid and fresh food deliveries.",
  },
  {
    id: 5,
    icon: CreditCard,
    title: "Make Payment Easy",
    desc: "Multiple payment gateways to facilitate 100% safe and secure transactions online.",
  },
  {
    id: 6,
    icon: Star,
    title: "Rating and Reviews",
    desc: "Collect customer feedback and leverage insights to drive future improvements and service expansion.",
  },
];

const AOS_BASE_DELAY = 80;

// ============================================
// FEATURE CARD COMPONENT
// ============================================
const FeatureCard = memo(({ feature, index }) => {
  const IconComponent = feature.icon;

  return (
    <article
      className="flex gap-3 xs:gap-4 sm:gap-4 md:gap-5"
      data-aos="fade-left"
      data-aos-delay={index * AOS_BASE_DELAY}
    >
      {/* Icon */}
      <div
        className="text-[#2E3192] mt-0.5 xs:mt-1 flex-shrink-0"
        aria-hidden="true"
      >
        <IconComponent className="w-5 h-5 xs:w-6 xs:h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-7 lg:h-7" />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-base xs:text-lg sm:text-lg md:text-xl lg:text-xl font-semibold text-gray-800 mb-1 xs:mb-1.5 sm:mb-2">
          {feature.title}
        </h3>
        <p className="text-xs xs:text-sm sm:text-sm md:text-base text-gray-500 leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </article>
  );
});

FeatureCard.displayName = "FeatureCard";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <header className="text-center mb-10 xs:mb-12 sm:mb-14 md:mb-16 lg:mb-20">
    <h2
      className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-semibold text-[#2E3192] mb-3 xs:mb-4 sm:mb-5 leading-tight"
      data-aos="fade-up"
    >
      Features of Cureli's Advanced Medicine
      <br className="hidden sm:block" />
      <span className="sm:hidden"> </span>
      Ordering App
    </h2>

    <p
      className="text-sm xs:text-base sm:text-base md:text-lg lg:text-xl text-gray-500 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 xs:px-4 sm:px-0 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="150"
    >
      Combined with some of the most advanced and powerful software modules,
      this medicine ordering system will set you up for success, even in
      competitive markets.
    </p>
  </header>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// FEATURES IMAGE COMPONENT
// ============================================
const FeaturesImage = memo(() => (
  <div
    className="flex justify-center lg:justify-start order-2 lg:order-1"
    data-aos="fade-right"
  >
    <div className="h-[250px] xs:h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] xl:h-[480px] 2xl:h-[520px] flex items-center">
      <img
        src={featuresImage}
        alt="Medicine ordering app illustration showing mobile interface"
        className="h-full w-auto object-contain"
        loading="lazy"
      />
    </div>
  </div>
));

FeaturesImage.displayName = "FeaturesImage";

// ============================================
// FEATURES GRID COMPONENT
// ============================================
const FeaturesGrid = memo(() => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 gap-6 xs:gap-8 sm:gap-x-8 sm:gap-y-10 md:gap-x-10 md:gap-y-12 lg:gap-x-10 lg:gap-y-12 xl:gap-x-12 xl:gap-y-14 order-1 lg:order-2"
    role="list"
    aria-label="App features"
  >
    {FEATURES_DATA.map((feature, index) => (
      <FeatureCard key={feature.id} feature={feature} index={index} />
    ))}
  </div>
));

FeaturesGrid.displayName = "FeaturesGrid";

// ============================================
// MAIN FEATURES COMPONENT
// ============================================
const Features = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="features"
      // INCREASED TOP PADDING FOR MOBILE TO ACCOUNT FOR HEROSTATSCARD
      className="pt-28 pb-12 xs:pt-32 xs:pb-16 sm:pt-28 sm:pb-20 md:pt-28 md:pb-24 lg:pt-28 lg:pb-24 xl:pt-32 xl:pb-28 2xl:pt-36 2xl:pb-32 bg-[#F4F5F7]"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {/* Section Header */}
        <SectionHeader />

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-10 sm:gap-12 md:gap-14 lg:gap-16 xl:gap-20 2xl:gap-24 items-start">
          {/* Left - Image */}
          <FeaturesImage />

          {/* Right - Features Grid */}
          <FeaturesGrid />
        </div>
      </div>
    </section>
  );
};

export default Features;