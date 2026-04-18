# Plan de Deploy — Firebase App Hosting

> Documento vivo. Marcá cada tarea a medida que la completes.
> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completado · `[!]` bloqueado

---

## Contexto

- **Objetivo**: llevar el proyecto a producción en **Firebase App Hosting**, manteniendo Firebase Auth / Firestore / Storage intactos.
- **Proyecto Firebase**: `gestordetrabajo`
- **Stack**: Next.js 16 + React 19 + Firebase + MercadoPago + Cloudinary
- **Fase actual**: desarrollo (fase 3 UI), NO se deployó antes, app nunca fue probada a fondo.
- **Costo esperado**: ~USD 0/mes hasta tener tráfico real.

---

## Estado global

| Fase | Estado | Duración est. |
|------|--------|---------------|
| 0. Pre-requisitos (cuenta Blaze + credenciales) | `[ ]` | 30 min |
| 1. Testing local completo | `[ ]` | 1-2 días |
| 2. Preparación del repo | `[ ]` | 30 min |
| 3. Deploy inicial a App Hosting | `[ ]` | 1-2 horas |
| 4. Smoke test en producción | `[ ]` | 2-3 horas |
| 5. Testing funcional completo en prod | `[ ]` | 1 día |
| 6. Dominio custom (opcional) | `[ ]` | 1-2 horas |
| 7. Monitoreo y alertas | `[ ]` | 30 min |
| **Total** | | **~3-5 días** |

---

## Fase 0 — Pre-requisitos

**Objetivo**: tener todo lo necesario antes de tocar código.

### 0.1 Activar plan Blaze en Firebase

- [ ] Ir a https://console.firebase.google.com/project/gestordetrabajo/usage/details
- [ ] Click en **"Modificar plan"** → elegir **Blaze (Pay as you go)**
- [ ] Cargar tarjeta de crédito/débito
- [ ] Configurar **presupuesto de alerta** a USD 5/mes
- [ ] Verificar en https://console.cloud.google.com/billing que quedó asociado

**Nota**: Blaze no cobra automáticamente. Solo cobra si se exceden las cuotas gratuitas. Cuota Cloud Run incluye 2M requests/mes gratis.

### 0.2 Obtener credenciales de MercadoPago

- [ ] Login en https://www.mercadopago.com.ar/developers
- [ ] Crear aplicación nueva (si no existe) → tipo "Suscripciones"
- [ ] Copiar **Access Token** (producción y test)
- [ ] Copiar **Public Key**
- [ ] Configurar webhook (después del deploy, cuando haya URL)
- [ ] Generar **Webhook Secret** para validación HMAC

### 0.3 Obtener credenciales de Cloudinary (si se usa)

- [ ] Login en https://cloudinary.com/console
- [ ] Copiar **Cloud Name**
- [ ] Copiar **API Key** y **API Secret**
- [ ] Verificar si el código usa Cloudinary (`src/lib/cloudinary/`)

### 0.4 Credenciales listas para guardar

Rellenar este checklist (guardar en gestor de passwords, NO commitear):

```
MP_ACCESS_TOKEN=______________________
MP_WEBHOOK_SECRET=______________________
NEXT_PUBLIC_MP_PUBLIC_KEY=______________________
CLOUDINARY_CLOUD_NAME=______________________
CLOUDINARY_API_KEY=______________________
CLOUDINARY_API_SECRET=______________________
```

---

## Fase 1 — Testing local completo

**Objetivo**: validar que la app funciona end-to-end contra Firebase real (no emuladores) antes de ir a producción. Detectar bugs ahora, no después.

### 1.1 Preparar entorno local contra Firebase real

- [ ] Setear `NEXT_PUBLIC_USE_EMULATOR=false` en `.env.local`
- [ ] Descargar un **Service Account JSON** desde Firebase Console → IAM → Service Accounts
- [ ] Cargar `FIREBASE_SERVICE_ACCOUNT` en `.env.local` (string JSON escapado)
- [ ] Completar `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_MP_PUBLIC_KEY`
- [ ] Completar credenciales Cloudinary si aplica
- [ ] `npm run dev`
- [ ] Verificar en consola del navegador que no hay errores de Firebase init

### 1.2 Ejecutar checks automáticos

- [ ] `npm run type:check` — TypeScript sin errores
- [ ] `npm run lint` — ESLint sin errores
- [ ] `npm run test:run` — tests unitarios pasan
- [ ] `npm run build` — build local exitoso (simula el build de App Hosting)

