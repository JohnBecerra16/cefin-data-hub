import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "../src/db";
import {
  brands,
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

async function main() {
  const database = getDatabase();
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

    const first = await createRegistration({
      brandCode,
      eventSlug: firstEventSlug,
      contact: {
        name: "Alumna de prueba",
        email: "  alumna+prueba@ejemplo.test  ",
      },
      attribution: {
        utmSource: "integration-test",
      },
    });

    assert.equal(first.isNewRegistration, true);

    const duplicate = await createRegistration({
      brandCode,
      eventSlug: firstEventSlug,
      contact: {
        name: "Nombre diferente que no debe sobrescribir",
        email: "ALUMNA+PRUEBA@EJEMPLO.TEST",
      },
    });

    assert.equal(duplicate.isNewRegistration, false);
    assert.equal(duplicate.contactId, first.contactId);
    assert.equal(duplicate.registrationId, first.registrationId);

    const concurrent = await Promise.all([
      createRegistration({
        brandCode,
        eventSlug: secondEventSlug,
        contact: {
          name: "Alumna de prueba",
          email: "alumna+prueba@ejemplo.test",
        },
      }),
      createRegistration({
        brandCode,
        eventSlug: secondEventSlug,
        contact: {
          name: "Alumna de prueba",
          email: "alumna+prueba@ejemplo.test",
        },
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
        createRegistration({
          brandCode,
          eventSlug: closedEventSlug,
          contact: {
            name: "Alumna de prueba",
            email: "alumna+prueba@ejemplo.test",
          },
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

    console.log("Registration integration verification passed.");
  } finally {
    if (brandId) {
      await database
        .delete(registrations)
        .where(eq(registrations.brandId, brandId));

      await database
        .delete(registrationEvents)
        .where(eq(registrationEvents.brandId, brandId));

      await database.delete(contacts).where(eq(contacts.brandId, brandId));

      await database.delete(brands).where(eq(brands.id, brandId));
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
