import "server-only";
import { parseServerEnv } from "./env-schema";

// Validación diferida: la página estática puede compilar sin credenciales.
// Los futuros módulos de servidor deben llamar esta función antes de operar.
export function getServerEnv() {
  return parseServerEnv(process.env, process.env.NODE_ENV === "production");
}
