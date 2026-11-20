import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail } from "../src/modules/contacts/normalize-email";

test("normaliza espacios extremos y mayúsculas", () => {
  assert.equal(
    normalizeEmail("  Maria.Gonzalez@Ejemplo.COM  "),
    "maria.gonzalez@ejemplo.com",
  );
});

test("conserva puntos y alias con signo más", () => {
  assert.equal(
    normalizeEmail("maria+imss@ejemplo.com"),
    "maria+imss@ejemplo.com",
  );
});