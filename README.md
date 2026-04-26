# Tablero de Control

SaaS multi-tenant de gestión de tareas y proyectos. Stack: Next.js 16 + PostgreSQL + Firebase Auth.

## Inicio rápido

### Prerrequisitos

- Node.js 22+
- PostgreSQL (local o Railway)

### Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Completar .env.local con credenciales reales

# 3. Sincronizar base de datos
npx prisma db push

# 4. Datos de prueba (opcional)
npm run seed:pg

# 5. Iniciar emuladores Firebase + Next.js
npm run dev:all
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts principales

| Comando | Descripción |
|---------|-------------|
| `npm run dev:all` | Firebase Emulators + Next.js juntos |
| `npm run seed:pg` | Datos de prueba en PostgreSQL |
| `npm run seed` | Datos de prueba en Firebase emulators |
| `npm run test:run` | Tests unitarios (una pasada) |
| `npm run check` | lint + tipos + tests |
| `npm run build` | Build de producción |

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 App Router + React 19 + TypeScript strict |
| UI | Tailwind CSS 4 + Radix UI |
| Auth | Firebase Auth |
| Base de datos | PostgreSQL + Prisma ORM (`@prisma/adapter-pg`) |
| Estado | Zustand 5 (UI) + React Query 5 (server) |
| Pagos | MercadoPago Preapproval |
| Archivos | Cloudinary |
| Email | Resend + React Email |
| IA / Audio | Groq SDK |
| Tests | Vitest 4 + Testing Library + Playwright |

## Documentación

Ver [docs/README.md](docs/README.md) — índice completo.

## Firebase

- **Project ID**: `gestordetrabajo`
- **Emulator UI**: http://localhost:4000

## License

Private project.
