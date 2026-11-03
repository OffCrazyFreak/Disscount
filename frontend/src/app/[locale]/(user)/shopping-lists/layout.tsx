// List ids reach Sentry unscrubbed by decision, recorded in docs/SHARING.md. A shared
// list's contents must not: Replay blocks this subtree from its DOM recording.
export default function ShoppingListsLayout({
  children,
}: LayoutProps<"/[locale]/shopping-lists">) {
  return (
    <div data-sentry-block className="contents">
      {children}
    </div>
  );
}
