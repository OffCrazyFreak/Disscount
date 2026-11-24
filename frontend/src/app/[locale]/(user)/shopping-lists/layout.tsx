// List ids reach Sentry by decision (docs/SHARING.md), but contents must not, so Replay blocks this subtree.
export default function ShoppingListsLayout({
  children,
}: LayoutProps<"/[locale]/shopping-lists">) {
  return (
    <div data-sentry-block className="contents">
      {children}
    </div>
  );
}