### 1.3 Seed de datos de prueba en Firestore producción

- [ ] Revisar `scripts/seed-superadmin.ts`
- [ ] Ejecutar `npm run seed:superadmin` apuntando a Firestore real
- [ ] Verificar en consola Firestore que el superadmin se creó
- [ ] Opcional: crear un Business de prueba, un local, un equipo

### 1.4 Testing funcional local (checklist de humo)

#### Auth
- [ ] Login como superadmin (`tecnofusion.it@gmail.com`)
- [ ] Logout
- [ ] Login como admin de un Business
- [ ] Recuperación de contraseña (si existe)
- [ ] Protección de rutas (usuario sin login no accede a `/dashboard`)

#### Superadmin
- [ ] Ver listado de negocios
- [ ] Crear un negocio nuevo
- [ ] Asignar admin a negocio
- [ ] Ver auditoría de acciones

#### Business / Multi-tenant
- [ ] Admin de negocio A NO ve negocio B
- [ ] CRUD de locales
- [ ] CRUD de equipos
- [ ] CRUD de miembros con roles (responsable, miembro, viewer)

#### Proyectos y Kanban
- [ ] Crear proyecto
- [ ] Crear columnas (To Do, Doing, Done)
- [ ] Crear tareas
- [ ] Arrastrar tarea entre columnas (drag & drop)
- [ ] Asignar responsable a tarea
- [ ] Priorizar tarea
- [ ] Editar/eliminar tarea
- [ ] Filtros y búsqueda

#### Adjuntos (Cloudinary)
- [ ] Subir imagen a una tarea
- [ ] Ver miniatura
- [ ] Descargar/ver original
- [ ] Eliminar adjunto

#### Reportes
- [ ] Ver reporte de productividad
- [ ] Filtros por fecha, local, responsable
- [ ] Datos que muestra coinciden con los reales en Firestore

#### Calendario
- [ ] Ver tareas con `dueDate` en calendario
- [ ] Click en tarea abre detalle

#### MercadoPago
- [ ] Ver planes disponibles
- [ ] Click en "Upgrade" → genera preapproval URL
- [ ] Completar pago TEST en MercadoPago
- [ ] Webhook local (usar `ngrok` para exponer `/api/mercadopago/webhook`)
- [ ] Suscripción pasa a `authorized` en Firestore
- [ ] Cancelar suscripción
- [ ] Límites de plan: Free bloquea 3er proyecto, Basic bloquea 11vo usuario

#### Permisos
- [ ] `viewer` solo lee
- [ ] `miembro` no crea usuarios
- [ ] `admin` gestiona su Business únicamente
- [ ] `superadmin` puede todo

#### UI / UX
- [ ] Responsive mobile (<768px)
- [ ] Responsive tablet (768-1024px)
- [ ] Dark mode funciona (si está implementado)
- [ ] Navegación entre páginas sin errores
- [ ] Toasts de error/éxito aparecen

### 1.5 Documentar bugs encontrados

- [ ] Crear issue/nota por cada bug
- [ ] Priorizar: P0 (bloqueante), P1 (grave), P2 (menor)
- [ ] **Resolver todos los P0 antes de continuar**

---

## Fase 2 — Preparación del repo

**Objetivo**: dejar el código listo para que App Hosting lo buildee y deploye.

### 2.1 Modificar `firebase.json`

- [ ] Remover sección `"hosting"` completa (era para hosting estático)
- [ ] Mantener `"firestore"`, `"emulators"`, `"projects"`

**Resultado esperado** (`firebase.json`):
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": { ... },
  "projects": { "default": "gestordetrabajo" }
}
```

### 2.2 Crear `apphosting.yaml`

- [ ] Crear archivo `apphosting.yaml` en la raíz
- [ ] Configurar env vars públicas
- [ ] Configurar secrets (MP, Cloudinary, Superadmin password)
- [ ] NO incluir credenciales en claro

**Ejemplo**:
```yaml
runConfig:
  minInstances: 0
  maxInstances: 1
  cpu: 1
  memoryMiB: 512
  concurrency: 80

env:
  - variable: NEXT_PUBLIC_USE_EMULATOR
    value: "false"
    availability: [BUILD, RUNTIME]

  - variable: MP_ACCESS_TOKEN
    secret: MP_ACCESS_TOKEN
    availability: [RUNTIME]

  - variable: MP_WEBHOOK_SECRET
    secret: MP_WEBHOOK_SECRET
    availability: [RUNTIME]

  # ... otras vars
