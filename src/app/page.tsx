import Link from 'next/link';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Users,
  Bell,
  Globe,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              TC
            </div>
            <span className="text-xl font-bold">Tablero de Control</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <span className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                Iniciar sesión
              </span>
            </Link>
            <Link href="/register">
              <span className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Registrarse
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Controlá tu negocio
                <br />
                <span className="text-muted-foreground">como un profesional</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Un tablero de control multi-tenant para gestionar locales, sectores y equipos.
                Kanban con drag & drop, sprints Scrum, calendarios y reportes automáticos.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/register">
                  <span className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90">
                    Empezar gratis
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
                <Link href="/login">
                  <span className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-base font-medium hover:bg-accent">
                    Ya tengo cuenta
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Todo lo que necesitás</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Herramientas integradas para gestionar cualquier tipo de negocio
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Kanban */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Kanban Interactivo</h3>
                <p className="text-sm text-muted-foreground">
                  Tablero con drag & drop para mover tareas entre estados.
                  Prioridades visibles con cambio rápido por clic.
                </p>
              </div>

              {/* Scrum */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Metodología Scrum</h3>
                <p className="text-sm text-muted-foreground">
                  Sprints, velocity tracking, daily standups, product backlog
                  y sprint backlog integrados.
                </p>
              </div>

              {/* Calendario */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Calendario Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Vistas mes, semana, día. Drag & drop entre fechas.
                  Tareas recurrentes y filtros por local.
                </p>
              </div>

              {/* Reportes */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Reportes y Métricas</h3>
                <p className="text-sm text-muted-foreground">
                  Reportes diarios, semanales y personalizados.
                  Análisis de tendencias y predicciones automáticas.
                </p>
              </div>

              {/* Multi-Tenant */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Multi-Tenant</h3>
                <p className="text-sm text-muted-foreground">
                  SuperAdmin, Admin de negocio, Responsable de local, Miembro
                  y Viewer. Cada rol con sus permisos.
                </p>
              </div>

              {/* Alertas */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Alertas Automáticas</h3>
                <p className="text-sm text-muted-foreground">
                  Deadlines próximos, tareas bloqueadas, cuellos de botella
                  y sobrecarga de equipo detectados al instante.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Locales/Sectores */}
        <section className="border-t py-16 sm:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Gestión de Locales y Sectores</h2>
                <p className="text-muted-foreground mb-6">
                  El administrador define qué tipo de entidades necesita: locales comerciales,
                  sectores, áreas, sucursales... cada uno con su propio tablero Kanban,
                  equipo y métricas.
                </p>
                <ul className="space-y-3">
                  {[
                    'Definí tus propios tipos de local/sector',
                    'Cada local tiene su responsable asignado',
                    'Kanban filtrable por local',
                    'Estado operativo en tiempo real',
                    'Métricas individuales por local',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-lg">
                <div className="space-y-3">
                  {['Sucursal Centro', 'Sucursal Norte', 'Depósito Central'].map((name, i) => (
                    <div key={name} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">{['local', 'local', 'sector'][i]}</p>
                        </div>
                      </div>
                      <span className="inline-flex h-6 items-center rounded-full bg-green-100 px-2.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Activo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="border-t py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Jerarquía de Roles</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Control de acceso granular para cada tipo de usuario
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { role: 'SuperAdmin', desc: 'TecnoFusión: dueños del sistema', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                { role: 'Admin', desc: 'Admin de cada negocio', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
                { role: 'Responsable', desc: 'Responsable de cada local', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                { role: 'Miembro', desc: 'Persona dentro de un local', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                { role: 'Viewer', desc: 'Solo lectura', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
              ].map((r) => (
                <div key={r.role} className="rounded-lg border bg-card p-4 text-center shadow-sm">
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold mb-2 ${r.color}`}>
                    {r.role}
                  </span>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t py-16 sm:py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Empezá ahora</h2>
            <p className="text-lg opacity-90 mb-8">
              Creá tu cuenta y empezá a gestionar tu negocio hoy mismo.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <span className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary-foreground px-8 text-base font-medium text-primary hover:bg-primary-foreground/90">
                  Crear cuenta gratis
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
              <Link href="/login">
                <span className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-foreground/30 px-8 text-base font-medium hover:bg-primary-foreground/10">
                  Iniciar sesión
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tablero de Control
          </p>
          <p className="text-sm text-muted-foreground">
            Desarrollado por{' '}
            <a
              href="https://tecnofusion-it.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              TecnoFusión.it
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
