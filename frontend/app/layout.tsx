import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Une seule famille, comme Basic-Fit (Heading Pro Treble) :
// Archivo — heavy pour les titres, regular pour le corps.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CHKN-FIT",
  description:
    "Le suivi sportif de l'équipe : planning intelligent, progression, physique, classement.",
  appleWebApp: {
    capable: true,
    title: "CHKN-FIT",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
