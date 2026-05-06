# Tablero de Control

> **SaaS multi-tenant de gestión de tareas y proyectos** que fusiona la simplicidad visual de Trello con la potencia estructural de Jira. Diseñado para organizaciones con múltiples sedes, equipos y proyectos concurrentes.

---

## 🎯 Visión del Producto

**Tablero de Control** nace de la unión de dos paradigmas:
- **La simplicidad de Trello**: tableros visuales, drag & drop intuitivo, y flujos ágiles.
- **La estructura de Jira**: jerarquía organizacional, tipos de tarea, prioridades, estados de workflow, y trazabilidad completa.

El resultado es una plataforma donde un negocio puede gestionar desde tareas operativas del día a día hasta proyectos estructurados con múltiples equipos, locales y responsables — todo con control de acceso granular y facturación integrada.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 22+ (ver `.nvmrc`)
- **PostgreSQL** 14+ (local, Railway, o similar)
- **Cuenta Firebase** (para Auth)
- **Cuenta MercadoPago** (para billing en producción)

### Setup Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Sincronizar base de datos
npx prisma db push

# 4. Cargar datos de prueba
npm run seed:pg
npm run seed:superadmin

# 5. Iniciar desarrollo
npm run dev:all      # Firebase Emulators + Next.js
```

Abrir [http://localhost:3000](http://localhost:3000).

### Credenciales de desarrollo (emulador)

| Rol | Email | Contraseña |
|---|---|---|
| Superadmin | admin@tecnofusion.it | superadmin123 |
| Admin | admin@negocio.com | admin123 |
| Responsable | resp-local1@negocio.com | resp123 |
| Miembro | ana@negocio.com | ana123 |
| Viewer | viewer@negocio.com | viewer123 |

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 16.2.3 |
| UI | React + TypeScript strict | 19.2.4 / TS 5 |
| Estilos | Tailwind CSS + Radix UI | Tailwind 4 |
| Estado UI | Zustand | 5.0.12 |
| Estado servidor | TanStack Query (React Query) | 5.99.0 |
| Auth | Firebase Auth | 12.12.0 (cliente) / 13.8.0 (admin) |
| Base de datos | PostgreSQL + Prisma ORM | Prisma 7.7.0 con `@prisma/adapter-pg` |
| Archivos | Cloudinary | SDK v2 |
| Pagos | MercadoPago | Preapproval API |
| Email | Resend + React Email | — |
| IA / Audio | Groq SDK | Transcripción + extracción de tareas |
| Calendario | FullCalendar | 6.1.20 |
| Gráficos | Recharts | 3.8.1 |
| Drag & Drop | @dnd-kit | — |
| Tests | Vitest + Testing Library + Playwright | Vitest 4 |

### Filosofía de Capas

```
components / pages
      ↓
hooks/queries + hooks/mutations     ← React Query (server state)
hooks/stores                        ← Zustand (UI state)
      ↓
services/                           ← lógica de negocio
      ↓
repositories/                       ← acceso a datos (interfaces)
      ↓
repositories/prisma/                ← implementación principal
      ↓
