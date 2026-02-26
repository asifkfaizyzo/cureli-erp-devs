// src/components/FAQ.jsx
import { useEffect, useState } from "react";
import AOS from "aos";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Does the system support purchase orders and vendor management?",
      answer:
        "Yes! Cureli ERP includes comprehensive vendor management, purchase orders, and supplier tracking features.",
    },
    {
      question: "How does the ERP help in billing and invoicing?",
      answer:
        "Our ERP provides fast, GST-compliant billing with automated invoice generation and payment tracking.",
    },
    {
      question: "Can it manage medicine expiry and batch tracking?",
      answer:
        "Absolutely! The system tracks batch numbers, expiry dates, and sends automated low-stock alerts.",
    },
    {
      question: "Does it support barcode or QR code billing?",
      answer:
        "Yes, Cureli ERP supports both barcode and QR code scanning for quick and accurate billing.",
    },
    {
      question: "Is GST included in the billing system?",
      answer:
        "Yes, all invoices are 100% GST-compliant with automatic tax calculations and HSN code support.",
    },
    {
      question: "Can I access reports and analytics?",
      answer:
        "Yes, you get detailed sales reports, inventory analytics, tax summaries, and business insights.",
    },
    {
      question: "Is the software easy to use for non-technical staff?",
      answer:
        "Absolutely! Our intuitive interface is designed for ease of use with complete training and support.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 md:py-24 lg:py-28 rounded-b-[50px] sm:rounded-b-[60px] md:rounded-b-[80px] lg:rounded-b-[100px] overflow-hidden"
      style={{ backgroundColor: "#E8EFF7" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <h2
            className="font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mb-2 sm:mb-3 px-4"
            data-aos="fade-up"
          >
            <span className="text-[#4B3B8F]">Frequently Asked</span>{" "}
            <span className="text-[#4B3B8F]">Questions</span>
          </h2>

          <p
            className="font-manrope text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto mt-2 sm:mt-3 px-4"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            Our platform is built to help you know work smarter, not harder. It adapts to your needs and supports your goals. Makes the most of every feature
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 80}
              className="group bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 md:px-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#4B3B8F]/30"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left gap-3 sm:gap-4"
              >
                <h3 className="font-manrope text-xs sm:text-sm md:text-base font-semibold text-gray-900 transition-colors duration-300 group-hover:text-[#4B3B8F] pr-2">
                  {faq.question}
                </h3>

                <ChevronDown
                  size={18}
                  className={`text-gray-600 flex-shrink-0 transition-all duration-300 group-hover:text-[#4B3B8F] sm:w-5 sm:h-5 ${
                    openIndex === index ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {/* Answer Section */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index 
                    ? "max-h-40 sm:max-h-32 opacity-100 mt-2 sm:mt-3" 
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="font-manrope text-xs sm:text-sm text-gray-600 leading-relaxed pr-8 sm:pr-0">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FAQ;
