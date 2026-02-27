import Navbar from "../about/components/Navbar";
import Footer from "../../../components/common/Footer";
import FAQSection from "../home/components/FAQ";

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
