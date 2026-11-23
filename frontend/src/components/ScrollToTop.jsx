import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Ensures every page opens at the very top (0, 0) upon any route or query change.
 * Handles window, document, and custom scroll containers (.main-content, .page, etc.).
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Scroll window and document body/documentElement
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 2. Scroll layout containers (especially .main-content in DashboardLayout)
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.scrollTop = 0;
      if (typeof mainContent.scrollTo === "function") {
        mainContent.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }

    // 3. Scroll any nested page containers
    const pageContainers = document.querySelectorAll(".page, .admin-layout, .dashboard");
    pageContainers.forEach((el) => {
      el.scrollTop = 0;
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
