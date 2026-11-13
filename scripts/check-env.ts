import { parseServerEnv } from "../src/lib/config/env-schema";

try {
  parseServerEnv(process.env, process.env.NODE_ENV === "production");
  console.info("Configuración válida. La conectividad a PostgreSQL no fue comprobada.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Configuración inválida.");
  process.exitCode = 1;
}
