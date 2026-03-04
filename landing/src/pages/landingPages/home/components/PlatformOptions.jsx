import { Truck, Home, CheckCircle } from "lucide-react";

const PlatformOptions = () => {
  const pulseFeatures = [
    "Discover trusted medical stores near you",
    "Check availability, pricing, and alternatives",
    "Exclusive deals from partner pharmacies",
    "Optimized delivery routes for quicker service",
    "Secure and simple prescription handling",
  ];

  const pharmaFeatures = [
    "Real-time stock tracking with batch & expiry control",
    "GST-compliant billing for in-store & online sales",
    "Purchase orders, supplier bills, and GRN handling",
    "Daily, monthly & branch-wise performance insights",
    "Automatic sync with Cureli delivery app",
  ];

  return (
    <section className="py-24 bg-[#d7e4ef]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-[#3c45a5] mb-3">
            Build for Both Delivery <br />
            Platform & Pharmacies Brands
          </h2>

          <p className="text-gray-600">
            Choose your path and launch your medicines delivery business in weeks
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-2 gap-10">

          {/* Card 1 */}
          <div className="rounded-2xl border border-purple-300 bg-gradient-to-br from-[#f0d8f5] to-[#d6bde8] p-8 shadow-lg">

            {/* Icon */}
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-purple-200 mb-6">
              <Truck size={26} className="text-purple-700" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-4">
              For Cureli Pulse
            </h3>

            <p className="text-gray-700 mb-6">
              Launch and scale a multi-vendor medicine delivery marketplace with
              full control over vendors, drivers and operations.
            </p>

            {/* Features */}
            <ul className="space-y-3">
              {pulseFeatures.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-800">
                  <CheckCircle size={18} className="text-indigo-700" />
                  {item}
                </li>
              ))}
            </ul>

          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-indigo-300 bg-gradient-to-br from-[#e5e8f9] to-[#cfd6f3] p-8 shadow-lg">

            {/* Icon */}
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-200 mb-6">
              <Home size={26} className="text-indigo-700" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-4">
              For Cureli PharmaERP
            </h3>

            <p className="text-gray-700 mb-6">
              Digitally manage and automate pharmacy operations with real-time
              inventory, billing, purchases, suppliers, and analytics to improve
              profitability.
            </p>

            {/* Features */}
            <ul className="space-y-3">
              {pharmaFeatures.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-800">
                  <CheckCircle size={18} className="text-indigo-700" />
                  {item}
                </li>
              ))}
            </ul>

          </div>

        </div>
      </div>
    </section>
  );
};

export default PlatformOptions;