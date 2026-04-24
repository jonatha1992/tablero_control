'use client';

import dynamic from 'next/dynamic';

// Importación dinámica sin SSR para evitar problemas de hidratación con Turbopack
const Toaster = dynamic(
  () => import('sonner').then((mod) => ({ default: mod.Toaster })),
  { ssr: false }
);

/**
 * ToasterProvider — Monta el Toaster de Sonner globalmente.
 * Se importa en el root layout (app/layout.tsx).
 * dynamic + ssr:false garantiza que siempre monta en el cliente.
 */
export function ToasterProvider() {
  return (
    <Toaster
      theme="system"
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{ style: { fontFamily: 'inherit' } }}
    />
  );
}
