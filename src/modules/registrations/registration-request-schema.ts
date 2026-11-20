import { z } from "zod";

const brandCode = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9-]{0,49}$/);

const eventSlug = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9-]{0,99}$/);

const optionalAttributionField = z.string().trim().min(1).max(200).optional();

export const registrationRequestSchema = z
  .object({
    brandCode,
    eventSlug,
    contact: z
      .object({
        name: z.string().trim().min(2).max(150),
        email: z.string().trim().email().max(254),
        phoneE164: z
          .string()
          .trim()
          .regex(/^\+[1-9][0-9]{1,14}$/)
          .optional(),
      })
      .strict(),
    attribution: z
      .object({
        source: optionalAttributionField,
        medium: optionalAttributionField,
        campaign: optionalAttributionField,
        utmSource: optionalAttributionField,
        utmMedium: optionalAttributionField,
        utmCampaign: optionalAttributionField,
        utmTerm: optionalAttributionField,
        utmContent: optionalAttributionField,
        landingUrl: z.string().trim().url().max(2048).optional(),
      })
      .strict()
      .optional(),
    consent: z
      .object({
        privacyNoticeVersion: z.string().trim().min(1).max(50),
        classRegistration: z.literal(true),
        marketing: z.boolean(),
      })
      .strict(),
    antiSpam: z
      .object({
        token: z.string().trim().min(1).max(4096),
        honeypot: z.string().max(0),
      })
      .strict(),
  })
  .strict();

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
