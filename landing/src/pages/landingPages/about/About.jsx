import React from "react";

import AboutHero from "./components/AboutHero";
import AboutPartners from "./components/AboutPartners";
import AboutMission from "./components/AboutMission";
import AboutCTA from "./components/AboutCTA";
import Footer from "../../../components/common/Footer";
import Navbar from "../about/components/Navbar";


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
