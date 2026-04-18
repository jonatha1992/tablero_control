# Guía de desarrollo

## Setup inicial

```bash
git clone ... && cd tablero_control
cp .env.local.example .env.local
# Completar variables en .env.local
npm install
```

## Comandos

| Comando | Descripción |
|---------|------------|
| `npm run dev:all` | Firebase Emulators + Next.js en paralelo |
| `npm run seed` | Carga datos de prueba en emuladores |
| `npm run seed:superadmin` | Crea usuario superadmin desde .env.local |
| `npm run test:run` | Tests sin watch |
| `npm run type:check` | TypeScript sin compilar |
| `npm run check` | lint + typecheck + tests (pre-commit) |

## Emuladores Firebase

Los emuladores arrancan en:
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Storage: `localhost:9199`
- UI: `localhost:4000`

Datos de seed disponibles en `src/test/seed.ts`. Se exportan/importan en `./firestore-seed/`.

## Credenciales de prueba (seed)

| Email | Password | Rol |
|-------|----------|-----|
| `superadmin@test.com` | `test123` | superadmin |
| `admin@test.com` | `test123` | admin |
| `responsable@test.com` | `test123` | responsable |
| `miembro@test.com` | `test123` | miembro |
| `viewer@test.com` | `test123` | viewer |

## Ramas

| Rama | Uso |
|------|-----|
| `dev` | Rama base. PRs apuntan aquí. |
| `test` | Testing/staging |

## Estructura de carpetas

Ver `docs/architecture.md` para el diagrama completo.

## Agregar un nuevo permiso

1. Agregar la acción en el union type `Action` en `src/lib/permissions/matrix.ts`.
2. Agregarla al array del rol correspondiente en `ROLE_MATRIX`.
3. Actualizar `ROLE_MATRIX` para los roles que la necesiten.
4. Si es granular (custom roles), mapearla en la función `checkGranular`.

## Agregar una nueva colección Firestore

1. Crear el tipo en `src/types/domain/`.
2. Exportarlo en `src/types/index.ts`.
3. Agregar reglas en `firestore.rules` con `sameTenant()` y `isActiveBusiness()`.
4. Si tiene queries complejas, agregar índices en `firestore.indexes.json`.
5. Crear repository en `src/repositories/firebase/`.
