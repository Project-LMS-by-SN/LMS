import Hero from "../components/Hero";
import LiveSeatSimulator from "../components/LiveSeatSimulator";
import FeaturesGrid from "../components/FeaturesGrid";
import RevenueCalculator from "../components/RevenueCalculator";
import PricingSection from "../components/PricingSection";
import Testimonials from "../components/Testimonials";
import FAQAccordion from "../components/FAQAccordion";

export default function Home({ onOpenDemo }) {
  return (
    <main>
      <Hero onOpenDemo={onOpenDemo} />
      <FeaturesGrid />
      <LiveSeatSimulator onOpenDemo={onOpenDemo} />
      <RevenueCalculator />
      <PricingSection />
      <Testimonials />
      <FAQAccordion />
    </main>
  );
}
