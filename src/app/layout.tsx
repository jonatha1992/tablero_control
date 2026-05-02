import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ToasterProvider } from "@/components/toaster-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tablero de Control",
  description: "Tablero de control profesional para gestión de tareas y proyectos",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon-cropped.png',
    apple: '/icon-cropped.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tablero",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
        <ToasterProvider />
      </body>
    </html>
  );
}
