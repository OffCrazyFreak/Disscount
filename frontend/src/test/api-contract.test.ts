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
        kind: { type: ["string", "null"], enum: ["A", "B"] },
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
    "response",
  );
}

describe("findDrift", () => {
  it("accepts a schema that agrees, in any order and with nulls allowed", () => {
    expect(driftOf(agreeing)).toEqual({});
  });

  it("names a value only the backend has", () => {
    expect(driftOf({ ...agreeing, kind: z.enum(["A"]).nullable() })).toEqual({
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

  it("names an enum the backend states no values for, and a union", () => {
    expect(
      driftOf({
        ...agreeing,
        id: z.enum(["x"]),
        code: z.enum(["x", "y"]).or(z.literal("")),
      }),
    ).toEqual({
      "List.id": "zod enum, backend states no values",
      "List.code": "zod union, not compared",
    });
  });

  it("names a type the zod schema would reject", () => {
    expect(driftOf({ ...agreeing, id: z.number() })).toEqual({
      "List.id": "backend string, zod number",
    });
  });
});

const NULLABILITY_CONTRACT = {
  enums: {},
  schemas: {
    Crop: { type: "object", properties: { x: { type: "integer" } } },
    Dto: {
      type: "object",
      properties: {
        note: { type: ["string", "null"] },
        title: { type: "string" },
        // What springdoc writes for a nullable nested DTO.
        crop: { $ref: "#/components/schemas/Crop", type: "null" },
      },
    },
    Request: {
      type: "object",
      required: ["title"],
      properties: {
        note: { type: ["string", "null"] },
        title: { type: "string" },
        flag: { type: "boolean" },
      },
    },
  },
};

const crop = z.object({ x: z.number() });

function responseDriftOf(shape: z.ZodRawShape) {
  return findDrift(
    NULLABILITY_CONTRACT,
    "Dto",
    NULLABILITY_CONTRACT.schemas.Dto,
    describeZodSchema(z.object(shape)),
    "response",
  );
}

function requestDriftOf(shape: z.ZodRawShape) {
  return findDrift(
    NULLABILITY_CONTRACT,
    "Request",
    NULLABILITY_CONTRACT.schemas.Request,
    describeZodSchema(z.object(shape)),
    "request",
  );
}

describe("findDrift nullability of a response", () => {
  const agreeing = {
    note: z.string().nullable(),
    title: z.string(),
    crop: crop.nullable(),
  };

  it("accepts a schema that agrees, a nullable nested DTO included", () => {
    expect(responseDriftOf(agreeing)).toEqual({});
  });

  it("names a null the backend sends and zod rejects", () => {
    expect(
      responseDriftOf({ ...agreeing, note: z.string(), crop: crop }),
    ).toEqual({
      "Dto.note (null)": "backend sends null, zod rejects it",
      "Dto.crop (null)": "backend sends null, zod rejects it",
    });
  });

  it("does not count optional as accepting a null", () => {
    expect(
      responseDriftOf({ ...agreeing, note: z.string().optional() }),
    ).toEqual({ "Dto.note (null)": "backend sends null, zod rejects it" });
  });

  it("names a null zod allows and the backend never sends", () => {
    expect(
      responseDriftOf({ ...agreeing, title: z.string().nullable() }),
    ).toEqual({
      "Dto.title (null)": "zod accepts null, backend never sends it",
    });
  });

  it("names a key zod lets go missing", () => {
    expect(
      responseDriftOf({ ...agreeing, note: z.string().nullish() }),
    ).toEqual({
      "Dto.note (null)": "zod lets the key go missing, backend always sends it",
    });
  });
});

describe("findDrift nullability of a request", () => {
  const agreeing = {
    note: z.string().nullable(),
    title: z.string(),
    flag: z.boolean(),
  };

  it("accepts null, nullish or optional for a field the backend may receive empty", () => {
    expect(requestDriftOf(agreeing)).toEqual({});
    expect(requestDriftOf({ ...agreeing, note: z.string().nullish() })).toEqual(
      {},
    );
    expect(
      requestDriftOf({ ...agreeing, note: z.string().optional() }),
    ).toEqual({});
  });

  it("accepts leaving out a primitive, which keeps its Java default", () => {
    expect(
      requestDriftOf({ ...agreeing, flag: z.boolean().optional() }),
    ).toEqual({});
  });

  it("names a required field zod can leave empty", () => {
    expect(
      requestDriftOf({ ...agreeing, title: z.string().optional() }),
    ).toEqual({
      "Request.title (null)":
        "backend requires a value, zod can leave it empty",
    });
  });

  it("names a null the backend does not accept", () => {
    expect(
      requestDriftOf({ ...agreeing, flag: z.boolean().nullable() }),
    ).toEqual({
      "Request.flag (null)": "zod can send null, backend does not accept it",
    });
  });

  it("names a value zod demands although the backend takes null", () => {
    expect(requestDriftOf({ ...agreeing, note: z.string() })).toEqual({
      "Request.note (null)": "backend accepts null, zod always demands a value",
    });
  });
});
