import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {}, timeFormat: "12hr", toggleTimeFormat: () => {} });

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("lms_dark_mode") === "true";
  });
  const [timeFormat, setTimeFormat] = useState(() => {
    return localStorage.getItem("lms_time_format") === "24hr" ? "24hr" : "12hr";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const savedDark = localStorage.getItem("lms_dark_mode") === "true";
    document.documentElement.classList.toggle("dark", savedDark);
    document.body.classList.toggle("dark", savedDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("lms_dark_mode", String(next));
  };

  const toggleTimeFormat = () => {
    const next = timeFormat === "12hr" ? "24hr" : "12hr";
    setTimeFormat(next);
    localStorage.setItem("lms_time_format", next);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, timeFormat, toggleTimeFormat }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
