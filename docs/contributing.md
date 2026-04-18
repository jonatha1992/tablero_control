# 🤝 Contributing - Tablero de Control

## Cómo Contribuir

### 1. Agentes de Desarrollo

Este proyecto utiliza 3 agentes de IA como guías. Léelos antes de escribir código:

- **`.agent-architect.md`**: Arquitectura y estructura
- **`.agent-codegen.md`**: Patrones y convenciones de código
- **`.agent-testing.md`**: Guía de testing

### 2. Flujo de Trabajo

```bash
# 1. Iniciar entorno de desarrollo
npm run emulators  # Terminal 1
npm run dev        # Terminal 2

# 2. Hacer cambios
# ... editar archivos ...

# 3. Verificar build
npm run build

# 4. Ejecutar tests
npm test

# 5. Linting
npm run lint
```

### 3. Convenciones de Código

#### TypeScript
- **Strict mode** siempre
- **Nunca usar `any`** — usa `unknown` o tipos específicos
- Interfaces para props de componentes
- Types para domain objects

#### Imports Order
```typescript
// 1. React/Next
import { useState } from 'react';

// 2. Librerías externas
import { collection } from 'firebase/firestore';

// 3. Imports internos con @/
import { db } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

// 4. Componentes locales
import { Button } from '@/components/ui/button';
```

#### Naming
- **Componentes**: PascalCase (`TaskCard`, `Sidebar`)
- **Funciones/variables**: camelCase (`getTasks`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`TASK_STATUS_LABELS`)
- **Types/Interfaces**: PascalCase (`Task`, `UserPreferences`)
- **Files**: kebab-case (`task-card.tsx`, `firestore.ts`)

#### Componentes
- Server components por defecto
- `'use client'` solo cuando se necesita:
  - useState, useEffect
  - Event handlers (onClick, onChange)
  - Browser APIs
  - Firebase client SDK

#### Styling
- Tailwind CSS siempre
- Usar `cn()` para clases condicionales
- Variables CSS del theme (`bg-background`, `text-foreground`)

### 4. Estructura de Archivos

```
src/
├── app/           # Routes (App Router)
├── components/    # UI components
│   ├── ui/        # Base components (button, card, etc.)
│   └── [module]/  # Feature components
├── lib/           # Utilities, config
│   ├── firebase/  # Firebase setup
│   └── utils.ts   # Helpers
├── hooks/         # Custom hooks
├── stores/        # Zustand stores
└── types/         # TypeScript types
```

### 5. Commits

Formato: `type: description`

| Type | Uso |
|------|-----|
| `feat` | Nueva feature |
| `fix` | Bug fix |
| `refactor` | Refactor de código |
| `docs` | Documentación |
| `test` | Tests |
| `chore` | Config, deps, etc. |

Ejemplos:
```
feat: add Kanban board view
fix: task card overflow on mobile
docs: update architecture diagram
chore: add Firebase emulator config
```

### 6. Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run once
npm run test:run

# Coverage
npm run test:coverage
```

### 7. Pull Requests

Antes de crear un PR:
1. ✅ `npm run build` pasa sin errores
2. ✅ `npm run lint` pasa sin warnings
3. ✅ `npm test` pasa todos los tests
4. ✅ Documentación actualizada si aplica

### 8. Recursos

- **Emulator UI**: http://localhost:4000
- **App**: http://localhost:3000
- **Docs**: `/docs/` directory
- **Agent Guides**: `.agent-*.md` files
