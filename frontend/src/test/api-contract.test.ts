import { describe, expect, it } from "vitest";
import { z } from "zod";

import { describeZodSchema, findDrift } from "@/test/api-contract";

const contract = {
  enums: {},
  schemas: {
    Item: { type: "object", properties: { id: { type: "string" } } },
    List: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        kind: { type: "string", enum: ["A", "B"] },
        code: { type: "string", pattern: "x|y" },
        count: { type: "integer" },
        items: { type: "array", items: { $ref: "#/components/schemas/Item" } },
      },
    },
  },
};

const agreeing = {
  id: z.string(),
  kind: z.enum(["B", "A"]).nullable(),
  code: z.enum(["x", "y"]),
  count: z.number(),
  items: z.array(z.object({ id: z.string() })),
};

function driftOf(shape: z.ZodRawShape) {
  return findDrift(
    contract,
    "List",
    contract.schemas.List,
    describeZodSchema(z.object(shape)),
  );
}

describe("findDrift", () => {
  it("accepts a schema that agrees, in any order and with nulls allowed", () => {
    expect(driftOf(agreeing)).toEqual({});
  });

  it("names a value only the backend has", () => {
    expect(driftOf({ ...agreeing, kind: z.enum(["A"]) })).toEqual({
      "List.kind": "backend [A,B], zod [A]",
    });
  });

  it("names a value missing from the backend's validation regex", () => {
    expect(driftOf({ ...agreeing, code: z.enum(["x", "y", "z"]) })).toEqual({
      "List.code": "backend [x,y], zod [x,y,z]",
    });
  });

  it("names a field on one side only, nested ones too", () => {
    const { id: _id, ...withoutId } = agreeing;

    expect(
      driftOf({
        ...withoutId,
        extra: z.string(),
        items: z.array(z.object({ id: z.string(), price: z.number() })),
      }),
    ).toEqual({
      "List.id": "only in the backend",
      "List.extra": "only in the zod schema",
      "List.items[].price": "only in the zod schema",
    });
  });

  it("names a type the zod schema would reject", () => {
    expect(driftOf({ ...agreeing, id: z.number() })).toEqual({
      "List.id": "backend string, zod number",
    });
  });
});
