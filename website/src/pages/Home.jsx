import Hero from "../components/Hero";
import FeaturesGrid from "../components/FeaturesGrid";
import FAQAccordion from "../components/FAQAccordion";

export default function Home({ onOpenDemo }) {
  return (
    <main>
      <Hero onOpenDemo={onOpenDemo} />
      <FeaturesGrid />
      <FAQAccordion />
    </main>
  );
}
