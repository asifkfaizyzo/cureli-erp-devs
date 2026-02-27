// src/pages/Home.jsx

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Footer from "../../../components/common/Footer";

const Home = () => {
  return (
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
