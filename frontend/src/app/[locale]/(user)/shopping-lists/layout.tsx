// List ids reach Sentry unscrubbed by decision in docs/SHARING.md, but a shared list's contents must not, so Replay blocks this subtree.
export default function ShoppingListsLayout({
  children,
}: LayoutProps<"/[locale]/shopping-lists">) {
  return (
    <div data-sentry-block className="contents">
      {children}
    </div>
  );
}
