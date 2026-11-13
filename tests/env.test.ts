import assert from "node:assert/strict";
import test from "node:test";
import { parseServerEnv } from "../src/lib/config/env-schema";

const valid = { DATABASE_URL: "postgresql://user:secret@db.example:5432/cefin", ALLOWED_ORIGINS: "https://landing.example" };

test("acepta PostgreSQL y elimina orígenes repetidos", () => {
  const env = parseServerEnv({ ...valid, ALLOWED_ORIGINS: "https://landing.example, https://landing.example" }, true);
  assert.deepEqual(env.ALLOWED_ORIGINS, ["https://landing.example"]);
});

test("rechaza configuración incompleta sin revelar secretos", () => {
  assert.throws(() => parseServerEnv({ DATABASE_URL: "secreto-que-no-debe-aparecer" }, true), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /DATABASE_URL/);
    assert.match(error.message, /ALLOWED_ORIGINS/);
    assert.doesNotMatch(error.message, /secreto-que-no-debe-aparecer/);
    return true;
  });
});

test("rechaza protocolos incorrectos y base sin nombre", () => {
  for (const DATABASE_URL of ["https://db.example/cefin", "postgresql://db.example/"]) {
    assert.throws(() => parseServerEnv({ ...valid, DATABASE_URL }, true));
  }
});

test("rechaza orígenes ambiguos, rutas, credenciales, comodines y HTTP externo", () => {
  for (const ALLOWED_ORIGINS of ["*", "null", "", "https://landing.example/", "https://landing.example/path", "https://landing.example?x=1", "https://user:pass@landing.example", "http://landing.example", "https://landing.example,"]) {
    assert.throws(() => parseServerEnv({ ...valid, ALLOWED_ORIGINS }, true));
  }
});

test("permite HTTP local solo fuera de producción", () => {
  assert.doesNotThrow(() => parseServerEnv({ ...valid, ALLOWED_ORIGINS: "http://localhost:3000" }, false));
  assert.throws(() => parseServerEnv({ ...valid, ALLOWED_ORIGINS: "http://localhost:3000" }, true));
});
