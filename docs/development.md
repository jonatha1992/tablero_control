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
| `npm run seed:demo-user` | Usuario demo (Firebase + negocio + tareas) para QA manual |
| `npm run cleanup:invite-phantom-businesses` | Lista/elimina negocios `Empresa de …` creados por error en usuarios de invitación (dry-run; agregar `--execute` al script para borrar) |
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

Documentación: [`docs/permissions.md`](permissions.md), [`docs/invites-and-accounts.md`](invites-and-accounts.md), ADR 006.

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
