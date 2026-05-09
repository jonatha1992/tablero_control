import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "0.0.0",
    NEXT_PUBLIC_GIT_HASH: getGitHash(),
    NEXT_PUBLIC_BUILD_ENV: process.env.NODE_ENV ?? "development",
  },
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
