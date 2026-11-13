import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEFIN Data Hub",
  description: "Plataforma de captación y gestión de contactos de CEFIN.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX"><body>{children}</body></html>;
}
