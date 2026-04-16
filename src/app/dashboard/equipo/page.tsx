'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  Shield,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn, ROLE_LABELS, ROLE_COLORS, getInitials, stringToColor } from '@/lib/utils';
import type { User, UserRole, Team } from '@/types';

// ── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_USERS: User[] = [
  {
    id: 'user-001',
    name: 'Ana García',
    email: 'ana.garcia@empresa.com',
    role: 'admin',
    avatar: undefined,
    phone: '+54 11 4444-0001',
    teamIds: ['team-001'],
    preferences: { theme: 'system', locale: 'es', timezone: 'America/Buenos_Aires', notifications: { email: true, push: true, agentReports: true, agentAlerts: true }, dashboardLayout: [] },
    isActive: true,
    lastLogin: new Date('2026-04-16T08:30:00'),
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2026-04-16'),
  },
  {
    id: 'user-002',
    name: 'Carlos López',
    email: 'carlos.lopez@empresa.com',
    role: 'responsable',
    avatar: undefined,
    phone: '+54 11 4444-0002',
    teamIds: ['team-001'],
    preferences: { theme: 'dark', locale: 'es', timezone: 'America/Buenos_Aires', notifications: { email: true, push: false, agentReports: true, agentAlerts: true }, dashboardLayout: [] },
    isActive: true,
    lastLogin: new Date('2026-04-15T17:45:00'),
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2026-04-15'),
  },
  {
    id: 'user-003',
    name: 'María Pérez',
    email: 'maria.perez@empresa.com',
    role: 'miembro',
    avatar: undefined,
    teamIds: ['team-001', 'team-002'],
    preferences: { theme: 'light', locale: 'es', timezone: 'America/Buenos_Aires', notifications: { email: false, push: true, agentReports: false, agentAlerts: true }, dashboardLayout: [] },
    isActive: true,
    lastLogin: new Date('2026-04-16T09:00:00'),
    createdAt: new Date('2025-03-05'),
    updatedAt: new Date('2026-04-16'),
  },
  {
    id: 'user-004',
    name: 'Luis Torres',
    email: 'luis.torres@empresa.com',
    role: 'miembro',
    avatar: undefined,
    phone: '+54 11 4444-0004',
    teamIds: ['team-002'],
    preferences: { theme: 'system', locale: 'es', timezone: 'America/Buenos_Aires', notifications: { email: true, push: true, agentReports: false, agentAlerts: false }, dashboardLayout: [] },
    isActive: true,
    lastLogin: new Date('2026-04-14T16:20:00'),
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2026-04-14'),
  },
  {
    id: 'user-005',
    name: 'Sofia Ruiz',
    email: 'sofia.ruiz@empresa.com',
    role: 'miembro',
    avatar: undefined,
    teamIds: ['team-001'],
    preferences: { theme: 'system', locale: 'es', timezone: 'America/Buenos_Aires', notifications: { email: true, push: true, agentReports: true, agentAlerts: true }, dashboardLayout: [] },
    isActive: false,
    lastLogin: new Date('2026-04-01T10:00:00'),
    createdAt: new Date('2025-06-20'),
    updatedAt: new Date('2026-04-01'),
  },
  {
    id: 'user-006',
    name: 'Diego Fernández',
    email: 'diego.fernandez@empresa.com',
    role: 'viewer',
    avatar: undefined,
    teamIds: [],
    preferences: { theme: 'system', locale: 'es', timezone: 'America/Buenos_Aires', notifications: { email: false, push: false, agentReports: false, agentAlerts: false }, dashboardLayout: [] },
    isActive: true,
    lastLogin: new Date('2026-04-10T14:00:00'),
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-04-10'),
  },
];

const SAMPLE_TEAMS: Team[] = [
  {
    id: 'team-001',
    name: 'Equipo Frontend',
    description: 'Responsable del desarrollo de interfaces y UX',
    memberIds: ['user-001', 'user-002', 'user-003', 'user-005'],
    leadId: 'user-002',
    settings: { defaultTaskPriority: 'medium', workingHours: { start: '09:00', end: '18:00' }, sprintDuration: 14 },
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2026-04-01'),
  },
  {
    id: 'team-002',
    name: 'Equipo Backend',
    description: 'Responsable de APIs, base de datos e infraestructura',
    memberIds: ['user-003', 'user-004'],
    leadId: 'user-004',
    settings: { defaultTaskPriority: 'high', workingHours: { start: '08:00', end: '17:00' }, sprintDuration: 14 },
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2026-04-01'),
  },
];

