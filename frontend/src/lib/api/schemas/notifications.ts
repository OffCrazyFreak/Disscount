import { z } from "zod";

// Notification schemas
export const notificationRequestSchema = z.object({
  message: z.string().min(1, "Poruka je obavezna"),
  relatedProductApiId: z.string().optional(),
  relatedStoreApiId: z.string().optional(),
});

export const notificationDtoSchema = notificationRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

// Type exports
export type NotificationRequest = z.infer<typeof notificationRequestSchema>;
export type NotificationDto = z.infer<typeof notificationDtoSchema>;
