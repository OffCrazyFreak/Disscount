"use client";

import { useSyncExternalStore } from "react";
import { ChevronsDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";
import { scrollWindowTo } from "@/utils/scroll";

/** A sliver of the current screen stays in view, so the jump reads as a scroll, not a page swap. */
const CARRY_OVER_PX = 96;

function isAtTopWithMoreBelow(): boolean {
  const { scrollY, innerHeight } = window;
  const pageHeight = document.documentElement.scrollHeight;

  return scrollY <= 0 && innerHeight < pageHeight - 1;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);

  // Results loading in grow the page without any scroll or resize event.
  const observer = new ResizeObserver(onChange);
  observer.observe(document.body);

  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
    observer.disconnect();
  };
}

function scrollOneScreen() {
  scrollWindowTo(window.scrollY + window.innerHeight - CARRY_OVER_PX);
}

/** Tells signed-out visitors the page goes on below the fold (#170); WindowScrollFade is the other half. */
export default function ScrollCue() {
  const t = useTranslations("shell.scrollCue");
  const { user, isLoading } = useUser();

  // The server has no scroll position, so it renders the cue hidden.
  const isVisible = useSyncExternalStore(
    subscribe,
    isAtTopWithMoreBelow,
    () => false,
  );

  // Until the session is known, rendering would flash the cue at every signed-in user.
  if (isLoading || user) return null;

  return (
    // Click-through, so the hidden button leaves no dead zone above the nav.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-total)+1.5rem)] z-[var(--z-fab)] flex justify-center">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t("label")}
        onClick={scrollOneScreen}
        // inert also clears the tab order and a11y tree, which opacity alone leaves behind.
        inert={!isVisible}
        className={cn(
          "pointer-events-auto size-[3rem] rounded-full border-primary bg-background/90 text-primary shadow-md [&_svg]:size-[1.5rem]!",
          "animate-bounce [animation-iteration-count:3] motion-reduce:animate-none",
          "transition-opacity duration-300 motion-reduce:transition-none",
          isVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronsDown />
      </Button>
    </div>
  );
}
