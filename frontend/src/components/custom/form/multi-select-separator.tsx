"use client";

import type { ComponentPropsWithoutRef } from "react";

import { CommandSeparator } from "@/components/ui/command";

export default function MultiSelectSeparator(
  props: ComponentPropsWithoutRef<typeof CommandSeparator>,
) {
  return <CommandSeparator {...props} />;
}
