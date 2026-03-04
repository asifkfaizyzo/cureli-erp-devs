// ERPShowcase.jsx
import erpDashboard from "../../../../assets/images/dashboard-mockup2.png";
import erpBilling from "../../../../assets/images/dashoard.png";

const ERPShowcase = () => {
  return (
    <section className="relative py-28 overflow-hidden">

      {/* VIOLET OVERLAY SHADE */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#2b0b59]/70 via-[#1b0d73]/40 to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-2 items-center gap-16">

          {/* LEFT CONTENT */}
          <div className="text-white">

            <div className="inline-block mb-6 px-4 py-1 text-sm rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
              Decentralized ERP
            </div>

            <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
              Run Your Pharmacy <br /> Smarter
            </h2>

            <p className="text-white/80 mb-8 max-w-lg">
              Cureli ERP streamlines pharmacy operations by centralizing
              inventory, billing, purchases, suppliers, sales, and reporting
              into one efficient, reliable, and scalable pharmacy management system.
            </p>

            <button className="bg-white text-[#2a0a68] px-6 py-3 rounded-lg font-medium hover:shadow-lg transition">
              Request ERP Demo →
            </button>

          </div>


          {/* RIGHT MOCKUPS */}
          <div className="relative flex items-center justify-center">

            {/* =====================================
               GLOW BLUR BACKGROUND
               ===================================== */}
            <div className="absolute w-[750px] h-[450px] bg-purple-600/40 blur-[140px] rounded-full -z-10"></div>


            {/* =====================================
               BACK IMAGE (MAIN DASHBOARD) - WITH GLASS EFFECT
               ===================================== */}
            <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20 shadow-2xl">
              <img
                src={erpDashboard}
                alt="ERP Dashboard"
                className="w-[720px] h-auto rounded-xl shadow-lg"
              />
            </div>


            {/* =====================================
               FRONT IMAGE (OVERLAY BILLING SCREEN) - WITH GLASS EFFECT
               ===================================== */}
            <div 
              className="absolute z-20 bottom-[-70px] left-[-120px] bg-white/10 backdrop-blur-md rounded-2xl p-2.5 md:p-3 border border-white/30 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300"
            >
              <img
                src={erpBilling}
                alt="ERP Billing"
                className="w-[560px] h-auto rounded-xl shadow-2xl"
              />
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ERPShowcase;