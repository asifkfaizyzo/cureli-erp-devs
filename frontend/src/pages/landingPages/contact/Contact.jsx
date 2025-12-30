import ContactHero from "./components/ContactHero";
import ContactFormCard from "./components/ContactFormCard";
// import OpeningHours from "./components/OpeningHours";
import MapSection from "./components/MapSection";
import Navbar from "../about/components/Navbar";
import Footer from "../home/components/Footer";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const Contact = () => {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      
      {/* Hero and Form Card Container */}
      <div className="relative">
        {/* Hero Section */}
        <ContactHero />
        
        {/* Overlapping Form Card - Responsive Margins */}
         <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_CAPTCHA_ID}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      <div className="relative -mt-20 xs:-mt-24 sm:-mt-32 md:-mt-40 lg:-mt-48 xl:-mt-56 z-10 px-4 sm:px-6 lg:px-22">
          <ContactFormCard />
        </div>

    </GoogleReCaptchaProvider>
        
        
      </div>
      
      {/* White Space Below - Responsive Padding */}
     <div className="
  bg-white
  mx-auto
  w-full
  max-w-7xl
  px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12
  pt-8 xs:pt-10 sm:pt-12 md:pt-14 lg:pt-16 xl:pt-20
  pb-8 xs:pb-10 sm:pb-12 md:pb-14 lg:pb-16 xl:pb-20
">

        {/* <OpeningHours /> */}
        <MapSection />
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
