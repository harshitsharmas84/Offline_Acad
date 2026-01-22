"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  if (!mounted) {
    // 🔑 Prevent hydration mismatch
    return null;
  }

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  return (
    <header className="sticky top-0">
      <button onClick={toggleTheme}>
        {theme === "light" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
