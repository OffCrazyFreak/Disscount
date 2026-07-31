import { Metadata } from "next";

import SharedShoppingListClient from "@/app/s/[token]/components/shared-shopping-list-client";
import {
  formatItemCount,
  getSharedListPreview,
} from "@/app/s/[token]/get-shared-list-preview";

// A shared list is unlisted, not public: it should preview nicely when pasted into a chat
// and never turn up in a search result. next.config.ts sends X-Robots-Tag for the same
// reason, since a robots.txt rule would stop a crawler ever seeing this.
const NOINDEX = { index: false, follow: false } as const;

export async function generateMetadata(
  props: PageProps<"/s/[token]">,
): Promise<Metadata> {
  const { token } = await props.params;
  const shoppingList = await getSharedListPreview(token);

  if (!shoppingList) {
    return {
      title: "Podijeljeni popis za kupnju",
      robots: NOINDEX,
    };
  }

  const description = `Popis za kupnju, ${formatItemCount(shoppingList.items.length)}.`;

  return {
    title: shoppingList.title,
    description,
    robots: NOINDEX,
    openGraph: {
      title: shoppingList.title,
      description,
      type: "website",
    },
  };
}

export default async function SharedShoppingListPage(
  props: PageProps<"/s/[token]">,
) {
  const { token } = await props.params;

  return <SharedShoppingListClient token={token} />;
}
