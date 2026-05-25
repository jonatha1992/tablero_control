# Documentación — Tablero de Control

Índice central de toda la documentación del proyecto. Para inicio rápido ver el [README raíz](../README.md).

---

## Para desarrolladores

| Documento | Descripción |
|---|---|
| [architecture.md](architecture.md) | Stack, capas, estructura de carpetas, flujos, auth, multi-tenant |
| [development.md](development.md) | Setup inicial, comandos, credenciales de emulador, guías rápidas |
| [testing.md](testing.md) | Cómo correr tests, patrones de mock, fixtures, archivos existentes |
| [contributing.md](contributing.md) | Convenciones de código, flujo de branches, PR checklist |

## Infraestructura y deploy

| Documento | Descripción |
|---|---|
| [deploy.md](deploy.md) | Plan de deploy a Railway (Next.js + PostgreSQL) |
| [firebase-setup.md](firebase-setup.md) | Firebase Auth + FCM — solo autenticación y push notifications |

## Funcionalidades del sistema

| Documento | Descripción |
|---|---|
| [permissions.md](permissions.md) | RBAC, roles custom, tenant guard, custom claims |
| [billing.md](billing.md) | Planes, límites, MercadoPago Preapproval, webhooks |
| [superadmin.md](superadmin.md) | Operaciones del superadmin TecnoFusión |

## Para usuarios finales

| Documento | Descripción |
|---|---|
| [user-guide.md](user-guide.md) | Guía completa de uso: kanban, agenda, planificación, equipo, billing, ayuda |

## Especificaciones y planificación

| Documento | Descripción |
|---|---|
| [requisitos-funcionales.md](requisitos-funcionales.md) | Requerimientos funcionales del sistema (v1.0) |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Plan de implementación por fases (estado actual) |

## Archivos pausados / referencia histórica

| Documento | Estado |
|---|---|
| [migration.md](migration.md) | Plan de migración anterior — **pausado**, no ejecutar |

---

## Archivos raíz del proyecto

| Archivo | Propósito |
|---|---|
| `README.md` | Inicio rápido, stack, funcionalidades, variables de entorno, rutas |
| `CLAUDE.md` | Instrucciones para Claude Code — arquitectura, reglas críticas, patrones |
| `prisma/schema.prisma` | Fuente de verdad de los modelos de datos |
| `.env.local` | Variables de entorno locales (no commitear) |
| `.env.example` | Template de variables de entorno |

---

## Convenciones de este proyecto

- **Next.js 16** App Router — Server Components por defecto, `'use client'` solo cuando necesario
- **TypeScript strict** — sin `any`, sin backwards-compat hacks
- **Repositorios**: siempre importar singletons desde `src/repositories/index.ts`
- **Notificaciones**: siempre usar `src/lib/notifications.ts` — escribe en DB + envía FCM
- **Estado de tarea**: siempre `useMoveTask` (no `useUpdateTask`) para cambios de status
- **Sprint tabs**: `useScrumUIStore` es la fuente de verdad — nunca estado local para el sprint seleccionado
- **Firebase**: solo Auth y FCM — sin Firestore, sin Storage
