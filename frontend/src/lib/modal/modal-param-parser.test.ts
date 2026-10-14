import { describe, expect, it } from "vitest";

import { parseModalParam } from "@/lib/modal/modal-param-parser";

function parse(query: string) {
  return parseModalParam(new URLSearchParams(query));
}

describe("parseModalParam", () => {
  it("returns null without a modal param", () => {
    expect(parse("")).toBeNull();
    expect(parse("modal=")).toBeNull();
    expect(parse("id=1")).toBeNull();
  });

  it("returns null for an unknown modal name", () => {
    expect(parse("modal=nope")).toBeNull();
    expect(parse("modal=LOGIN")).toBeNull();
  });

  it.each([
    "login",
    "signup",
    "forgot-password",
    "reset-password",
    "email-verified",
    "email-changed",
    "contact",
    "donate",
  ])("parses the plain %s modal and ignores a sub path", (name) => {
    expect(parse(`modal=${name}`)).toEqual({ name });
    expect(parse(`modal=${name}/extra&id=1&ean=2`)).toEqual({ name });
  });

  it("parses onboarding, defaulting to required", () => {
    expect(parse("modal=onboarding")).toEqual({
      name: "onboarding",
      mode: "required",
    });
    expect(parse("modal=onboarding/replay")).toEqual({
      name: "onboarding",
      mode: "replay",
    });
    expect(parse("modal=onboarding/other")).toEqual({
      name: "onboarding",
      mode: "required",
    });
  });

  it("parses settings tabs, falling back to profil", () => {
    for (const tab of ["profil", "obavijesti", "preference", "sigurnost"]) {
      expect(parse(`modal=settings/${tab}`)).toEqual({ name: "settings", tab });
    }

    expect(parse("modal=settings")).toEqual({
      name: "settings",
      tab: "profil",
    });
    expect(parse("modal=settings/unknown")).toEqual({
      name: "settings",
      tab: "profil",
    });
  });

  it("parses shopping list actions", () => {
    expect(parse("modal=shopping-list/new")).toEqual({
      name: "shopping-list",
      action: "new",
    });

    for (const action of ["edit", "share", "copy"]) {
      expect(parse(`modal=shopping-list/${action}&id=abc`)).toEqual({
        name: "shopping-list",
        action,
        id: "abc",
      });
      expect(parse(`modal=shopping-list/${action}`)).toBeNull();
    }

    expect(parse("modal=shopping-list")).toBeNull();
    expect(parse("modal=shopping-list/view&id=abc")).toBeNull();
  });

  it("parses digital card actions", () => {
    expect(parse("modal=digital-card/new")).toEqual({
      name: "digital-card",
      action: "new",
    });

    for (const action of ["edit", "view"]) {
      expect(parse(`modal=digital-card/${action}&id=7`)).toEqual({
        name: "digital-card",
        action,
        id: "7",
      });
      expect(parse(`modal=digital-card/${action}`)).toBeNull();
    }

    expect(parse("modal=digital-card")).toBeNull();
    expect(parse("modal=digital-card/share&id=7")).toBeNull();
  });

  it("requires an id for shopping list actions sheet", () => {
    expect(parse("modal=shopping-list-actions&id=abc")).toEqual({
      name: "shopping-list-actions",
      id: "abc",
    });
    expect(parse("modal=shopping-list-actions")).toBeNull();
  });

  it.each(["add-to-list", "product-actions"])(
    "requires an ean for %s",
    (name) => {
      expect(parse(`modal=${name}&ean=385`)).toEqual({ name, ean: "385" });
      expect(parse(`modal=${name}`)).toBeNull();
    },
  );

  it("parses watchlist with an optional valid watch type", () => {
    expect(parse("modal=watchlist")).toBeNull();
    expect(parse("modal=watchlist&ean=385")).toEqual({
      name: "watchlist",
      ean: "385",
      watchType: undefined,
    });
    expect(parse("modal=watchlist&ean=385&type=percentage")).toEqual({
      name: "watchlist",
      ean: "385",
      watchType: "percentage",
    });
    expect(parse("modal=watchlist&ean=385&type=absolute")).toEqual({
      name: "watchlist",
      ean: "385",
      watchType: "absolute",
    });
    expect(parse("modal=watchlist&ean=385&type=bogus")).toEqual({
      name: "watchlist",
      ean: "385",
      watchType: undefined,
    });
  });
});
