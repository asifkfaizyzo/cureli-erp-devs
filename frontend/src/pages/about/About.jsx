import React from "react";

import AboutHero from "./components/AboutHero";
import AboutPartners from "./components/AboutPartners";
import AboutMission from "./components/AboutMission";
import AboutCTA from "./components/AboutCTA";
import Navbar from "./components/Navbar";
import Footer from "../home/components/Footer";

const About = () => {
  return (
    <div className="w-full overflow-hidden">

      <Navbar />
      <AboutHero />
      <AboutPartners />
      <AboutMission />
      <AboutCTA />
      <Footer />
    </div>
  );
};

export default About;
