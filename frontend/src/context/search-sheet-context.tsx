"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

interface ISearchSheetContext {
  isOpen: boolean;
  /** Registered by the sheet's field, so `open` can focus it without a lookup */
  inputRef: RefObject<HTMLInputElement | null>;
  /** The sheet's root, revealed synchronously so the field becomes focusable */
  containerRef: RefObject<HTMLDivElement | null>;
  open: () => void;
  close: () => void;
}

const SearchSheetContext = createContext<ISearchSheetContext | null>(null);

interface ISearchSheetProviderProps {
  children: ReactNode;
}

/**
 * Holds the mobile search sheet open and focuses its field synchronously, which
 * is the whole reason this is React state rather than a `?modal=` URL: iOS raises
 * the keyboard only when `.focus()` runs inside the same task as the gesture, and
 * both a router transition and Next's history sync are async.
 *
 * The sheet therefore stays mounted, and hides with `visibility` so that when
 * closed it leaves the tab order and the accessibility tree. Since a hidden
 * ancestor also blocks focus, `open` reveals the container through the DOM before
 * React has committed the state change.
 */
export function SearchSheetProvider({ children }: ISearchSheetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const open = useCallback(() => {
    const container = containerRef.current;

    if (container) {
      container.style.setProperty("visibility", "visible");
      // Force the style recalc, so focus sees a visible ancestor this task.
      void container.offsetHeight;
    }

    setIsOpen(true);
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const close = useCallback(() => {
    inputRef.current?.blur();
    // Hand visibility back to the class, or the sheet would stay revealed.
    containerRef.current?.style.removeProperty("visibility");
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, inputRef, containerRef, open, close }),
    [isOpen, open, close],
  );

  return (
    <SearchSheetContext.Provider value={value}>
      {children}
    </SearchSheetContext.Provider>
  );
}

export function useSearchSheet() {
  const context = useContext(SearchSheetContext);
  if (!context) {
    throw new Error("useSearchSheet must be used within a SearchSheetProvider");
  }

  return context;
}