// ── Avatar ────────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
  const color = stringToColor(user.name);
  const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }[size];
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white shrink-0', sizeClass)}
      style={{ backgroundColor: color }}
    >
      {getInitials(user.name)}
    </div>
  );
}

// ── User Card ─────────────────────────────────────────────────────────────────

function UserCard({ user, onSelect }: { user: User; onSelect: (u: User) => void }) {
  const lastLogin = user.lastLogin
    ? user.lastLogin.toLocaleDateString('es', { day: '2-digit', month: 'short' })
    : '—';

  return (
    <Card className={cn('cursor-pointer transition-shadow hover:shadow-md', !user.isActive && 'opacity-60')} onClick={() => onSelect(user)}>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{user.name}</p>
              {!user.isActive && (
                <Badge variant="secondary" className="text-xs">Inactivo</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Rol</span>
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', ROLE_COLORS[user.role])}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Equipos</span>
            <span className="text-xs font-medium">{user.teamIds.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Último acceso</span>
            <span className="text-xs">{lastLogin}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── User Detail ───────────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  teams,
  open,
  onOpenChange,
}: {
  user: User | null;
  teams: Team[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!user) return null;
  const userTeams = teams.filter(t => user.teamIds.includes(t.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="lg" />
            <div>
              <DialogTitle>{user.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rol</p>
              <span className={cn('text-xs font-medium px-2 py-1 rounded', ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
              <span className={cn('inline-flex items-center gap-1 text-xs font-medium',
                user.isActive ? 'text-green-600' : 'text-muted-foreground'
              )}>
                {user.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                {user.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
          )}

          {userTeams.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Equipos</p>
              <div className="flex flex-wrap gap-1.5">
                {userTeams.map(t => (
                  <Badge key={t.id} variant="secondary">{t.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {user.lastLogin && (
            <div className="text-xs text-muted-foreground">
              Último acceso: {user.lastLogin.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notificaciones</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Email', user.preferences.notifications.email],
                ['Push', user.preferences.notifications.push],
                ['Reportes IA', user.preferences.notifications.agentReports],
                ['Alertas IA', user.preferences.notifications.agentAlerts],
              ].map(([label, active]) => (
                <div key={label as string} className={cn('text-xs flex items-center gap-1.5',
                  active ? 'text-foreground' : 'text-muted-foreground line-through'
                )}>
                  <div className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-green-500' : 'bg-muted-foreground')} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button>Editar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Team Card ─────────────────────────────────────────────────────────────────

function TeamCard({ team, allUsers }: { team: Team; allUsers: User[] }) {
  const members = allUsers.filter(u => team.memberIds.includes(u.id));
  const lead = allUsers.find(u => u.id === team.leadId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{team.name}</CardTitle>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>
            )}
          </div>
          <Badge variant="secondary">{members.length} miembros</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {lead && (
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Responsable:</span>
            <span className="font-medium">{lead.name}</span>
          </div>
        )}
        <div className="flex -space-x-2">
          {members.slice(0, 6).map((m) => (
            <div
              key={m.id}
              title={m.name}
              className="h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: stringToColor(m.name) }}
            >
              {getInitials(m.name)}
            </div>
          ))}
          {members.length > 6 && (
            <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
              +{members.length - 6}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Sprint:</span>{' '}
            <span className="font-medium">{team.settings.sprintDuration} días</span>
          </div>
          <div>
            <span className="text-muted-foreground">Horario:</span>{' '}
            <span className="font-medium">{team.settings.workingHours.start}–{team.settings.workingHours.end}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EquipoPage() {
  const [users, setUsers] = useState<User[]>(SAMPLE_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Equipo</h1>
          <p className="text-muted-foreground mt-1">Gestión de usuarios y equipos</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invitar miembro
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total usuarios</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactivos</p>
              <p className="text-2xl font-bold">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="miembros">
        <TabsList>
          <TabsTrigger value="miembros">Miembros ({users.length})</TabsTrigger>
          <TabsTrigger value="equipos">Equipos ({SAMPLE_TEAMS.length})</TabsTrigger>
        </TabsList>

        {/* Miembros */}
        <TabsContent value="miembros" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los roles</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onSelect={(u) => { setSelectedUser(u); setShowDetail(true); }}
              />
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No se encontraron usuarios con esos criterios.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Equipos */}
        <TabsContent value="equipos" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_TEAMS.map((team) => (
              <TeamCard key={team.id} team={team} allUsers={users} />
            ))}
            <Card className="border-dashed cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Plus className="h-8 w-8" />
                <p className="text-sm font-medium">Crear nuevo equipo</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <UserDetailModal
        user={selectedUser}
        teams={SAMPLE_TEAMS}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
