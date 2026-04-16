<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Tablero de Control — Contexto del Proyecto

## Qué es
SaaS multi-tenant de gestión de tareas y proyectos. Cada negocio (Business) tiene sus propios locales, equipos y usuarios. La empresa dueña del sistema es TecnoFusión (superadmin).

## Stack
- **Next.js 16** App Router + React 19 + TypeScript strict
- **Firebase** proyecto `gestordetrabajo` — Auth, Firestore, Storage
- **Estado client**: Zustand 5 | **Estado server**: React Query 5
- **UI**: Tailwind CSS 4 + Radix UI (patrón shadcn/ui)
- **Tests**: Vitest + Testing Library + Firebase Emulator

## Jerarquía de roles (multi-tenant)
```
superadmin  → TecnoFusión — acceso total al sistema
admin       → Admin de un negocio — gestiona su empresa
responsable → Responsable de un local/sector
miembro     → Trabaja dentro de un local
viewer      → Solo lectura
```

## Fase actual de desarrollo
**Fase 3 — UI Layout**: sidebar, header, navegación principal.
Fases 0–2 completadas: setup, tipos TypeScript, Firebase config.

## Reglas críticas
- Server Components por defecto — `'use client'` solo cuando sea necesario
- Firebase client SDK **solo** en componentes con `'use client'`
- Firebase Admin SDK **solo** en Server Components y API routes
- Path alias `@/` para todos los imports internos
- `cn()` de `@/lib/utils` para clases condicionales de Tailwind
- No usar `any` en TypeScript

## Comandos de desarrollo
```bash
npm run dev:all        # Inicia Firebase Emulators + Next.js juntos
npm run seed           # Carga datos de prueba en los emuladores
npm run test:run       # Tests sin modo watch
npm run type:check     # Verifica tipos sin compilar
npm run check          # lint + tipos + tests (pre-commit)
```

## Estructura clave
```
src/
├── app/              # App Router (page.tsx, layout.tsx)
├── components/ui/    # Componentes base reutilizables
├── lib/firebase/     # client.ts, admin.ts, auth.ts, firestore.ts
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
└── types/index.ts    # Todos los tipos del sistema
```
