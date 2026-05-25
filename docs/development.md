# Guía de desarrollo

## Setup inicial

```bash
git clone ... && cd tablero_control
cp .env.local.example .env.local
# Completar variables en .env.local
npm install
npx prisma generate
```

## Comandos

| Comando | Descripción |
|---------|------------|
| `npm run dev:all` | Firebase Emulators (auth) + Next.js en paralelo |
| `npm run dev` | Solo Next.js |
| `npm run emulators` | Solo Firebase Emulators |
| `npm run seed:pg` | Datos de prueba en PostgreSQL |
| `npm run test:run` | Tests sin watch |
| `npm run test:ui` | Tests con UI visual |
| `npm run test:coverage` | Tests con cobertura |
| `npm run type:check` | TypeScript sin compilar |
| `npm run check` | lint + typecheck + tests (pre-commit) |

## Scripts manuales

Los scripts de soporte que no forman parte del flujo normal viven en `scripts/manual/`.
Ejecutarlos solo para diagnostico puntual, por ejemplo `node scripts/manual/test-mp-flow.js`.
Las capturas generadas por esos scripts se guardan en `scripts/manual/artifacts/`.

## Firebase Emulators

Solo se usan para **Firebase Auth** en desarrollo. No hay Firestore.

Los emuladores arrancan en:
- Auth: `localhost:9099`
- UI: `localhost:4000`

Activar con `NEXT_PUBLIC_USE_EMULATOR=true` en `.env.local`.

## PostgreSQL

En desarrollo usar una instancia local o Railway.

```bash
# Sincronizar schema con la base de datos (usar db push en Railway)
npx prisma db push

# Abrir UI visual de la BD
npx prisma studio

# Regenerar cliente tras cambios al schema
npx prisma generate

# Poblar con datos de prueba
npm run seed:pg
npm run seed:superadmin
```

## Acceso superadmin

1. Agregar el email en `.env.local`: `SUPERADMIN_EMAILS=tu@email.com`
2. Registrarse en `/register` con ese email
3. `GET /api/auth/profile` auto-provisiona el User en PostgreSQL con `role: 'superadmin'`
4. Login redirige automáticamente a `/superadmin`

## Credenciales de prueba (seed:pg)

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

## Estructura de carpetas

Ver `docs/architecture.md` para el diagrama completo.

## Agregar un nuevo permiso

1. Agregar la acción en el union type `Action` en `src/lib/permissions/matrix.ts`.
2. Agregarla al array del rol correspondiente en `ROLE_MATRIX`.
3. Si es granular (custom roles), mapearla en `checkGranular`.

## Agregar un nuevo modelo de datos

1. Crear el tipo en `src/types/domain/`.
2. Exportarlo en `src/types/index.ts`.
3. Agregar el modelo en `prisma/schema.prisma`.
4. Correr `npx prisma migrate dev --name <nombre>`.
5. Crear interfaz en `src/repositories/interfaces/`.
6. Crear repositorio en `src/repositories/prisma/`.
7. Exportar singleton en `src/repositories/index.ts`.