Base de Datos (PostgreSQL)
```

**Regla de oro**: las capas externas importan de las internas, nunca al revés.

---

## 👥 Jerarquía de Roles

```
superadmin  (5) → TecnoFusión — acceso total al sistema
admin       (4) → Admin de un negocio — gestiona su empresa
responsable (3) → Responsable de un local/sector
miembro     (2) → Trabaja dentro de un local
viewer      (1) → Solo lectura
```

---

## 📦 Funcionalidades Principales

### 1. Gestión de Tareas (Core)
- **Tablero Kanban** con 6 columnas: Backlog, Por Hacer, En Progreso, En Revisión, Completada, Bloqueada
- **Drag & Drop** entre columnas y reordenamiento
- **Creación de tareas** con título, descripción, prioridad, tipo, fecha límite, asignación múltiple
- **Tipos de tarea**: Feature, Bug, Mejora, Tarea, Documentación
- **Subtareas** (jerarquía padre/hijo con API propia)
- **Checklists inline** con barra de progreso visual
- **Recurrencia** configurable (diaria, semanal, quincenal, mensual)
- **Archivos adjuntos** vía Cloudinary
- **Comentarios** en hilos por tarea con **menciones @usuario** y notificaciones
- **Etiquetas (tags)** libres
- **Búsqueda y filtros** por texto, prioridad, local, objetivo, ciclo, y tablero
- **Selección múltiple** con acciones bulk (mover, eliminar)
- **Configuración de columnas visibles**
- **Registro de tiempos** (time tracking) por tarea con logs de horas y progreso vs estimado

### 2. Calendario y Cronograma
- **Vista Calendario**: mensual, semanal y de lista (FullCalendar)
- **Vista Cronograma / Gantt**: timeline con barras por tarea, agrupable por tablero, objetivo o asignado
- Eventos coloreados por prioridad / estado
- Drag & drop de fechas de vencimiento
- Proyección de tareas recurrentes (fantasmas)
- Navegación integrada al detalle de tarea

### 3. Gestión Organizacional
- **Negocios (Business)**: tenant raíz con aislamiento completo de datos
- **Locales / Sedes (Location)**: unidades físicas o lógicas con estado operativo
- **Equipos (Team)**: grupos de trabajo dentro de un local
- **Tableros (Projects)**: múltiples tableros kanban por negocio, con selector en la vista de tareas
- **Ciclos / Períodos de trabajo**: planificación por semanas, quincenas, meses o temporadas
- **Objetivos / Iniciativas**: agrupadores de tareas con meta común, color, progreso (% completado) y fecha objetivo

### 4. Gestión de Equipo
- Invitación de miembros por email
- Creación directa de usuarios (admin)
- Asignación de roles y locales
- Edición de perfiles
- Desactivación/reactivación
- Roles custom por negocio con matriz de permisos granular

### 5. Reportes y Dashboard
- KPIs en tiempo real: tasa de completado, tareas totales, bloqueadas, urgentes
- Distribución por estado (gráfico circular)
- Distribución por prioridad
- Actividad semanal últimas 6 semanas (gráfico de barras)
- Carga de trabajo por miembro
- Resumen de proyectos

### 6. Billing y Suscripciones
- 4 planes: Free, Basic, Pro, Enterprise
- Precios dinámicos configurables por superadmin
- Pagos recurrentes vía MercadoPago Preapproval
- Webhook de confirmación de pago
- Historial de facturas
- Límites por plan: usuarios, locales, proyectos, adjuntos
- Trial automático

### 7. Superadmin (TecnoFusión)
- Panel de control global
- Gestión de negocios (activar, suspender, ver detalle)
- Gestión de usuarios globales
- Edición de planes y precios
- Métricas del sistema
- Logs de auditoría global

### 8. Inteligencia Artificial
- **Transcripción de audio a tareas** (Groq)
- **Extracción de tareas desde texto libre** (Groq)
- Creación rápida por voz o chat

### 9. Notificaciones
- Notificaciones push (Firebase Cloud Messaging)
- Notificaciones in-app
- Tipos: tarea asignada, tarea actualizada, mención, info general

### 10. Seguridad y Auditoría
- RBAC con 5 niveles jerárquicos
- Roles custom por negocio
- Tenant guard (aislamiento multi-tenant)
- Logs de auditoría para toda operación CREATE/UPDATE/DELETE
- Tokens JWT de Firebase Auth

---

## 🧪 Testing

### Unitarios / Integración
```bash
npm test              # Watch mode
npm run test:run      # Una sola pasada
npm run test:coverage # Con cobertura
```

### E2E (Playwright)
```bash
npx playwright test   # Ejecuta todos los specs
```

Specs disponibles:
- `auth.spec.ts` — Login y registro
- `dashboard.spec.ts` — KPIs y navegación
- `tareas.spec.ts` — Kanban, creación, edición, eliminación
- `equipo.spec.ts` — Gestión de miembros
- `sectores.spec.ts` — Locales
- `config.spec.ts` — Configuración
- `permisos.spec.ts` — Roles y permisos
- `superadmin.spec.ts` — Panel superadmin

---

## 🛠️ Scripts de Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Solo Next.js |
| `npm run dev:all` | Firebase Emulators + Next.js juntos |
| `npm run emulators` | Solo emuladores Firebase |
| `npm run seed` | Datos de prueba en emuladores |
| `npm run seed:pg` | Seed en PostgreSQL |
| `npm run seed:superadmin` | Crea superadmin en PostgreSQL |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run type:check` | TypeScript --noEmit |
| `npm run check` | lint + tipos + tests |

---

## 📚 Documentación

- [docs/architecture.md](docs/architecture.md) — Arquitectura y stack
- [docs/development.md](docs/development.md) — Setup y comandos
- [docs/billing.md](docs/billing.md) — Facturación y planes
- [docs/permissions.md](docs/permissions.md) — Roles y permisos
- [docs/user-guide.md](docs/user-guide.md) — Guía para usuarios finales
- [docs/functional/SCOPE_AND_REQUIREMENTS.md](docs/functional/SCOPE_AND_REQUIREMENTS.md) — Requerimientos funcionales
- [docs/functional/GLOSSARY_AND_MODELS.md](docs/functional/GLOSSARY_AND_MODELS.md) — Glosario y modelos
- [docs/functional/TRACEABILITY_MATRIX.md](docs/functional/TRACEABILITY_MATRIX.md) — Trazabilidad RF → código

---

## 🐳 Docker

```bash
docker build -t tablero-control .
docker run -p 3000:3000 --env-file .env.local tablero-control
```

El `Dockerfile` es multi-stage (deps → builder → runner) basado en `node:22.15-alpine`.

---

## 📄 Licencia

Private project — Propiedad de TecnoFusión.

---

## 🤝 Contribuir

Ver [docs/contributing.md](docs/contributing.md) para convenciones de código, flujo de branches y checklist de PR.
