import { z } from "zod";

// One signed-in device as /api/account/sessions lists it: never the token or the IP.
export const accountSessionDtoSchema = z.object({
  id: z.string(),
  isCurrent: z.boolean(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).nullable(),
  country: z.string().nullable(),
  lastActiveAt: z.string(),
});

export type AccountSessionDto = z.infer<typeof accountSessionDtoSchema>;
