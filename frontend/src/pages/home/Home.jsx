// src/pages/Home.jsx

import Navbar from "../../components/home/Navbar";
import Hero from "../../components/home/Hero";
import Features from "../../components/home/Features";
import Pricing from "../../components/home/Pricing";
import Testimonials from "../../components/home/Testimonials";
import FAQ from "../../components/home/FAQ";
import Footer from "../../components/home/Footer";

const Home = () => {
  return (
    // <div className="w-full overflow-x-hidden"
    // style={{ 
    //     background: "linear-gradient(135deg, #3B1C8C 0%, #1A0B4E 100%)"
    //   }}>
    <div className="bg-[#000060] w-full overflow-x-hidden">
      {/* Sticky Navbar */}
      <Navbar />

      {/* Page Sections */}
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Home;
