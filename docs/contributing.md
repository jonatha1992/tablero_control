# Contributing — Tablero de Control

## Flujo de trabajo

```bash
# 1. Iniciar entorno de desarrollo
npm run dev:all      # Firebase Auth Emulator + Next.js

# 2. Hacer cambios en una rama nueva
git checkout -b feat/nombre-de-la-feature

# 3. Verificar tipos
npm run type:check

# 4. Ejecutar tests
npm run test:run

# 5. Verificar lint y build
npm run check        # lint + tipos + tests
```

### Ramas

| Rama | Uso |
|---|---|
| `dev` | Rama base. PRs apuntan aquí. |
| `feat/*` | Nuevas funcionalidades |
| `fix/*` | Bug fixes |
| `chore/*` | Config, deps, infra |

**PRs siempre contra `dev`, nunca contra `main`.**

---

## Convenciones de código

### TypeScript

- **Strict mode** — siempre
- **Nunca `any`** — usar `unknown` o tipos específicos
- Interfaces para props de componentes; Types para domain objects
- Path alias `@/` para todos los imports internos

### Orden de imports

```typescript
// 1. React / Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. Librerías externas
import { useQuery } from '@tanstack/react-query';

// 3. Imports internos con @/
import { can } from '@/lib/permissions';
import { cn } from '@/lib/utils';

// 4. Tipos
import type { Task } from '@/types';
```

### Naming

| Patrón | Convención |
|---|---|
| Componentes | PascalCase (`TaskCard`, `KanbanBoard`) |
| Funciones/variables | camelCase (`getTasks`, `isLoading`) |
| Constantes | UPPER_SNAKE_CASE (`ROLE_LEVEL`, `TASK_STATUS_LABELS`) |
| Types/Interfaces | PascalCase (`Task`, `CreateTaskDTO`) |
| Archivos | kebab-case (`task-card.tsx`, `use-tasks-query.ts`) |
| Stores | sufijo `.store.ts` (`kanban-ui.store.ts`) |
| Queries | prefijo `use-` + sufijo `-query.ts` |
| Mutations | prefijo `use-` + verbo (`use-create-task.ts`) |

### Componentes

- Server Components por defecto
- `'use client'` solo cuando se necesita: `useState`, `useEffect`, event handlers, Firebase client SDK, browser APIs
- No crear estado local para algo que ya maneja un store de Zustand

### Estilos

- Tailwind CSS siempre
- `cn()` de `@/lib/utils` para clases condicionales
- Variables CSS del theme (`bg-background`, `text-foreground`, `border-border`)
- No usar estilos inline salvo valores dinámicos (ej: `style={{ backgroundColor: avatarColor }}`)

### Comentarios

- No comentar lo que el código ya dice — nombres descriptivos son suficientes
- Solo comentar el **por qué** cuando no es obvio: un constraint oculto, un workaround específico
- Sin docstrings ni comentarios de bloque

---

## Reglas de arquitectura

### Siempre

- Importar repositorios desde `src/repositories/index.ts` (singletons)
- Usar `writeAuditLog()` después de toda mutación en API routes
- Usar `useMoveTask` (no `useUpdateTask`) para cambios de estado de tarea
- Usar `createNotification()` de `src/lib/notifications.ts` para notificaciones
- Usar `assertSameTenant()` o `assertResourceBelongsToBusiness()` en todas las API routes que accedan a datos de un tenant

### Nunca

- Importar desde `repositories/` directamente en componentes
- Usar Firebase Firestore o Firebase Storage (no están en el proyecto)
- Crear estado local para el sprint seleccionado o filtros de kanban — usar los stores
- Usar `any` en TypeScript
- Saltear el `requireUser()` en API routes protegidas

### Al agregar un nuevo modelo de datos

1. Tipo en `src/types/domain/`
2. Exportar en `src/types/index.ts`
3. Modelo en `prisma/schema.prisma`
4. `npx prisma migrate dev --name nombre`
5. Interfaz en `src/repositories/interfaces/`
6. Repositorio en `src/repositories/prisma/`
7. Singleton en `src/repositories/index.ts`

### Al agregar un nuevo permiso

1. Agregar la acción al union type `Action` en `src/lib/permissions/matrix.ts`
2. Agregarla al array del rol correspondiente en `ROLE_MATRIX`
3. Si es granular (custom roles), mapearla en `checkGranular`

---

## Commits

Formato: `type: description` (sin mayúscula, sin punto final)

| Type | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Bug fix |
| `refactor` | Refactor sin cambio de comportamiento |
| `docs` | Documentación |
| `test` | Tests |
| `chore` | Config, dependencias, infra |
| `style` | Cambios de estilos/formato |

Ejemplos:
```
feat: add agenda view with daily scoring
fix: task card overflows on mobile viewport
docs: update architecture with new calendar routes
chore: upgrade prisma to 7.7
```

---

## PR checklist

Antes de abrir un PR:

- [ ] `npm run type:check` pasa sin errores
- [ ] `npm run test:run` pasa sin fallos
- [ ] `npm run lint` sin warnings
- [ ] Si se agrega una nueva ruta: agregada al árbol en `docs/architecture.md`
- [ ] Si se cambia una regla de negocio: actualizado `CLAUDE.md`
- [ ] Sin `console.log` de debugging
- [ ] Sin `any` en TypeScript nuevo
- [ ] Sin mocks en código de producción

---

## Recursos durante desarrollo

| Recurso | URL |
|---|---|
| App local | http://localhost:3000 |
| Firebase Emulator UI | http://localhost:4000 |
| Prisma Studio | `npx prisma studio` → http://localhost:5555 |
| Docs del proyecto | `/docs/` |
