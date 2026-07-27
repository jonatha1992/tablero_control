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
| `npm run dev` | **Modo normal — Firebase producción + Google OAuth. Usar siempre para desarrollo habitual.** |
| `npm run dev:all` | Firebase Auth Emulator (9099) + Next.js en paralelo — solo si querés trabajar offline con emulador |
| `npm run emulators` | Solo Firebase Auth Emulator (alias de `emulators:auth`) |
| `npm run emulators:auth` | Solo Firebase Auth Emulator en `localhost:9099` |
| `npm run seed:pg` | Datos de prueba en PostgreSQL (negocios, usuarios, tareas) |
| `npm run seed:firebase` | Cuentas de login en Firebase Auth Emulator (requiere emuladores corriendo) |
| `npm run seed:demo-user` | Usuario demo completo (Firebase + negocio + tareas) para QA manual |
| `npm run seed:invite-demo` | Link de invitación + colaborador demo (nombre + contraseña, flujo `/i/{token}`) |
| `npm run cleanup:invite-phantom-businesses` | Lista/elimina negocios `Empresa de …` creados por error en usuarios de invitación (dry-run; agregar `--execute` al script para borrar) |
| `npx tsx scripts/ensure-default-boards.ts` | Crea tablero "Principal" en espacios (`Business`) sin ningún `Project`. Script de ops (no eliminar): los espacios nuevos ya lo hacen vía `ensureDefaultBoard()` en register/businesses |
| `npm run test:run` | Tests sin watch |
| `npm run test:ui` | Tests con UI visual |
| `npm run test:coverage` | Tests con cobertura |
| `npm run type:check` | TypeScript sin compilar |
| `npm run check` | lint + typecheck + tests (pre-commit) |

## Scripts manuales

Los scripts de soporte que no forman parte del flujo normal viven en `scripts/manual/`.
Ejecutarlos solo para diagnostico puntual, por ejemplo `node scripts/manual/test-mp-flow.js`.
Las capturas generadas por esos scripts se guardan en `scripts/manual/artifacts/`.

## Modos de desarrollo

### Modo normal (por defecto) — Firebase producción + Google OAuth

```bash
npm run dev
```

`.env.local` debe tener:

```
NEXT_PUBLIC_USE_EMULATOR=false
# FIREBASE_AUTH_EMULATOR_HOST=localhost:9099   ← comentado
```

Con este modo:
- **Google Sign-In funciona** normalmente con cuentas reales de Google.
- Login con email/contraseña contra el proyecto Firebase `gestordetrabajo`.
- Sin intentos de conexión a `localhost:9099`.

### Modo emulador (opcional) — desarrollo offline

Solo útil si querés trabajar **completamente offline** sin acceso a Firebase producción.

```bash
# 1. Activar en .env.local:
NEXT_PUBLIC_USE_EMULATOR=true
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# 2. Arrancar emuladores + Next.js
npm run dev:all

# 3. Una sola vez — poblar datos de prueba:
npm run seed:pg
npm run seed:firebase
```

Los emuladores arrancan en:
- Auth: `localhost:9099`
- UI: `localhost:4000`

> **⚠️ Google Sign-In NO está disponible en el emulador.** El botón de Google se oculta automáticamente cuando `NEXT_PUBLIC_USE_EMULATOR=true`. Usá las credenciales de email/contraseña de la tabla de prueba.

`FIREBASE_AUTH_EMULATOR_HOST` es necesario tanto para el cliente como para el Admin SDK server-side (verificación de tokens en API routes). Siempre comentarlo cuando volvés a modo normal.

## PostgreSQL

**Desarrollo y test comparten la misma base:** `.env.local` apunta a PostgreSQL en **Railway** (`DATABASE_URL`). No hay instancia Postgres local separada en el flujo habitual del equipo.

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

## Limpieza de negocios fantasma por invitación

Script: [`scripts/cleanup-invite-phantom-businesses.ts`](../scripts/cleanup-invite-phantom-businesses.ts)

Antes del fix de colaborador vs. dueño (mayo 2026), `GET /api/auth/profile` y el auto-registro en login creaban negocios **"Empresa de {nombre}"** para usuarios que en realidad entraron por link de invitación. Eso generaba dos equipos en el selector del header.

### Cuándo usarlo

- Tras migrar el código que elimina auto-provision.
- Si un colaborador reporta un negocio propio que no creó a propósito.
- Mantenimiento puntual en Railway (misma DB que dev).

### Criterios de detección

Un negocio se marca candidato a eliminar si **todas** aplican:

1. El usuario tiene señal de invitación: audit `user.join_via_invite` **o** `preferences.accountIntent === 'collaborator'`.
2. Es **dueño** (`ownerId`) de un negocio cuyo nombre coincide con `Empresa de {nombre}`.
3. Es el **único miembro activo** de ese negocio.
4. Tiene **membresía activa en otro negocio** (el del invite).

Se excluyen negocios cuyo nombre contiene `TecnoFusión`.

### Comandos

```bash
# Solo listar candidatos (default)
npm run cleanup:invite-phantom-businesses

# Eliminar y reasignar businessId al negocio del invite
npx tsx --env-file=.env.local scripts/cleanup-invite-phantom-businesses.ts --execute
```

### Ejemplo de salida (Railway, mayo 2026)

Dry-run detectó 2 candidatos; `--execute` los eliminó. Segunda corrida: 0 candidatos.

```
Negocios fantasma candidatos: 2

- [cmp77k76k000f2hna3trkr1fq] "Empresa de celina perez"
  usuario: celina perez <celinamacarenape@gmail.com>
  mantener contexto en: cmosmm8th00002hqkbpipcw16

- [cmp77l7r9000k2hnap34mbgfm] "Empresa de Evelin Diaz"
  usuario: Evelin Diaz <eveylonchi10@gmail.com>
  mantener contexto en: cmosmm8th00002hqkbpipcw16

Eliminados: 2/2
```

