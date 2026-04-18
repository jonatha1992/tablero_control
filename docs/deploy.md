# Deploy — Railway

> Plan de deploy a Railway con PostgreSQL.
> Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` completado

---

## Stack en producción

| Capa | Servicio |
|------|---------|
| App Next.js | Railway (servicio web) |
| Base de datos | PostgreSQL (Railway plugin) |
| Auth | Firebase Auth |
| Storage | Cloudinary |
| Pagos | MercadoPago |

---

## Estado global

| Fase | Estado |
|------|--------|
| 1. Crear proyecto Railway | `[ ]` |
| 2. Agregar PostgreSQL | `[ ]` |
| 3. Configurar env vars | `[ ]` |
| 4. Primer deploy | `[ ]` |
| 5. Correr migraciones | `[ ]` |
| 6. Smoke test | `[ ]` |
| 7. Dominio custom (opcional) | `[ ]` |
| 8. Alertas de costo | `[ ]` |

---

## Fase 1 — Crear proyecto en Railway

- [ ] Ir a https://railway.app → Login with GitHub
- [ ] "New Project" → "Deploy from GitHub repo"
- [ ] Seleccionar repo `jonatha1992/tablero_control`
- [ ] Railway detecta Next.js automáticamente
- [ ] Rama: `dev` (cambiar a `main` cuando esté listo para producción)

---

## Fase 2 — Agregar PostgreSQL

- [ ] Dentro del proyecto Railway → "+ New" → "Database" → "PostgreSQL"
- [ ] Railway crea la DB y agrega `DATABASE_URL` automáticamente al servicio
- [ ] Verificar que `DATABASE_URL` aparece en las variables del servicio web

---

## Fase 3 — Configurar env vars

En el servicio web de Railway → Settings → Variables, agregar:

### Firebase Client (público)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDfdKHelBDB1N5sA_nQ5cQMDe93MAU8WjY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestordetrabajo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestordetrabajo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gestordetrabajo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=478008899800
NEXT_PUBLIC_FIREBASE_APP_ID=1:478008899800:web:a5618898a550dff9f67fad
NEXT_PUBLIC_USE_EMULATOR=false
```

### Firebase Admin (secreto)
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```
Obtener desde: Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada → copiar el JSON completo como string de una línea.

### MercadoPago
```
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=
```

### Cloudinary
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### App
```
SUPERADMIN_EMAIL=tecnofusion.it@gmail.com
SUPERADMIN_PASSWORD=
NODE_ENV=production
```

- [ ] Cargar todas las variables
- [ ] Verificar que `DATABASE_URL` está (la agrega Railway automáticamente)

---

## Fase 4 — Configurar build y start

En el servicio web → Settings → Deploy:

**Build command**:
```
npx prisma generate && npx prisma migrate deploy && npm run build
```

**Start command**:
```
npm start
```

- [ ] Configurar build command
- [ ] Configurar start command
- [ ] Push a la rama conectada para disparar el deploy
- [ ] Seguir logs en Railway → verificar build exitoso

Duración esperada del primer build: 3-5 minutos.

---

## Fase 5 — Smoke test

- [ ] Abrir URL de Railway (`*.up.railway.app`)
- [ ] Login con superadmin funciona
- [ ] Dashboard carga datos desde PostgreSQL
- [ ] Crear tarea de prueba
- [ ] Subir adjunto (Cloudinary)
- [ ] Logout
- [ ] Rutas protegidas redirigen al login
- [ ] Network tab: sin errores 500

---

## Fase 6 — Dominio custom (opcional)

- [ ] Comprar dominio (Cloudflare ~USD 10/año o NIC.AR ~USD 0.30/año para `.com.ar`)
- [ ] Railway → Settings → Domains → "Add Custom Domain"
- [ ] Agregar registro CNAME en el proveedor DNS
- [ ] SSL automático provisto por Railway
- [ ] Actualizar webhook MP a `https://tudominio.com/api/mercadopago/webhook`

---

## Fase 7 — Alertas de costo

- [ ] Railway → Account → Billing → configurar límite de gasto mensual
- [ ] Setear alerta en USD 15/mes como tope

---

## Rollback

1. Railway → Deployments → click en deploy anterior → "Rollback"
2. Investigar logs
3. Fix en rama separada → PR → merge → redeploy

---

## Notas

- `DATABASE_URL` la genera Railway automáticamente al agregar el plugin Postgres — no hace falta escribirla a mano.
- `FIREBASE_SERVICE_ACCOUNT` debe ser el JSON completo en una sola línea (sin saltos de línea).
- El plan Hobby de Railway incluye USD 5 de crédito de uso mensual — para una app en fase inicial cubre todo.
- Eliminar `apphosting.yaml` de la raíz ya que no aplica a Railway.
