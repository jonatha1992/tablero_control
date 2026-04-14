# 📐 Arquitectura del Sistema - Tablero de Control

## Overview

Tablero de Control es una aplicación web profesional para gestión de tareas y proyectos, construida con Next.js 16 y Firebase.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.3 |
| **UI Library** | React | 19.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | Radix UI | latest |
| **State (client)** | Zustand | 5.x |
| **State (server)** | React Query | 5.x |
| **Tables** | TanStack Table | 8.x |
| **Calendar** | FullCalendar | 6.x |
| **Charts** | Recharts | 3.x |
| **Backend** | Firebase | 12.x |
| - Auth | Firebase Authentication | |
| - Database | Firestore | |
| - Storage | Firebase Storage | |
| **Fechas** | date-fns | 4.x |
| **Iconos** | lucide-react | 1.x |

## Estructura del Proyecto

```
tablero_control/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Route group: autenticación
│   │   │   ├── layout.tsx          # Layout centrado sin sidebar
│   │   │   ├── login/page.tsx      # Login form
│   │   │   └── register/page.tsx   # Registro
│   │   ├── (dashboard)/            # Route group: app principal
│   │   │   ├── layout.tsx          # Layout con sidebar + header
│   │   │   ├── page.tsx            # Dashboard overview
│   │   │   ├── tareas/page.tsx     # Gestión de tareas
│   │   │   ├── calendario/page.tsx # Calendario
│   │   │   ├── reportes/page.tsx   # Reportes
│   │   │   ├── equipo/page.tsx     # Gestión equipo
│   │   │   └── config/page.tsx     # Configuración
│   │   ├── api/                    # API routes
│   │   │   └── auth/               # Auth endpoints
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   └── globals.css             # Global styles + theme
│   ├── components/
│   │   ├── ui/                     # Componentes base (patrón shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── avatar.tsx
│   │   ├── layout/                 # Componentes de layout
│   │   │   ├── sidebar.tsx         # Sidebar navigation
│   │   │   └── header.tsx          # Header con search y perfil
│   │   ├── dashboard/              # Widgets del dashboard
│   │   ├── calendario/             # Componentes del calendario
│   │   └── tareas/                 # Componentes de tareas
│   ├── lib/
│   │   ├── firebase/               # Firebase configuration
│   │   │   ├── client.ts           # Firebase client SDK
│   │   │   ├── admin.ts            # Firebase Admin SDK (server)
│   │   │   ├── auth.ts             # Auth helpers
│   │   │   ├── firestore.ts        # CRUD helpers
│   │   │   └── storage.ts          # Storage helpers
│   │   └── utils.ts                # Utility functions
│   ├── hooks/                      # Custom React hooks
│   ├── stores/                     # Zustand stores
│   ├── types/                      # TypeScript type definitions
│   │   └── index.ts                # Todos los tipos del sistema
│   ├── agents/                     # Documentación agentes IA
│   └── test/                       # Test utilities
│       ├── mocks/                  # Mock data
│       └── seed.ts                 # Seed script para emuladores
├── .agent-architect.md             # Architect Agent (guía de arquitectura)
├── .agent-codegen.md               # Code Generation Agent (patrones de código)
├── .agent-testing.md               # Testing Agent (guía de testing)
├── firebase.json                   # Firebase config + emulators
├── .firebaserc                     # Firebase project alias
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore composite indexes
├── storage.rules                   # Firebase Storage rules
├── .env.local                      # Environment variables (gitignored)
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Modelo de Datos

### Firestore Collections

```
locations/
  { id, name, type, description, address, managerId, teamIds[], status,
    operatingHours, metadata, taskIds[], createdAt, updatedAt }
  type: definido por el admin ('local', 'sector', 'area', 'sucursal', etc.)
  status: 'active' | 'inactive' | 'maintenance' | 'closed' | 'incident'

users/
  { id, name, email, role, avatar, teamIds[], preferences, createdAt, updatedAt }

teams/
  { id, name, description, memberIds[], leadId, settings, createdAt, updatedAt }

projects/
  { id, name, description, teamId, status, taskIds[], startDate, endDate }

tasks/
  { id, title, description, status, priority, type, assigneeIds[], creatorId,
    projectId, locationId, tags[], startDate, dueDate, completedDate, estimatedHours,
    actualHours, recurrence, subtaskIds[], attachmentUrls[], position,
    createdAt, updatedAt }

reports/
  { id, type, title, content, metrics, generatedBy, date, period }

alerts/
  { id, type, severity, title, message, taskId, projectId,
    resolved, resolvedBy, resolvedAt, createdAt }

agentLogs/
  { id, agentName, action, input, output, status, error, durationMs, timestamp }

notifications/
  { id, type, message, targetRole, targetAssignees, read, createdAt }
```

## Security Rules

### Roles y Permisos

| Acción | Admin | Manager | Member |
|--------|-------|---------|--------|
| Leer usuarios | ✅ (todos) | ✅ (todos) | ✅ (propio) |
| Crear usuarios | ✅ | ❌ | ❌ |
| Editar usuarios | ✅ | ❌ | ✅ (propio) |
| Leer tareas | ✅ | ✅ | ✅ |
| Crear tareas | ✅ | ✅ | ❌ |
| Editar tareas | ✅ | ✅ | ✅ (asignadas) |
| Eliminar tareas | ✅ | ✅ | ❌ |
| Leer reportes | ✅ | ✅ | ✅ |
| Crear reportes | ✅ | ✅ | ❌ |
| Leer alertas | ✅ | ✅ | ✅ |
| Resolver alertas | ✅ | ✅ | ❌ |

## Flujo de Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar emuladores Firebase (auth, firestore, storage)
npm run emulators
# → http://localhost:4000 (Emulator UI)

# 3. En otra terminal, iniciar Next.js
npm run dev
# → http://localhost:3000

# 4. (Opcional) Cargar datos de prueba
npm run seed

# 5. Ejecutar tests
npm test
```

## Variables de Entorno

```env
# Firebase Client (obligatorias)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestordetrabajo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestordetrabajo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gestordetrabajo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Emulator mode (desarrollo)
NEXT_PUBLIC_USE_EMULATOR=false

# Firebase Admin (server-side)
FIREBASE_SERVICE_ACCOUNT={...}
```

## Agentes de Desarrollo

El proyecto utiliza 3 agentes de IA como guías de desarrollo:

1. **Architect Agent** (`.agent-architect.md`): Define arquitectura, estructura y decisiones de diseño.
2. **Code Generation Agent** (`.agent-codegen.md`): Define patrones de código, convenciones y templates.
3. **Testing Agent** (`.agent-testing.md`): Define estrategias y patrones de testing.

Estos agentes **no son parte de la aplicación** — son archivos de guía para Qwen Code y Claude.
