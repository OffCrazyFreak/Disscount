"use client";

import type { ComponentPropsWithoutRef } from "react";

import { CommandGroup } from "@/components/ui/command";

export default function MultiSelectGroup(
  props: ComponentPropsWithoutRef<typeof CommandGroup>,
) {
  return <CommandGroup {...props} />;
}
