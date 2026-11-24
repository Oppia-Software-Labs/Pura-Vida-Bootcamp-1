import LandingShell from "@/components/landing/LandingShell";
import ElProblema from "@/components/landing/ElProblema";
import WhyChoose from "@/components/landing/WhyChoose";
import Security from "@/components/landing/Security";
import ToolsAndFunctions from "@/components/landing/ToolsAndFunctions";
import Pricing from "@/components/landing/Pricing";
import About from "@/components/landing/About";

// Static sections render on the server; LandingShell adds the interactive
// navbar, hero and wallet modal on the client.
export default function HomePage() {
  return (
    <LandingShell>
      <ElProblema />
      <WhyChoose />
      <Security />
      <ToolsAndFunctions />
      <Pricing />
      <About />
    </LandingShell>
  );
}
