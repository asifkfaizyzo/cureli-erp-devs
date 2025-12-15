import Navbar from "../../pages/about/components/Navbar";
import Footer from "../../pages/home/components/Footer";
import FAQSection from "../../pages/home/components/FAQ";

import PricingHero from "./components/PricingHero";
import PricingCards from "./components/PricingCards";
import PricingFeatures from "./components/PricingFeatures";

const Pricing = () => {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />

      <PricingHero />
      <PricingCards />
      <PricingFeatures />

      <FAQSection />
      <Footer />
    </div>
  );
};

export default Pricing;
