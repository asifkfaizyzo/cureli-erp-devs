import {
  Layers,
  Workflow,
  Zap,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";

const WhyChooseUs = () => {
  const items = [
    {
      icon: <Layers size={34} />,
      title: "One Unified Platform",
      desc: "Cureli combines a powerful pharmacy ERP system with an online medicine delivery app, eliminating the need for multiple disconnected tools.",
    },
    {
      icon: <Workflow size={34} />,
      title: "Seamless App & ERP Integration",
      desc: "Orders placed through the Cureli app sync instantly with the ERP, ensuring real-time inventory updates, accurate billing, and smooth fulfillment.",
    },
    {
      icon: <Zap size={34} />,
      title: "Faster Operations",
      desc: "Automated processes reduce manual work, minimize errors, and speed up billing, inventory control, and reporting.",
    },
    {
      icon: <ShieldCheck size={34} />,
      title: "Secure & Reliable",
      desc: "Cureli ensures secure data handling, reliable system performance, and compliance with industry standards.",
    },
    {
      icon: <HeartHandshake size={34} />,
      title: "Improved Customer Experiences",
      desc: "Quick medicine discovery, easy prescription uploads, fast delivery, and transparent order tracking create a better experience for customers.",
    },
    {
      icon: <TrendingUp size={34} />,
      title: "Scalable for Any Size Business",
      desc: "Whether you run a single medical store or a multi-branch pharmacy chain, Cureli scales with your growth.",
    },
  ];

  return (
    <section className="py-24 bg-[#d7e4ef]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-[#3c45a5]">
            Why Choose Us?
          </h2>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {items.map((item, index) => (
            <div
              key={index}
              className="p-8 rounded-xl border border-white/30 bg-gradient-to-br from-[#cfd0e6] to-[#c3a3df] shadow-lg hover:shadow-xl transition duration-300"
            >
              {/* Icon */}
              <div className="text-black mb-5">{item.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-black mb-3">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-800 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;