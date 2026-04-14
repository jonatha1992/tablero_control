# Tablero de Control Profesional

> Sistema de gestión de tareas y proyectos con Next.js 16 + Firebase

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- npm 9+

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Ya están configuradas en .env.local con las credenciales de Firebase

# 3. Iniciar emuladores Firebase (para desarrollo local)
npm run emulators

# 4. En otra terminal, iniciar Next.js
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar Next.js en desarrollo |
| `npm run emulators` | Iniciar Firebase Emulators |
| `npm run dev:all` | Iniciar ambos (Next.js + Emulators) |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en producción |
| `npm run lint` | Ejecutar linter |
| `npm run seed` | Cargar datos de prueba en emuladores |
| `npm run seed:export` | Exportar datos de emuladores |
| `npm test` | Ejecutar tests en watch mode |
| `npm run test:run` | Ejecutar tests una vez |
| `npm run test:ui` | Ejecutar tests con UI |

## 🏗️ Arquitectura

### Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + Radix UI
- **Backend**: Firebase (gestordetrabajo)
- **Estado**: Zustand (client) + React Query (server)
- **Calendario**: FullCalendar 6
- **Gráficos**: Recharts 3

### Estructura

```
src/
├── app/              # Next.js App Router (routes)
├── components/       # UI components
├── lib/              # Firebase config + utils
├── hooks/            # Custom hooks
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── test/             # Test utilities
```

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para el detalle completo.

## 📖 Documentación

- [Arquitectura](docs/ARQUITECTURA.md) — Diseño completo del sistema
- [Guía de Usuario](docs/GUIA-USUARIO.md) — Cómo usar el tablero
- [Firebase Setup](docs/FIREBASE-SETUP.md) — Configurar Firebase y emuladores
- [Testing Guide](docs/TESTING.md) — Cómo ejecutar y escribir tests
- [Contributing](docs/CONTRIBUTING.md) — Cómo contribuir al proyecto

## 🤖 Agentes de Desarrollo

Este proyecto utiliza agentes de IA como guías de desarrollo:

- **`.agent-architect.md`**: Arquitectura y decisiones de diseño
- **`.agent-codegen.md`**: Patrones y convenciones de código
- **`.agent-testing.md`**: Estrategias y patrones de testing

Estos agentes **no son parte de la aplicación** — son guías para Qwen Code y Claude.

## 🔥 Firebase

- **Project ID**: `gestordetrabajo`
- **Emulator UI**: http://localhost:4000

Para desarrollo local, los emuladores simulan Auth, Firestore y Storage sin necesidad de conexión a internet ni costos.

## 📊 Estado Actual

| Módulo | Estado |
|--------|--------|
| Setup + Config | ✅ Completo |
| Firebase (rules, helpers) | ✅ Completo |
| UI Components base | ✅ Completo |
| Layout (sidebar, header) | ✅ Completo |
| Auth + Roles + Protected routes | ✅ Completo |
| Kanban board con drag & drop | ✅ Completo |
| Scrum (sprints, velocity, backlog) | ✅ Stores listos |
| Locales/Sectores (genérico, admin-defined) | ✅ Types + stores |
| Dashboard page | ⏳ Placeholder |
| Calendario | ⏳ Pendiente |
| Reportes | ⏳ Pendiente |
| Testing | ✅ 34/34 passing |

## 📝 License

Private project.
