import { describe, expect, it } from "vitest";

import { initialsOf } from "@/app/[locale]/(user)/digital-cards/utils/card-initials";

describe("initialsOf", () => {
  it.each([
    ["Konzum", "KO"],
    ["dm", "DM"],
    ["Müller", "MÜ"],
    ["Pekara Kruh i Kifla", "PK"],
    ["  Lidl  ", "LI"],
    ["", ""],
  ])("%s gives %s", (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
