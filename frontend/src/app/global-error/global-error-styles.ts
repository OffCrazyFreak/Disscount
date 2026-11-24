import type { CSSProperties } from "react";

// global-error renders without globals.css, so Tailwind classes would do nothing.
const button: CSSProperties = {
  display: "inline-block",
  padding: "0.625rem 1.25rem",
  borderRadius: "0.75rem",
  font: "inherit",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
};

export const globalErrorStyles = {
  body: {
    margin: 0,
    minHeight: "100svh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    boxSizing: "border-box",
    background: "#fafafa",
    color: "#262626",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "28rem",
    padding: "2rem 1.5rem",
    borderRadius: "0.75rem",
    border: "1px solid #e5e5e5",
    background: "#ffffff",
    textAlign: "center",
  },
  heading: { margin: 0, fontSize: "1.5rem", lineHeight: 1.25, outline: "none" },
  description: { margin: "1rem 0 1.5rem", color: "#5c5c5c", lineHeight: 1.5 },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    justifyContent: "center",
  },
  retryButton: {
    ...button,
    border: "1px solid #d4d4d4",
    background: "#ffffff",
    color: "#262626",
  },
  homeLink: {
    ...button,
    border: "1px solid #1f6b2a",
    background: "#1f6b2a",
    color: "#ffffff",
  },
} satisfies Record<string, CSSProperties>;
