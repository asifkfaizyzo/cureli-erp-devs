

// src/components/Features.jsx
import { useEffect } from "react";
import AOS from "aos";
import {
  Package,
  Zap,
  ShoppingCart,
  FileText,
  Clock,
  Users,
} from "lucide-react";
import featuresImage from "../../../../assets/images/layout-left.png"; // Update path as needed

const Features = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const features = [
    {
      icon: <Package size={28} />,
      title: "Smart Inventory Management",
    },
    {
      icon: <Zap size={28} />,
      title: "Fast & Accurate Billing",
    },
    {
      icon: <ShoppingCart size={28} />,
      title: "Purchase & Supplier Management",
    },
    {
      icon: <FileText size={28} />,
      title: "Integrated Accounting & Reports",
    },
    {
      icon: <Clock size={28} />,
      title: "Expiry & Batch Tracking",
    },
    {
      icon: <Users size={28} />,
      title: "User Roles & Staff Management",
    },
  ];

  return (
    <section
      id="features"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title Section */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2
            className=" text-3xl sm:text-4xl lg:text-5xl font-medium text-[#05015A] mb-3 sm:mb-4"
            data-aos="fade-up"
          >
            Smarter, Scalable Solutions for <br className="hidden sm:block" />
            Every Users
          </h2>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto text-gray-600 px-4"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            Tailored technology to streamline operations, enhance patient care, and boost revenue.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* Left Side - Image (Smaller) */}
          <div
            className="lg:col-span-4 order-2 lg:order-1"
            data-aos="fade-right"
            data-aos-delay="200"
          >
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl h-full">
              <img
                src={featuresImage}
                alt="Healthcare Professional"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05015A]/30 to-transparent"></div>
            </div>
          </div>

          {/* Right Side - Feature Cards (3 columns × 2 rows) */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 h-full">
              {features.map((item, index) => (
                <div
                  key={index}
                  data-aos="fade-left"
                  data-aos-delay={index * 80}
                  className="group p-6 sm:p-7 bg-gradient-to-br from-[#310372]/81 to-[#000060]/56 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer flex flex-col justify-center"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white mb-4 group-hover:bg-white/20 transition-all">
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Features;
