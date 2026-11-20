import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow();
const id = () => uuid("id").defaultRandom().primaryKey();

export const brands = pgTable(
  "brands",
  {
    id: id(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "brands_code_format",
      sql`${table.code} ~ '^[a-z0-9][a-z0-9-]{0,49}$'`,
    ),
  ],
);

export const contacts = pgTable(
  "contacts",
  {
    id: id(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 150 }).notNull(),
    emailOriginal: varchar("email_original", { length: 254 }).notNull(),
    emailNormalized: varchar("email_normalized", { length: 254 }).notNull(),
    phoneE164: varchar("phone_e164", { length: 16 }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("contacts_brand_id_id_unique").on(table.brandId, table.id),
    uniqueIndex("contacts_brand_email_unique").on(
      table.brandId,
      table.emailNormalized,
    ),
    index("contacts_brand_created_at_idx").on(table.brandId, table.createdAt),
    check(
      "contacts_email_normalized_lower",
      sql`${table.emailNormalized} = lower(btrim(${table.emailNormalized}))`,
    ),
    check(
      "contacts_phone_e164_format",
      sql`${table.phoneE164} is null or ${table.phoneE164} ~ '^\\+[1-9][0-9]{1,14}$'`,
    ),
  ],
);

export const registrationEvents = pgTable(
  "registration_events",
  {
    id: id(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    status: varchar("status", { length: 12 }).notNull().default("draft"),
    whatsappUrl: varchar("whatsapp_url", { length: 2048 }),
    privacyNoticeVersion: varchar("privacy_notice_version", {
      length: 50,
    }).notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("registration_events_brand_id_id_unique").on(
      table.brandId,
      table.id,
    ),
    uniqueIndex("registration_events_brand_slug_unique").on(
      table.brandId,
      table.slug,
    ),
    index("registration_events_brand_status_idx").on(
      table.brandId,
      table.status,
    ),
    check(
      "registration_events_status_check",
      sql`${table.status} in ('draft', 'active', 'closed')`,
    ),
    check(
      "registration_events_slug_format",
      sql`${table.slug} ~ '^[a-z0-9][a-z0-9-]{0,99}$'`,
    ),
    check(
      "registration_events_whatsapp_invite",
      sql`${table.whatsappUrl} is null or ${table.whatsappUrl} ~ '^https://chat\\.whatsapp\\.com/[A-Za-z0-9_-]+/?$'`,
    ),
  ],
);

export const registrations = pgTable(
  "registrations",
  {
    id: id(),
    brandId: uuid("brand_id").notNull(),
    contactId: uuid("contact_id").notNull(),
    eventId: uuid("event_id").notNull(),
    source: varchar("source", { length: 200 }),
    medium: varchar("medium", { length: 200 }),
    campaign: varchar("campaign", { length: 200 }),
    utmSource: varchar("utm_source", { length: 200 }),
    utmMedium: varchar("utm_medium", { length: 200 }),
    utmCampaign: varchar("utm_campaign", { length: 200 }),
    utmTerm: varchar("utm_term", { length: 200 }),
    utmContent: varchar("utm_content", { length: 200 }),
    landingUrl: varchar("landing_url", { length: 2048 }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("registrations_brand_id_id_contact_id_unique").on(
      table.brandId,
      table.id,
      table.contactId,
    ),
    uniqueIndex("registrations_contact_event_unique").on(
      table.brandId,
      table.contactId,
      table.eventId,
    ),
    index("registrations_brand_event_created_idx").on(
      table.brandId,
      table.eventId,
      table.createdAt,
    ),
    index("registrations_brand_created_idx").on(table.brandId, table.createdAt),
    foreignKey({
      name: "registrations_contact_brand_fk",
      columns: [table.brandId, table.contactId],
      foreignColumns: [contacts.brandId, contacts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "registrations_event_brand_fk",
      columns: [table.brandId, table.eventId],
      foreignColumns: [registrationEvents.brandId, registrationEvents.id],
    }).onDelete("restrict"),
  ],
);

export const contactConsents = pgTable(
  "contact_consents",
  {
    id: id(),
    brandId: uuid("brand_id").notNull(),
    contactId: uuid("contact_id").notNull(),
    registrationId: uuid("registration_id").notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    granted: boolean("granted").notNull(),
    privacyNoticeVersion: varchar("privacy_notice_version", {
      length: 50,
    }).notNull(),
    evidence: varchar("evidence", { length: 500 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("contact_consents_brand_contact_created_idx").on(
      table.brandId,
      table.contactId,
      table.createdAt,
    ),
    foreignKey({
      name: "contact_consents_registration_contact_fk",
      columns: [table.brandId, table.registrationId, table.contactId],
      foreignColumns: [
        registrations.brandId,
        registrations.id,
        registrations.contactId,
      ],
    }).onDelete("restrict"),
    check(
      "contact_consents_purpose_check",
      sql`${table.purpose} in ('class_registration', 'marketing')`,
    ),
  ],
);

export const registrationAttempts = pgTable(
  "registration_attempts",
  {
    id: id(),
    requestId: uuid("request_id").notNull(),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "restrict",
    }),
    eventId: uuid("event_id"),
    result: varchar("result", { length: 16 }).notNull(),
    errorCode: varchar("error_code", { length: 60 }),
    createdAt: createdAt(),
  },
  (table) => [
    index("registration_attempts_created_at_idx").on(table.createdAt),
    index("registration_attempts_request_id_idx").on(table.requestId),
    foreignKey({
      name: "registration_attempts_event_brand_fk",
      columns: [table.brandId, table.eventId],
      foreignColumns: [registrationEvents.brandId, registrationEvents.id],
    }).onDelete("restrict"),
    check(
      "registration_attempts_result_check",
      sql`${table.result} in ('accepted', 'rejected', 'failed', 'rate_limited')`,
    ),
    check(
      "registration_attempts_event_requires_brand",
      sql`${table.eventId} is null or ${table.brandId} is not null`,
    ),
  ],
);

export const registrationRequests = pgTable(
  "registration_requests",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    idempotencyKey: uuid("idempotency_key").notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    response: jsonb("response")
      .$type<{
        ok: true;
        requestId: string;
        confirmationToken: string;
        conversionEventId: string;
      }>()
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({
      name: "registration_requests_brand_key_pk",
      columns: [table.brandId, table.idempotencyKey],
    }),
    index("registration_requests_expires_at_idx").on(table.expiresAt),
    check(
      "registration_requests_hash_format",
      sql`${table.requestHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
    count: integer("count").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [
    index("rate_limit_buckets_expires_at_idx").on(table.expiresAt),
    check(
      "rate_limit_buckets_hash_format",
      sql`${table.keyHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check("rate_limit_buckets_count_nonnegative", sql`${table.count} >= 0`),
  ],
);
