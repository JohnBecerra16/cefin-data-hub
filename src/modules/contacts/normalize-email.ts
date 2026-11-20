/**
 * Normaliza el correo para buscar contactos sin alterar su identidad.
 * La validación de formato se incorporará en la capa de entrada.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}