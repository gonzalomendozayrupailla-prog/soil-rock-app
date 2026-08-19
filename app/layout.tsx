import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Soil Rock",
  description: "Sistema de gestión de proyectos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} style={{ height: "100%" }}>
      <body style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </body>
    </html>
  );
}
