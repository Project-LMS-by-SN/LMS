import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("lms_admin_dark_mode");
    return saved !== null ? saved === "true" : true; // Default to dark for sleek admin
  });

  useEffect(() => {
    document.body.classList.toggle("light", !darkMode);
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("lms_admin_dark_mode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
