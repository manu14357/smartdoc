// lib/validators/SendMessageValidator.ts
import { z } from 'zod';

export const SendMessageValidator = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  fileId: z.string().uuid("Invalid file ID"),
});

export type SendMessageType = z.infer<typeof SendMessageValidator>;
