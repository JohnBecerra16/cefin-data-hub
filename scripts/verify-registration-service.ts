import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import {
  brands,
  contactConsents,
  contacts,
  registrationEvents,
  registrations,
} from "../src/db/schema";
import {
  createRegistration,
  RegistrationServiceError,
} from "../src/modules/registrations/registration-service";

const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const brandCode = `test-${suffix}`;
const firstEventSlug = `imss-${suffix}`;
const secondEventSlug = `nif-${suffix}`;
const closedEventSlug = `closed-${suffix}`;
const consent = {
  privacyNoticeVersion: "test-1",
  marketing: false,
  evidence: "integration-test",
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  const database = drizzle(pool, { schema });
  let brandId: string | undefined;

  try {
    const [brand] = await database
      .insert(brands)
      .values({
        code: brandCode,
        name: "Marca temporal de integración",
      })
      .returning({ id: brands.id });

    brandId = brand.id;

    await database.insert(registrationEvents).values([
      {
        brandId,
        name: "Evento IMSS temporal",
        slug: firstEventSlug,
        status: "active",
        whatsappUrl: "https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv",
        privacyNoticeVersion: "test-1",
      },
      {
        brandId,
        name: "Evento NIF temporal",
        slug: secondEventSlug,
        status: "active",
        whatsappUrl: "https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv",
        privacyNoticeVersion: "test-1",
      },
      {
        brandId,
        name: "Evento cerrado temporal",
        slug: closedEventSlug,
        status: "closed",
        whatsappUrl: "https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv",
        privacyNoticeVersion: "test-1",
      },
    ]);

    const first = await createRegistration(database, {
      brandCode,
      eventSlug: firstEventSlug,
      contact: {
        name: "Alumna de prueba",
        email: "  alumna+prueba@ejemplo.test  ",
      },
      consent,
      attribution: {
        utmSource: "integration-test",
      },
    });

    assert.equal(first.isNewRegistration, true);

    const duplicate = await createRegistration(database, {
      brandCode,
      eventSlug: firstEventSlug,
      contact: {
        name: "Nombre diferente que no debe sobrescribir",
        email: "ALUMNA+PRUEBA@EJEMPLO.TEST",
      },
      consent,
    });

    assert.equal(duplicate.isNewRegistration, false);
    assert.equal(duplicate.contactId, first.contactId);
    assert.equal(duplicate.registrationId, first.registrationId);

    const concurrent = await Promise.all([
      createRegistration(database, {
        brandCode,
        eventSlug: secondEventSlug,
        contact: {
          name: "Alumna de prueba",
          email: "alumna+prueba@ejemplo.test",
        },
        consent,
      }),
      createRegistration(database, {
        brandCode,
        eventSlug: secondEventSlug,
        contact: {
          name: "Alumna de prueba",
          email: "alumna+prueba@ejemplo.test",
        },
        consent,
      }),
    ]);

    assert.equal(concurrent[0].contactId, first.contactId);
    assert.equal(concurrent[1].contactId, first.contactId);
    assert.equal(concurrent[0].registrationId, concurrent[1].registrationId);
    assert.equal(
      concurrent.filter((result) => result.isNewRegistration).length,
      1,
    );

    await assert.rejects(
      () =>
        createRegistration(database, {
          brandCode,
          eventSlug: closedEventSlug,
          contact: {
            name: "Alumna de prueba",
            email: "alumna+prueba@ejemplo.test",
          },
          consent,
        }),
      (error: unknown) =>
        error instanceof RegistrationServiceError &&
        error.code === "EVENT_NOT_AVAILABLE",
    );

    const registrationRows = await database
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.brandId, brandId),
          eq(registrations.contactId, first.contactId),
        ),
      );

    assert.equal(registrationRows.length, 2);

    const consentRows = await database
      .select({ id: contactConsents.id })
      .from(contactConsents)
      .where(eq(contactConsents.brandId, brandId));

    assert.equal(consentRows.length, 4);

    console.log("Registration integration verification passed.");
  } finally {
    try {
      if (brandId) {
        await database
          .delete(contactConsents)
          .where(eq(contactConsents.brandId, brandId));
        await database
          .delete(registrations)
          .where(eq(registrations.brandId, brandId));

        await database
          .delete(registrationEvents)
          .where(eq(registrationEvents.brandId, brandId));

        await database.delete(contacts).where(eq(contacts.brandId, brandId));

        await database.delete(brands).where(eq(brands.id, brandId));
      }
    } finally {
      await pool.end();
    }
  }
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Integration verification failed.",
    );
    process.exit(1);
  });
