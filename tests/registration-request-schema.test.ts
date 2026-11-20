import assert from "node:assert/strict";
import test from "node:test";
import { registrationRequestSchema } from "../src/modules/registrations/registration-request-schema";

const validRequest = {
  brandCode: "cefin",
  eventSlug: "curso-imss",
  contact: {
    name: "María González",
    email: "maria@example.com",
    phoneE164: "+525512345678",
  },
  attribution: {
    utmSource: "meta",
    utmMedium: "paid-social",
    utmCampaign: "curso-imss-noviembre",
    landingUrl: "https://cefin.mx/curso-imss",
  },
  consent: {
    privacyNoticeVersion: "2026-01",
    classRegistration: true,
    marketing: false,
  },
  antiSpam: {
    token: "turnstile-token-temporal",
    honeypot: "",
  },
};

test("acepta una solicitud de registro válida", () => {
  const result = registrationRequestSchema.safeParse(validRequest);

  assert.equal(result.success, true);
});

test("rechaza campos desconocidos", () => {
  const result = registrationRequestSchema.safeParse({
    ...validRequest,
    isAdmin: true,
  });

  assert.equal(result.success, false);
});

test("rechaza honeypot lleno y consentimiento obligatorio ausente", () => {
  const honeypotResult = registrationRequestSchema.safeParse({
    ...validRequest,
    antiSpam: {
      ...validRequest.antiSpam,
      honeypot: "bot",
    },
  });

  const consentResult = registrationRequestSchema.safeParse({
    ...validRequest,
    consent: {
      ...validRequest.consent,
      classRegistration: false,
    },
  });

  assert.equal(honeypotResult.success, false);
  assert.equal(consentResult.success, false);
});
