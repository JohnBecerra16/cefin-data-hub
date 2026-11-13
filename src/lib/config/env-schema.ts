import { z } from "zod";

export function createServerEnvSchema(production: boolean) {
  return z.object({
    DATABASE_URL: z.string().url().refine((value) => {
      try {
        const url = new URL(value);
        return ["postgres:", "postgresql:"].includes(url.protocol) && Boolean(url.hostname) && url.pathname.length > 1;
      } catch {
        return false;
      }
    }, "Se requiere una URL de PostgreSQL"),
    ALLOWED_ORIGINS: z.string().min(1).transform((value) => value.split(",").map((origin) => origin.trim()))
      .pipe(z.array(z.string().refine((origin) => {
        try {
          const url = new URL(origin);
          const localHttp = !production && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
          return origin === url.origin && !url.username && !url.password && (url.protocol === "https:" || localHttp);
        } catch {
          return false;
        }
      }, "Se requiere un origen exacto autorizado")).min(1))
      .transform((origins) => [...new Set(origins)]),
  });
}

export function parseServerEnv(input: Record<string, string | undefined>, production: boolean) {
  const result = createServerEnvSchema(production).safeParse(input);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Configuración inválida. Revisar: ${fields.join(", ")}.`);
  }
  return result.data;
}
