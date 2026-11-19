import Hero from "../components/Hero.jsx";
import ElProblema from "../components/ElProblema.jsx";
import WhyChoose from "../components/WhyChoose.jsx";
import Security from "../components/Security.jsx";
import ToolsAndFunctions from "../components/ToolsAndFunctions.jsx";
import Pricing from "../components/Pricing.jsx";
import About from "../components/About.jsx";

export default function Landing({ onGetStarted }) {
  return (
    <>
      <Hero onGetStarted={onGetStarted} />
      <ElProblema />
      <WhyChoose />
      <Security />
      <ToolsAndFunctions />
      <Pricing />
      <About />
    </>
  );
}
