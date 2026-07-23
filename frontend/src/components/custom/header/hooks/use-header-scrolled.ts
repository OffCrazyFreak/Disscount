import { useEffect, useState } from "react";

export function useHeaderScrolled() {
  // Seed from the current scroll position so a page loaded already-scrolled
  // renders the correct header state on the first paint.
  const [isScrolled, setIsScrolled] = useState(
    () => typeof window !== "undefined" && window.scrollY > 50,
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isScrolled;
}
