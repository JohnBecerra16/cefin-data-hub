import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/db/schema";import {
  brands,
  contacts,
  registrationEvents,
  registrations,
} from "@/db/schema";
import { normalizeEmail } from "@/modules/contacts/normalize-email";

type RegistrationDatabase = NodePgDatabase<typeof schema>;

export type RegistrationAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingUrl?: string;
};

export type CreateRegistrationInput = {
  brandCode: string;
  eventSlug: string;
  contact: {
    name: string;
    email: string;
    phoneE164?: string;
  };
  attribution?: RegistrationAttribution;
};

export type CreateRegistrationResult = {
  contactId: string;
  registrationId: string;
  isNewRegistration: boolean;
  whatsappUrl: string | null;
};

export type RegistrationErrorCode =
  | "EVENT_NOT_AVAILABLE"
  | "DATABASE_INCONSISTENCY";

export class RegistrationServiceError extends Error {
  constructor(
    public readonly code: RegistrationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RegistrationServiceError";
  }
}

export async function createRegistration(
  database: RegistrationDatabase,
  input: CreateRegistrationInput,
): Promise<CreateRegistrationResult> {
  const emailNormalized = normalizeEmail(input.contact.email);
  const emailOriginal = input.contact.email.trim();

  return database.transaction(async (transaction) => {
    const [event] = await transaction
      .select({
        brandId: brands.id,
        eventId: registrationEvents.id,
        whatsappUrl: registrationEvents.whatsappUrl,
      })
      .from(registrationEvents)
      .innerJoin(brands, eq(registrationEvents.brandId, brands.id))
      .where(
        and(
          eq(brands.code, input.brandCode),
          eq(brands.isActive, true),
          eq(registrationEvents.slug, input.eventSlug),
          eq(registrationEvents.status, "active"),
        ),
      )
      .limit(1);

    if (!event) {
      throw new RegistrationServiceError(
        "EVENT_NOT_AVAILABLE",
        "El evento no está disponible para registros.",
      );
    }

    const [createdContact] = await transaction
      .insert(contacts)
      .values({
        brandId: event.brandId,
        name: input.contact.name,
        emailOriginal,
        emailNormalized,
        phoneE164: input.contact.phoneE164 ?? null,
      })
      .onConflictDoNothing({
        target: [contacts.brandId, contacts.emailNormalized],
      })
      .returning({ id: contacts.id });

    const contactId =
      createdContact?.id ??
      (
        await transaction
          .select({ id: contacts.id })
          .from(contacts)
          .where(
            and(
              eq(contacts.brandId, event.brandId),
              eq(contacts.emailNormalized, emailNormalized),
            ),
          )
          .limit(1)
      )[0]?.id;

    if (!contactId) {
      throw new RegistrationServiceError(
        "DATABASE_INCONSISTENCY",
        "No fue posible resolver el contacto.",
      );
    }

    const attribution = input.attribution;

    const [createdRegistration] = await transaction
      .insert(registrations)
      .values({
        brandId: event.brandId,
        contactId,
        eventId: event.eventId,
        source: attribution?.source ?? null,
        medium: attribution?.medium ?? null,
        campaign: attribution?.campaign ?? null,
        utmSource: attribution?.utmSource ?? null,
        utmMedium: attribution?.utmMedium ?? null,
        utmCampaign: attribution?.utmCampaign ?? null,
        utmTerm: attribution?.utmTerm ?? null,
        utmContent: attribution?.utmContent ?? null,
        landingUrl: attribution?.landingUrl ?? null,
      })
      .onConflictDoNothing({
        target: [
          registrations.brandId,
          registrations.contactId,
          registrations.eventId,
        ],
      })
      .returning({ id: registrations.id });

    const registrationId =
      createdRegistration?.id ??
      (
        await transaction
          .select({ id: registrations.id })
          .from(registrations)
          .where(
            and(
              eq(registrations.brandId, event.brandId),
              eq(registrations.contactId, contactId),
              eq(registrations.eventId, event.eventId),
            ),
          )
          .limit(1)
      )[0]?.id;

    if (!registrationId) {
      throw new RegistrationServiceError(
        "DATABASE_INCONSISTENCY",
        "No fue posible resolver la inscripción.",
      );
    }

    return {
      contactId,
      registrationId,
      isNewRegistration: Boolean(createdRegistration),
      whatsappUrl: event.whatsappUrl,
    };
  });
}
