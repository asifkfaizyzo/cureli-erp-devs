import ContactHero from "./components/ContactHero";
import ContactFormCard from "./components/ContactFormCard";
import OpeningHours from "./components/OpeningHours";
import MapSection from "./components/MapSection";
import Navbar from "../about/components/Navbar";
import Footer from "../home/components/Footer";

const Contact = () => {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      
      {/* Hero and Form Card Container */}
      <div className="relative">
        {/* Hero Section */}
        <ContactHero />
        
        {/* Overlapping Form Card - Responsive Margins */}
        <div className="relative -mt-20 xs:-mt-24 sm:-mt-32 md:-mt-40 lg:-mt-48 xl:-mt-56 z-10 px-4 sm:px-6 lg:px-22">
          <ContactFormCard />
        </div>
      </div>
      
      {/* White Space Below - Responsive Padding */}
      <div className="bg-white pt-8 xs:pt-10 sm:pt-12 md:pt-14 lg:pt-16 xl:pt-20">
        <OpeningHours />
        <MapSection />
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
