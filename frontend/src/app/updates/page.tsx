import { Metadata } from "next";

import UpdatesClient from "@/app/updates/components/updates-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Novosti",
  description: "Najnovije objave i novosti o Disscountu.",
};

export default async function UpdatesPage(props: PageProps<"/updates">) {
  const query = readSearchParam(await props.searchParams);

  return <UpdatesClient query={query} />;
}