El script reasigna `user.businessId` al negocio invitador si apuntaba al fantasma. Usuarios afectados pueden necesitar cerrar sesión y volver a entrar para refrescar el perfil.

## Backfill de businessId en tareas

Script de ops requerido para datos legacy (`scripts/backfill-task-business-id.ts`); no tratarlo como dead code aunque el runtime nuevo siempre persista `businessId`.

Para aislar correctamente espacios en usuarios multi-espacio, las tareas nuevas guardan `Task.businessId`. Si existen tareas legacy sin ese campo, ejecutar primero dry-run:

```bash
npx tsx --env-file=.env.local scripts/backfill-task-business-id.ts
```

Aplicar solo las filas inferibles por tablero o sector:

```bash
npx tsx --env-file=.env.local scripts/backfill-task-business-id.ts --execute
```

Las tareas sin tablero/sector quedan reportadas como ambiguas y deben revisarse manualmente.

Documentación: [`docs/permissions.md`](permissions.md), [`docs/invites-and-accounts.md`](invites-and-accounts.md), ADR 006.

## Acceso superadmin

1. Agregar el email en `.env.local`: `SUPERADMIN_EMAILS=tu@email.com`
2. Registrarse en `/register` con ese email
3. `GET /api/auth/profile` auto-provisiona el User en PostgreSQL con `role: 'superadmin'`
4. Login redirige automáticamente a `/superadmin`

## Credenciales de prueba (modo emulador)

> **Solo aplican cuando `NEXT_PUBLIC_USE_EMULATOR=true`** y el emulador está corriendo.
> En modo producción (normal), usá tu cuenta real de Google o email/contraseña contra Firebase `gestordetrabajo`.
>
> **⚠️ NO uses Google Sign-In en el emulador.** El emulador Firebase no tiene cuentas de Google.com. Usá siempre las credenciales de email/contraseña de la tabla de abajo. El botón de Google se oculta automáticamente en la página de login cuando `NEXT_PUBLIC_USE_EMULATOR=true`.

### Credenciales rápidas — contraseña `test123` para todas

| Email | Rol | Negocio |
|-------|-----|---------|
| **`admin@test.com`** | admin | Restaurante El Portal |
| **`superadmin@test.com`** | superadmin | TecnoFusión |
| `responsable@test.com` | responsable | Restaurante El Portal |
| `miembro@test.com` | miembro | Restaurante El Portal |
| `viewer@test.com` | viewer | Restaurante El Portal |

> **Importante:** `seed:pg` solo crea datos en PostgreSQL. Para que esas cuentas tengan login en Firebase Auth, correr también `seed:firebase` con el emulador activo.

### Setup completo para desarrollo local con emulador

```bash
# 1. Configurar .env.local con NEXT_PUBLIC_USE_EMULATOR=true y FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
# 2. Arrancar emuladores + Next.js
npm run dev:all

# 3. En otra terminal — una sola vez (o tras borrar datos del emulador):
npm run seed:pg       # PostgreSQL: negocios, usuarios, tareas
npm run seed:firebase # Firebase Auth Emulator: cuentas de login
```

> **Nota sobre `seed:pg` en producción:** Los usuarios creados por `seed:pg` tienen IDs y emails que solo coinciden con las cuentas del emulador. Si corrés `seed:pg` contra la base Railway apuntando a Firebase producción, esas cuentas de prueba no tendrán login hasta que existan los mismos UIDs en Firebase Auth producción.

### Cuentas de login (requieren emuladores activos)

| Email | Password | Rol | Negocio PostgreSQL |
|-------|----------|-----|--------------------|
| `superadmin@test.com` | `test123` | superadmin | TecnoFusión |
| `admin@test.com` | `test123` | admin | Restaurante El Portal |
| `responsable@test.com` | `test123` | responsable | Restaurante El Portal |
| `miembro@test.com` | `test123` | miembro | Restaurante El Portal |
| `viewer@test.com` | `test123` | viewer | Restaurante El Portal |

Los UIDs de Firebase Auth coinciden con los IDs de PostgreSQL generados por `seed:pg` (el perfil resuelve correctamente al hacer login).

## Usuario demo QA (`seed:demo-user`)

Crea un admin con negocio propio en Firebase + PostgreSQL (idempotente):

```bash
npm run seed:demo-user
```

| Campo | Valor por defecto |
|-------|-------------------|
| Email | `demo@tablerocontrol.test` |
| Password | `DemoTablero2026!` |
| Negocio | `Negocio Demo QA` |

Variables opcionales: `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, `DEMO_USER_NAME`, `DEMO_BUSINESS_NAME`.

## Invitación demo (`seed:invite-demo`)

Crea un link `/i/{token}` activo (30 días) y un colaborador con login por **nombre + contraseña**:

```bash
npm run seed:invite-demo
```

| Campo | Valor por defecto |
|-------|-------------------|
| Colaborador (login) | Nombre: `Invitado Demo` / Password: `test123` |
| Alta en link | Cualquier nombre + `test123` |
| Negocio | `biz-restaurante-001` si existe; si no, el primer negocio activo |

Variables opcionales: `INVITE_DEMO_BUSINESS_ID`, `INVITE_DEMO_NAME`, `INVITE_DEMO_PASSWORD`.

El script imprime el URL del link y las credenciales en consola.

Incluye local demo + 4 tareas (hoy, futura, recurrente, backlog). Requiere `DATABASE_URL` y credenciales Firebase Admin en `.env.local`.

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
