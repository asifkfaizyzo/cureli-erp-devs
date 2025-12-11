// src/components/Testimonials.jsx
import { useEffect } from "react";
import AOS from "aos";
import { Quote } from "lucide-react";

const Testimonials = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const testimonials = [
    {
      name: "Victoria Thompson",
      role: "CEO and Co-founder of ABC Company",
      image: "https://i.pravatar.cc/150?img=5",
      text: "Their ability to capture our brand essence in every project is unparalleled - an invaluable creative collaborator.",
    },
    {
      name: "Victoria Thompson",
      role: "CEO and Co-founder of ABC Company",
      image: "https://i.pravatar.cc/150?img=5",
      text: "Their ability to capture our brand essence in every project is unparalleled - an invaluable creative collaborator.",
    },
    {
      name: "Victoria Thompson",
      role: "CEO and Co-founder of ABC Company",
      image: "https://i.pravatar.cc/150?img=5",
      text: "Their ability to capture our brand essence in every project is unparalleled - an invaluable creative collaborator.",
    },
  ];

  return (
    <section
      id="testimonials"
      className="bg-[#000060] py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
    {/* <section
      id="testimonials"
      className="py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden"
      style={{ 
        background: "linear-gradient(135deg, #3B1C8C 0%, #1A0B4E 100%)"
      }}
    > */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
          <h2
            className="font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-2 sm:mb-3 lg:mb-4 px-4"
            data-aos="fade-up"
          >
            <span className="font-bold">Words of Praise</span>{" "}
            <span className="text-white/70">from others</span>
            <br className="hidden sm:block" />
            <span className="text-white/70">about our presence.</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="group relative bg-gradient-to-br from-[#5B3B9E]/40 to-[#3B2870]/40 backdrop-blur-sm p-6 sm:p-7 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-2 flex flex-col"
              data-aos="fade-up"
              data-aos-delay={i * 120}
            >
              {/* Quote Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-400 flex items-center justify-center mb-5 sm:mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-cyan-300">
                <Quote className="text-white transition-transform duration-300 group-hover:scale-90" size={20} fill="white" />
              </div>

              {/* Testimonial Text */}
              <p className="font-manrope text-white/90 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 flex-grow transition-colors duration-300 group-hover:text-white">
                {item.text}
              </p>

              {/* Profile */}
              <div className="flex items-center gap-3 sm:gap-4 mt-auto">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white/30 transition-all duration-300 group-hover:border-cyan-400 group-hover:scale-105"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-manrope text-sm sm:text-base md:text-lg font-bold text-white transition-colors duration-300 group-hover:text-cyan-300 truncate">
                    {item.name}
                  </h4>
                  <p className="font-manrope text-xs sm:text-sm text-white/70 transition-colors duration-300 group-hover:text-white/90 line-clamp-2">
                    {item.role}
                  </p>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-400/0 to-cyan-400/0 group-hover:from-cyan-400/10 group-hover:to-cyan-400/5 transition-all duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