```

### 2.3 Validar `next.config.ts`

- [ ] Verificar que NO tiene `output: 'export'`
- [ ] Verificar que NO tiene `output: 'standalone'` (App Hosting maneja esto)
- [ ] `images.unoptimized: true` está OK (o quitarlo para usar Image Optimization de App Hosting)

### 2.4 Actualizar `.gitignore`

- [ ] Confirmar que `.env.local` está ignorado
- [ ] Confirmar que `firestore-seed/` está ignorado (si existe)
- [ ] Agregar `.firebase/` si no está

### 2.5 Commit y push

- [ ] Revisar cambios con `git status` y `git diff`
- [ ] `git add firebase.json apphosting.yaml .gitignore DEPLOY.md`
- [ ] `git commit -m "chore: preparar deploy a Firebase App Hosting"`
- [ ] `git push origin dev`

---

## Fase 3 — Deploy inicial a App Hosting

**Objetivo**: primer deploy exitoso, con URL auto-generada funcionando.

### 3.1 Crear backend de App Hosting

- [ ] Ir a https://console.firebase.google.com/project/gestordetrabajo/apphosting
- [ ] Click **"Crear backend"**
- [ ] Conectar cuenta de GitHub (si no está ya)
- [ ] Seleccionar repo `jonatha1992/tablero_control` (o el nombre actual)
- [ ] Seleccionar rama: **`dev`** (o crear rama `production` si preferís)
- [ ] Root directory: `/`
- [ ] Región: **`us-central1`** (la más barata)
- [ ] Nombre del backend: `tablero-control`

### 3.2 Configurar secrets

Desde la consola de App Hosting o por CLI:

```bash
firebase apphosting:secrets:set MP_ACCESS_TOKEN --project gestordetrabajo
firebase apphosting:secrets:set MP_WEBHOOK_SECRET --project gestordetrabajo
firebase apphosting:secrets:set CLOUDINARY_API_SECRET --project gestordetrabajo
firebase apphosting:secrets:set CLOUDINARY_API_KEY --project gestordetrabajo
firebase apphosting:secrets:set SUPERADMIN_PASSWORD --project gestordetrabajo
```

- [ ] `MP_ACCESS_TOKEN`
- [ ] `MP_WEBHOOK_SECRET`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `SUPERADMIN_PASSWORD`
- [ ] Otorgar acceso a App Hosting sobre cada secret

### 3.3 Disparar primer build

- [ ] Esperar a que inicie el build automático (o disparar manualmente)
- [ ] Seguir logs en consola App Hosting
- [ ] Duración esperada: 5-10 minutos el primero
- [ ] Si falla: revisar logs, corregir, push de nuevo

**Posibles errores comunes**:
- Env vars faltantes → completar en `apphosting.yaml`
- Secret no accesible → dar permisos desde consola
- Build size > límite → optimizar imports
- TypeScript errors → correr `npm run type:check` local

### 3.4 Validar URL auto-generada

- [ ] Anotar URL asignada (tipo `tablero-control--gestordetrabajo.us-central1.hosted.app`)
- [ ] Abrir en navegador → la home carga
- [ ] No hay errores 500 ni 404 de assets

---

## Fase 4 — Smoke test en producción

**Objetivo**: validación rápida de que la app NO está completamente rota en la URL productiva.

- [ ] Home carga sin errores
- [ ] Login con superadmin funciona
- [ ] Dashboard carga datos de Firestore real
- [ ] Crear una tarea de prueba
- [ ] Subir un adjunto (valida Cloudinary)
- [ ] Logout funciona
- [ ] Las rutas protegidas redirigen al login
- [ ] Network tab: todas las llamadas a `/api/*` devuelven 200/201 (no 500)
- [ ] Console del navegador: sin errores críticos

Si algo rompe, volver a Fase 2 → corregir → redeploy.

---

## Fase 5 — Testing funcional completo en producción

**Objetivo**: repetir el checklist de la Fase 1.4, pero ahora contra la URL productiva.

- [ ] Repetir checklist 1.4 completo en producción
- [ ] Testear con distintos navegadores (Chrome, Firefox, Safari)
- [ ] Testear desde celular real
- [ ] Testear con conexión lenta (DevTools → Network → Slow 3G)

### 5.1 Validar webhook de MercadoPago

- [ ] En MP Developers, configurar webhook URL:
  `https://<URL-APP-HOSTING>/api/mercadopago/webhook`
- [ ] Hacer pago TEST
- [ ] Verificar que el webhook llega (logs en Firebase)
- [ ] Suscripción actualiza estado en Firestore

### 5.2 Validar Firestore Rules en producción

- [ ] Deploy de rules: `firebase deploy --only firestore:rules,firestore:indexes`
- [ ] Intentar acceso directo a Firestore desde consola del navegador
- [ ] Confirmar que las reglas bloquean lo que deben bloquear

---

## Fase 6 — Dominio custom (opcional)

**Objetivo**: reemplazar la URL auto-generada por un dominio propio.

### 6.1 Comprar dominio

Opciones:
- **Cloudflare Registrar** (recomendado): ~USD 10/año, WHOIS Privacy gratis
- **Porkbun**: ~USD 10/año
- **NIC.AR**: `.com.ar`, ~USD 0.30/año (requiere CUIT)

- [ ] Decidir TLD (`.com`, `.app`, `.com.ar`)
- [ ] Registrar dominio
- [ ] Activar WHOIS Privacy

### 6.2 Apuntar dominio a App Hosting

- [ ] En consola App Hosting → Configuración → Dominios personalizados
- [ ] Agregar dominio → seguir instrucciones (verificación TXT + CNAME/A records)
- [ ] Propagación DNS: 15 min – 24 hs
- [ ] SSL auto-provisionado por Firebase

### 6.3 Actualizar referencias al dominio

- [ ] Webhook MP: cambiar a `https://tudominio.com/api/mercadopago/webhook`
- [ ] Si hay CORS configurado, actualizar `CORS_ORIGIN`
- [ ] Si hay meta tags/OpenGraph con URL, actualizar
- [ ] Actualizar emails transaccionales si los hubiera

---

## Fase 7 — Monitoreo y alertas

**Objetivo**: enterarse si algo se rompe o si el costo sube.

### 7.1 Alertas de costo

- [ ] En https://console.cloud.google.com/billing → Presupuestos y alertas
- [ ] Crear presupuesto USD 10/mes
- [ ] Alertas al 50%, 90%, 100%
- [ ] Notificación por email

### 7.2 Logs y métricas

- [ ] Familiarizarse con Firebase Console → App Hosting → Logs
- [ ] Familiarizarse con Google Cloud Console → Cloud Run → métricas
- [ ] Configurar alerta si el error rate > 5% (opcional)

### 7.3 Uptime monitoring (opcional)

- [ ] Usar **UptimeRobot** o **Better Stack** (gratis)
- [ ] Monitor HTTP a la home cada 5 min
- [ ] Alerta por email/Telegram si cae

---

## Checklist final antes de anunciar

- [ ] Deploy exitoso en producción
- [ ] Todos los features P0 testeados en prod
- [ ] Dominio custom configurado (si aplica)
- [ ] Webhook MP apuntando al dominio correcto
- [ ] Alertas de presupuesto configuradas
- [ ] Firestore Rules deployadas
- [ ] Backups o export de Firestore programado (opcional pero recomendado)
- [ ] Superadmin verificado en prod
- [ ] Documentación del stack en `README.md` actualizada

---

## Plan de rollback

Si algo sale muy mal en producción:

1. **Rollback de código**: en consola App Hosting → Rollouts → volver a versión anterior.
2. **Deshabilitar backend**: pausar App Hosting (no borra, pero no sirve tráfico).
3. **Investigar**: logs de App Hosting + Cloud Run.
4. **Fix en rama nueva**: NO commitear directo a `dev` si hay usuarios.
5. **Re-deploy** con fix validado localmente.

---

## Notas

- **No borrar `firebase.json` entero** — solo la sección `"hosting"`. El resto (firestore, emulators) se usa.
- **Emuladores siguen funcionando** para dev local normal.
- **`gestordetrabajo.web.app`** queda como URL muerta del Hosting clásico. Se puede eliminar el sitio desde consola si molesta.
- **Firebase Admin SDK** funciona automáticamente en App Hosting vía Application Default Credentials — NO hace falta `FIREBASE_SERVICE_ACCOUNT` en env vars de producción.
- **Cuidado con `NEXT_PUBLIC_*`**: todo lo que empieza con `NEXT_PUBLIC_` queda expuesto al cliente. No poner secretos ahí.

---

## Bitácora

| Fecha | Fase | Nota |
|-------|------|------|
| 2026-04-18 | — | Plan creado |
