import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import DemoModal from "./components/DemoModal";
import Home from "./pages/Home";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import RegisterPage from "./pages/RegisterPage";

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenDemo = () => setIsDemoModalOpen(true);
  const handleCloseDemo = () => setIsDemoModalOpen(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
        <Navbar onOpenDemo={handleOpenDemo} />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home onOpenDemo={handleOpenDemo} />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/demo" element={<RegisterPage />} />
            <Route path="*" element={<Home onOpenDemo={handleOpenDemo} />} />
          </Routes>
        </div>

        <Footer onOpenDemo={handleOpenDemo} />
        <FloatingWhatsApp />
        <DemoModal isOpen={isDemoModalOpen} onClose={handleCloseDemo} />
      </div>
    </BrowserRouter>
  );
}
