import { useEffect } from "react";
import AOS from "aos";
///dummy data

const features = [
  { 
    title: "Sales", 
    description: "We provide reliable, accessible pharmacy care to improve health daily.",
    img: "src/assets/images/dashboard-mockup2.png" 
  },
  { 
    title: "Purchase", 
    description: "We ensure timely, cost-effective purchasing to keep your pharmacy stocked.",
    img: "src/assets/images/dashboard-mockup2.png" 
  },
  { 
    title: "Inventory", 
    description: "We maintain real-time inventory ensuring essential medicines remain available always.",
    img: "src/assets/images/dashboard-mockup2.png" 
  },
  { 
    title: "Suppliers", 
    description: "Trusted suppliers help us deliver quality medicines with timely restocking.",
    img: "src/assets/images/dashboard-mockup2.png" 
  },
  { 
    title: "Report", 
    description: "We generate accurate reports providing insights to improve pharmacy operations.",
    img: "src/assets/images/dashboard-mockup2.png" 
  },
  { 
    title: "Orders", 
    description: "We manage orders efficiently delivering timely, accurate service to patients.",
    img: "src/assets/images/dashboard-mockup2.png" 
  }
];

const PricingFeatures = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <section className="w-full bg-white py-8 xs:py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <h2
          className="
            text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl 
            mt-[-5%]
            font-bold 
            text-[#000060] 
            text-center 
            mb-6 xs:mb-8 sm:mb-12 md:mb-16 lg:mb-20
            leading-tight
            px-4
          "
          data-aos="fade-up"
        >
          We provide best features to boosts your<br className="hidden sm:block"/> business to the next level
        </h2>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              feature={feature} 
              index={index} 
            />
          ))}
        </div>

      </div>
    </section>
  );
};

const FeatureCard = ({ feature, index }) => {
  return (
    <div
      className="
        group
        bg-white 
        rounded-xl xs:rounded-2xl sm:rounded-3xl
        shadow-lg 
        hover:shadow-2xl
        overflow-hidden
        transition-all 
        duration-500 
        ease-out
        hover:scale-[1.02] 
        hover:-translate-y-2
        border border-gray-100
      "
      data-aos="fade-up"
      data-aos-delay={index * 100}
    >
      {/* Card Header */}
      <div className="
        bg-gradient-to-br from-gray-50 to-white
        text-center
        p-3 xs:p-4 sm:p-5 md:p-6
        border-b border-gray-100
      ">
        <h3 className="
          font-bold 
          text-base xs:text-lg sm:text-xl md:text-2xl
          text-[#000060] 
          mb-1.5 xs:mb-2
          group-hover:text-[#6B46C1]
          transition-colors
          duration-300
        ">
          {feature.title}
        </h3>
        <p className="
          text-xs xs:text-sm sm:text-base    
          text-[#000060]
          leading-relaxed
        ">
          {feature.description}
        </p>
      </div>

      {/* Dashboard Image */}
      <div className="
        relative 
        bg-white
        p-2 xs:p-2 sm:p-3 md:p-4
        overflow-hidden
      ">
        <div className="
          relative 
          rounded-md xs:rounded-lg sm:rounded-xl
          overflow-hidden
          border border-gray-200
          shadow-sm
          group-hover:shadow-md
          transition-all
          duration-300
        ">
          <img
            src={feature.img}
            alt={feature.title}
            className="
              w-full 
              h-auto
              object-cover
              transform
              group-hover:scale-105
              transition-transform
              duration-500
            "
          />
          
          {/* Overlay on Hover */}
          <div className="
            absolute inset-0 
            bg-gradient-to-t from-[#000060]/10 to-transparent
            opacity-0
            group-hover:opacity-100
            transition-opacity
            duration-300
          "></div>
        </div>
      </div>
    </div>
  );
};

export default PricingFeatures;
