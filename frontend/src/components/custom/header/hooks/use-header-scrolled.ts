import { useEffect, useState } from "react";

export function useHeaderScrolled() {
  const [isScrolled, setIsScrolled] = useState(false); // Track if the page is scrolled for header opacity

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isScrolled;
}
