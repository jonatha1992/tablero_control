import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Permite que el popup de Google OAuth se cierre correctamente.
            // Next.js 15+ agrega same-origin por defecto, lo que bloquea
            // window.close() desde popups de autenticación de terceros.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
