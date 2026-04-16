'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Palette,
  Shield,
  Building2,
  Zap,
  Save,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-primary' : 'bg-input'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transform transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

// ── Settings sections ─────────────────────────────────────────────────────────

function PerfilSection() {
  const [name, setName] = useState('Ana García');
  const [email, setEmail] = useState('ana.garcia@empresa.com');
  const [phone, setPhone] = useState('+54 11 4444-0001');
  const [timezone, setTimezone] = useState('America/Buenos_Aires');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>Actualiza tu nombre, email y datos de contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Zona horaria</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="America/Buenos_Aires">América/Buenos Aires (UTC-3)</option>
                <option value="America/Santiago">América/Santiago (UTC-3)</option>
                <option value="America/Lima">América/Lima (UTC-5)</option>
                <option value="America/Bogota">América/Bogotá (UTC-5)</option>
                <option value="America/Mexico_City">América/Ciudad de México (UTC-6)</option>
                <option value="Europe/Madrid">Europa/Madrid (UTC+1)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
          <CardDescription>Mínimo 8 caracteres, incluye números y símbolos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {['Contraseña actual', 'Nueva contraseña', 'Confirmar contraseña'].map(label => (
              <div key={label}>
                <label className="text-sm font-medium mb-1 block">{label}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline">Actualizar contraseña</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificacionesSection() {
  const [prefs, setPrefs] = useState({
    emailTareas: true,
    emailReportes: true,
    emailAlertas: true,
    pushTareas: true,
    pushAlertas: true,
    pushMenciones: false,
    agentReportes: true,
    agentAlertas: true,
    resumenDiario: false,
    resumenSemanal: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones por email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle checked={prefs.emailTareas} onChange={() => toggle('emailTareas')} label="Actualizaciones de tareas" description="Cuando una tarea asignada cambia de estado" />
          <Toggle checked={prefs.emailReportes} onChange={() => toggle('emailReportes')} label="Reportes generados" description="Al generar un reporte automático" />
          <Toggle checked={prefs.emailAlertas} onChange={() => toggle('emailAlertas')} label="Alertas críticas" description="Tareas vencidas, bloqueadas o con incidentes" />
          <Toggle checked={prefs.resumenDiario} onChange={() => toggle('resumenDiario')} label="Resumen diario" description="Email con el resumen del día a las 18hs" />
          <Toggle checked={prefs.resumenSemanal} onChange={() => toggle('resumenSemanal')} label="Resumen semanal" description="Email con el resumen de la semana el viernes" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificaciones push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle checked={prefs.pushTareas} onChange={() => toggle('pushTareas')} label="Tareas asignadas" description="Cuando te asignan una nueva tarea" />
          <Toggle checked={prefs.pushAlertas} onChange={() => toggle('pushAlertas')} label="Alertas en tiempo real" />
          <Toggle checked={prefs.pushMenciones} onChange={() => toggle('pushMenciones')} label="Menciones en comentarios" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Notificaciones de IA
          </CardTitle>
          <CardDescription>Actividad de los agentes de IA del tablero</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle checked={prefs.agentReportes} onChange={() => toggle('agentReportes')} label="Reportes automáticos generados" />
          <Toggle checked={prefs.agentAlertas} onChange={() => toggle('agentAlertas')} label="Alertas detectadas por IA" description="Anomalías, cuellos de botella, sobrecargas" />
        </CardContent>
      </Card>
    </div>
  );
}

function AparienciaSection() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [density, setDensity] = useState<'compact' | 'default' | 'comfortable'>('default');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'light', label: 'Claro', preview: 'bg-white border' },
              { value: 'dark', label: 'Oscuro', preview: 'bg-slate-900 border-slate-700' },
              { value: 'system', label: 'Sistema', preview: 'bg-gradient-to-br from-white to-slate-900 border' },
            ] as const).map(({ value, label, preview }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'rounded-lg border-2 p-3 text-sm font-medium transition-colors',
                  theme === value ? 'border-primary' : 'border-transparent'
                )}
              >
                <div className={cn('h-16 rounded-md mb-2', preview)} />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Densidad de la interfaz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(['compact', 'default', 'comfortable'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  'flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium capitalize transition-colors',
                  density === d ? 'border-primary bg-primary/5' : 'border-input hover:border-muted-foreground'
                )}
              >
                {d === 'compact' ? 'Compacta' : d === 'default' ? 'Normal' : 'Espaciosa'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sidebar</CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            checked={sidebarCollapsed}
            onChange={setSidebarCollapsed}
            label="Sidebar colapsado por defecto"
            description="Al iniciar sesión, la barra lateral aparece minimizada"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SeguridadSection() {
  const [sessions] = useState([
    { device: 'Chrome · Windows 11', location: 'Buenos Aires, Argentina', current: true, lastActive: 'Ahora' },
    { device: 'Safari · iPhone 15', location: 'Buenos Aires, Argentina', current: false, lastActive: 'Hace 2 horas' },
    { device: 'Firefox · macOS', location: 'Córdoba, Argentina', current: false, lastActive: 'Hace 3 días' },
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Autenticación de dos factores
          </CardTitle>
          <CardDescription>Añade una capa extra de seguridad a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">No configurado</Badge>
              <span className="text-sm text-muted-foreground">2FA desactivado</span>
            </div>
            <Button variant="outline" size="sm">Activar 2FA</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesiones activas</CardTitle>
          <CardDescription>Dispositivos donde tienes sesión iniciada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{s.device}</p>
                  {s.current && <Badge variant="default" className="text-xs py-0">Actual</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{s.location} · {s.lastActive}</p>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Cerrar
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-2">
            Cerrar todas las demás sesiones
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Eliminar cuenta</p>
              <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer</p>
            </div>
            <Button variant="destructive" size="sm">Eliminar cuenta</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NegocioSection() {
  const [bizName, setBizName] = useState('TecnoFusión SRL');
  const [plan] = useState('pro');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Información del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre del negocio</label>
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm">Guardar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg capitalize">{plan}</p>
                <Badge>Activo</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Facturación mensual · Próximo: 16 de mayo 2026</p>
            </div>
            <Button variant="outline">Ver planes</Button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Usuarios', '6 / 20'],
              ['Locales/Sectores', '2 / 10'],
              ['Almacenamiento', '1.2 GB / 10 GB'],
              ['API calls/mes', '4.200 / 50.000'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">Preferencias personales y del negocio</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="negocio">Negocio</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-4"><PerfilSection /></TabsContent>
        <TabsContent value="notificaciones" className="mt-4"><NotificacionesSection /></TabsContent>
        <TabsContent value="apariencia" className="mt-4"><AparienciaSection /></TabsContent>
        <TabsContent value="seguridad" className="mt-4"><SeguridadSection /></TabsContent>
        <TabsContent value="negocio" className="mt-4"><NegocioSection /></TabsContent>
      </Tabs>
    </div>
  );
}
