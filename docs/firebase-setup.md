# 🔥 Firebase Setup - Tablero de Control

## Proyecto Firebase

- **Project ID**: `gestordetrabajo`
- **Auth Domain**: `gestordetrabajo.firebaseapp.com`
- **Storage Bucket**: `gestordetrabajo.firebasestorage.app`

## Desarrollo Local con Emuladores

### 1. Iniciar Emuladores

```bash
npm run emulators
```

Esto iniciará:
- **Auth Emulator**: `http://localhost:9099`
- **Firestore Emulator**: `localhost:8080`
- **Storage Emulator**: `localhost:9199`
- **Emulator UI**: `http://localhost:4000`

### 2. Cargar Datos de Prueba

```bash
npm run seed
```

El seed script creará:
- 5 usuarios (1 admin, 2 managers, 2 members)
- 2 equipos
- 3 proyectos
- 50+ tareas en distintos estados
- Alertas de ejemplo

### 3. Exportar Datos del Seed

Después de cargar datos con el seed, puedes exportarlos:

```bash
npm run seed:export
```

Esto guarda los datos en `./firestore-seed` para que los emuladores los carguen automáticamente.

### 4. Usar Firebase Real (Producción)

Para conectar al Firebase real en lugar de emuladores:

1. Cambia en `.env.local`:
   ```env
   NEXT_PUBLIC_USE_EMULATOR=false
   ```

2. Para server-side operations, necesitas el service account:
   - Ve a Firebase Console → Project Settings → Service Accounts
   - Genera una nueva clave privada
   - Copia el JSON y ponlo en `FIREBASE_SERVICE_ACCOUNT` en `.env.local`

## Security Rules

### Firestore Rules (`firestore.rules`)

Las rules definen quién puede hacer qué en cada colección:

```
users/     → Auth required, role-based access
teams/     → Read: all, Write: admin/manager
tasks/     → Read: all, Write: manager + assignees
projects/  → Read: all, Write: admin/manager
reports/   → Read: all, Write: manager (immutable after creation)
alerts/    → Read: all, Write/Resolve: manager
agentLogs/ → Read: manager, Write: system only
```

### Storage Rules (`storage.rules`)

```
users/{userId}/* → User owns their folder
tasks/{taskId}/* → All authenticated can read/write
projects/{projectId}/* → All authenticated can read/write
```

## Firestore Indexes

Los indexes compuestos están definidos en `firestore.indexes.json`. Se deployan automáticamente con:

```bash
firebase deploy --only firestore:indexes
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run emulators` | Iniciar emuladores con seed data |
| `npm run emulators:clean` | Iniciar emuladores desde cero |
| `npm run seed` | Ejecutar seed script |
| `npm run seed:export` | Exportar estado actual de emuladores |
| `firebase deploy` | Deploy rules + indexes a producción |
| `firebase deploy --only firestore:rules` | Deploy solo rules |

## Troubleshooting

### "Firebase Admin not configured"
- Asegúrate de tener `FIREBASE_SERVICE_ACCOUNT` en `.env.local`
- O usa `USE_FIREBASE_EMULATOR=true` para desarrollo local

### "Permission denied" en Firestore
- Verifica las security rules en `firestore.rules`
- En emuladores, las rules se aplican igual que en producción

### Emuladores no arrancan
- Verifica que los puertos 8080, 9099, 9199, 4000 estén libres
- Elimina `./firestore-seed` si está corrupto
