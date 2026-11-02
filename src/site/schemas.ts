import { z } from "zod";
import { CONTACT_TOPICS } from "@/site/constants";

export const contactSchema = z
  .object({
    topic: z.enum(CONTACT_TOPICS),
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().email("Enter a valid email").max(200),
    phone: z.union([z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"), z.literal("")]).optional(),
    businessName: z.string().trim().max(120).optional(),
    message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(3000),
    // Honeypot: real people never see or fill this field.
    website: z.string().max(0).optional(),
  })
  .strict();
