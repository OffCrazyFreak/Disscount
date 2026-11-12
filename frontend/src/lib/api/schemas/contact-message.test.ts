import { describe, expect, it } from "vitest";

import { contactMessageDtoSchema } from "@/lib/api/schemas/contact-message";

// The shape ContactMessageDto serializes for an anonymous message: Jackson sends every key, unset ones as null.
const anonymousMessage = {
  id: "3e7a1c5b-9d2f-4b6a-8c1e-0f4d2a6b8c90",
  userId: null,
  email: null,
  fullName: null,
  subject: "Pitanje",
  message: "Kada se osvježavaju cijene?",
  sourcePath: null,
  readAt: null,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
  deletedAt: null,
};

describe("contactMessageDtoSchema", () => {
  it("accepts an anonymous message with its unset fields as null", () => {
    const parsed = contactMessageDtoSchema.parse(anonymousMessage);

    expect(parsed.userId).toBeNull();
  });
});
