'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { useBusinessQuery } from '@/hooks/queries/use-business-query';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { useTodayEventsQuery } from '@/hooks/queries/use-calendar-events-query';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { cn, TASK_PRIORITY_LABELS } from '@/lib/utils';
import { isPending } from '@/lib/tasks/task-status';
import { validateTaskCompletion } from '@/lib/task-validation';
import { TaskDetailModal } from './task-detail-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Target,
  Inbox,
  ChevronRight,
  CheckCircle2,
  Timer,
  Zap,
  CalendarDays,
} from 'lucide-react';

// --- Scoring ---

const PRIORITY_SCORE: Record<TaskPriority, number> = {
  urgent: 1000,
  high: 500,
  medium: 200,
  low: 50,
};

const STATUS_SCORE: Record<TaskStatus, number> = {
  in_progress: 200,
  in_review: 150,
  todo: 100,
  backlog: 50,
  blocked: 25,
  done: -9999,
  archived: -9999,
};

function scoreTask(task: Task, userId: string, now: Date): number {
  if (task.status === 'done') return -9999;
  let score = PRIORITY_SCORE[task.priority] + STATUS_SCORE[task.status];
  if (task.assigneeIds.includes(userId)) score += 300;
  if (task.creatorId === userId) score += 50;
  if (task.dueDate) {
    const hoursOverdue = (now.getTime() - new Date(task.dueDate).getTime()) / 3_600_000;
    if (hoursOverdue > 0) score += Math.min(hoursOverdue * 10, 500);
  }
  return score;
}

// --- Date helpers ---

function isAllDay(d: Date): boolean {
  return d.getHours() === 0 && d.getMinutes() === 0;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function hoursOverdueLabel(d: Date, now: Date): string {
  const hours = Math.floor((now.getTime() - d.getTime()) / 3_600_000);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

// --- Styles ---

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-blue-400',
  low: 'border-l-slate-300 dark:border-l-slate-600',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-400',
  low: 'bg-slate-400',
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string }> = {
  backlog: { label: 'Backlog', dot: 'bg-slate-400' },
  todo: { label: 'Por hacer', dot: 'bg-slate-500' },
  in_progress: { label: 'En progreso', dot: 'bg-blue-500' },
  in_review: { label: 'En revisión', dot: 'bg-purple-500' },
  blocked: { label: 'Bloqueada', dot: 'bg-red-500' },
  done: { label: 'Finalizado', dot: 'bg-green-500' },
  archived: { label: 'Archivada', dot: 'bg-gray-400' },
};

const ALL_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done'];

// --- TaskRow ---

interface TaskRowProps {
  task: Task;
  showDate?: boolean;
  overdueLabel?: string;
  onClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

function TaskRow({ task, showDate, overdueLabel, onClick, onStatusChange }: TaskRowProps) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isDone = task.status === 'done';

  let timeLabel: string | null = null;
  if (overdueLabel) {
    timeLabel = overdueLabel;
  } else if (dueDate) {
    if (showDate) timeLabel = formatDateShort(dueDate);
    else if (!isAllDay(dueDate)) timeLabel = formatTime(dueDate);
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 rounded-r-lg border-l-4 border-y border-r border-y-border/35 border-r-border/35 bg-card/70 shadow-sm',
        'hover:border-y-border/70 hover:border-r-border/70 hover:bg-accent/35 hover:shadow transition-all cursor-pointer select-none',
        'dark:border-y-border/45 dark:border-r-border/45 dark:bg-muted/10 dark:hover:bg-muted/25',
        PRIORITY_BORDER[task.priority],
        isDone && 'bg-muted/25 text-muted-foreground opacity-75 dark:bg-muted/10'
      )}
      onClick={() => onClick(task)}
    >
      {/* Status toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className={cn(
              'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
              'hover:scale-110 transition-transform focus:outline-none',
              isDone
                ? 'border-green-500 bg-green-500'
                : 'border-muted-foreground/40 hover:border-primary'
            )}
            title={STATUS_CONFIG[task.status].label}
          >
            {isDone && <CheckCircle2 className="h-3 w-3 text-white" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          {ALL_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, s); }}
              className="gap-2 cursor-pointer"
            >
              <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_CONFIG[s].dot)} />
              {STATUS_CONFIG[s].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Title */}
      <span className={cn('flex-1 text-sm font-medium truncate', isDone && 'line-through text-muted-foreground')}>
        {task.title}
      </span>

      {/* Estimated hours */}
      {task.estimatedHours && !isDone && (
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {task.estimatedHours}h
        </span>
      )}

      {/* Priority dot */}
      <span
        className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority])}
        title={TASK_PRIORITY_LABELS[task.priority]}
      />

      {/* Time / date label */}
      {timeLabel && (
        <span className={cn(
          'text-xs shrink-0 font-mono tabular-nums',
          overdueLabel ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-muted-foreground'
        )}>
          {timeLabel}
        </span>
      )}

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex -space-x-1.5 shrink-0">
          {task.assignees.slice(0, 3).map((a) => (
            <Avatar key={a.id} className="h-5 w-5 border border-background">
              <AvatarImage src={a.avatar} />
              <AvatarFallback className="text-[9px] bg-muted">{a.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 3 && (
            <span className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] text-muted-foreground">
              +{task.assignees.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// --- SectionHeader ---

interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  color?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

function SectionHeader({ icon: Icon, label, count, color = 'text-foreground', collapsed, onToggle }: SectionHeaderProps) {
  return (
    <button
      className="flex items-center gap-2 py-1 w-full text-left"
      onClick={onToggle}
      disabled={!onToggle}
    >
      <Icon className={cn('h-4 w-4 shrink-0', color)} />
      <span className={cn('text-sm font-semibold', color)}>{label}</span>
      <span className="text-xs text-muted-foreground font-normal">({count})</span>
      {onToggle && (
        <ChevronRight className={cn(
          'h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform duration-150',
          !collapsed && 'rotate-90'
        )} />
      )}
    </button>
  );
}

// --- Main ---

interface AgendaViewProps {
  tasks: Task[];
}

export function AgendaView({ tasks }: AgendaViewProps) {
  const { user } = useAuth();
  const { data: business } = useBusinessQuery(user?.businessId);
  const moveTask = useMoveTask();
  const { data: todayEvents = [] } = useTodayEventsQuery();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [showNoDate, setShowNoDate] = useState(true);
  const [showLater, setShowLater] = useState(true);
  const [showFuture, setShowFuture] = useState(false);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    const onFocus = () => setNow(new Date());
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(tick); window.removeEventListener('focus', onFocus); };
  }, []);

  const userId = user?.id ?? '';

  const sections = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86_400_000 - 1);
    const weekEnd = new Date(todayStart.getTime() + 7 * 86_400_000 - 1);
    const laterEnd = new Date(todayStart.getTime() + 30 * 86_400_000 - 1);

    const overdue: Task[] = [];
    const todayTimed: Task[] = [];
    const todayAllDay: Task[] = [];
    const thisWeek: Task[] = [];
    const later: Task[] = [];
    const noDate: Task[] = [];
    const done: Task[] = [];

    for (const task of tasks) {
      if (task.status === 'done') {
        done.push(task);
        continue;
      }
      // #13: backlog = ideas, no trabajo comprometido → no mostrar como pendiente.
      if (!isPending(task)) continue;
      if (!task.dueDate) {
        noDate.push(task);
        continue;
      }
      const d = new Date(task.dueDate);
      if (d < todayStart) {
        overdue.push(task);
      } else if (d <= todayEnd) {
        if (isAllDay(d)) todayAllDay.push(task);
        else todayTimed.push(task);
      } else if (d <= weekEnd) {
        thisWeek.push(task);
      } else if (d <= laterEnd) {
        later.push(task);
      }
    }

    const byScore = (a: Task, b: Task) => scoreTask(b, userId, now) - scoreTask(a, userId, now);
    const byDate = (a: Task, b: Task) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();

    overdue.sort(byDate);
    todayTimed.sort(byDate);
    todayAllDay.sort(byScore);
    thisWeek.sort(byDate);
    later.sort(byDate);
    noDate.sort(byScore);
    done.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // #1/#3: foco solo hasta hoy (sin futuras).
    const actionableNow = [...overdue, ...todayTimed, ...todayAllDay, ...noDate];
    const focus = [...actionableNow].sort(byScore).slice(0, 3);

    return { overdue, todayTimed, todayAllDay, thisWeek, later, noDate, done, focus };
  }, [tasks, userId, now]);

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    if (status === 'done') {
      const task = tasks.find((t) => t.id === taskId);
      if (task && !validateTaskCompletion(task, business?.settings)) {
        return; // B1, B2, B4
      }
    }
    moveTask.mutate({ taskId, newStatus: status });
  };

  const handleClick = (task: Task) => setSelectedTask(task);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // #1/#3: pendientes accionables hasta hoy (sin futuras).
  const pendingNow =
    sections.overdue.length +
    sections.todayTimed.length +
    sections.todayAllDay.length +
    sections.noDate.length;
  const futureCount = sections.thisWeek.length + sections.later.length;

  if (pendingNow === 0 && futureCount === 0 && sections.done.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 opacity-20" />
        <p className="text-sm font-medium">Sin tareas pendientes</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-12 max-w-3xl">

        {/* #1/#3: Toggle hasta hoy / todas */}
        {futureCount > 0 && (
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-muted-foreground">Mostrar:</span>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setShowFuture(false)}
                className={cn('px-3 py-1 transition-colors', !showFuture ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                Hasta hoy
              </button>
              <button
                onClick={() => setShowFuture(true)}
                className={cn('px-3 py-1 transition-colors', showFuture ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                Todas ({futureCount} futura{futureCount !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        )}

        {/* Banner: todo al día */}
        {pendingNow === 0 && (futureCount > 0 || sections.done.length > 0) && (
          <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">Todo al día.</span>
            {futureCount > 0 && !showFuture && (
              <span className="text-green-600 dark:text-green-400">
                {futureCount} tarea{futureCount !== 1 ? 's' : ''} futura{futureCount !== 1 ? 's' : ''}.
              </span>
            )}
          </div>
        )}

        {/* BANNER EVENTOS HOY */}
        {todayEvents.length > 0 && (
          <a
            href="/dashboard/tareas/calendario"
            className="flex items-center gap-2.5 rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 px-3 py-2 text-sm text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors"
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-medium">{todayEvents.length} evento{todayEvents.length !== 1 ? 's' : ''} hoy</span>
              {todayEvents.length <= 3 && (
                <span className="text-violet-500 dark:text-violet-400">
                  {' — '}{todayEvents.map((e) => e.title).join(', ')}
                </span>
              )}
            </span>
            <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0 opacity-60" />
          </a>
        )}

        {/* FOCO DEL DÍA */}
        {sections.focus.length > 0 && (
          <section className="space-y-2">
            <SectionHeader icon={Zap} label="Foco del día" count={sections.focus.length} color="text-amber-500" />
            <div className="space-y-2 pl-6">
              {sections.focus.map((task) => {
                const isOverdue = task.dueDate ? new Date(task.dueDate) < todayStart : false;
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDate={!isOverdue}
                    overdueLabel={isOverdue ? hoursOverdueLabel(new Date(task.dueDate!), now) : undefined}
                    onClick={handleClick}
                    onStatusChange={handleStatusChange}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* VENCIDAS */}
        {sections.overdue.length > 0 && (
          <section className="space-y-2">
            <SectionHeader icon={AlertTriangle} label="Vencidas" count={sections.overdue.length} color="text-red-500" />
            <div className="space-y-2 pl-6">
              {sections.overdue.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  overdueLabel={hoursOverdueLabel(new Date(task.dueDate!), now)}
                  onClick={handleClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* HOY CON HORA */}
        {sections.todayTimed.length > 0 && (
          <section className="space-y-2">
            <SectionHeader icon={Clock} label="Hoy — con hora" count={sections.todayTimed.length} color="text-blue-500" />
            <div className="space-y-2 pl-6">
              {sections.todayTimed.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={handleClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* PARA HOY (todo-día) */}
        {sections.todayAllDay.length > 0 && (
          <section className="space-y-2">
            <SectionHeader icon={Target} label="Para hoy" count={sections.todayAllDay.length} color="text-emerald-500" />
            <div className="space-y-2 pl-6">
              {sections.todayAllDay.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={handleClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* ESTA SEMANA — oculto por defecto (#1/#3) */}
        {showFuture && sections.thisWeek.length > 0 && (
          <section className="space-y-2">
            <SectionHeader icon={Calendar} label="Esta semana" count={sections.thisWeek.length} />
            <div className="space-y-2 pl-6">
              {sections.thisWeek.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showDate
                  onClick={handleClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* PRÓXIMAMENTE — oculto por defecto (#1/#3) */}
        {showFuture && sections.later.length > 0 && (
          <section className="space-y-2">
            <SectionHeader
              icon={Timer}
              label="Próximamente"
              count={sections.later.length}
              collapsed={!showLater}
              onToggle={() => setShowLater((v) => !v)}
            />
            {showLater && (
              <div className="space-y-2 pl-6">
                {sections.later.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDate
                    onClick={handleClick}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SIN FECHA */}
        {sections.noDate.length > 0 && (
          <section className="space-y-2">
            <SectionHeader
              icon={Inbox}
              label="Sin fecha"
              count={sections.noDate.length}
              collapsed={!showNoDate}
              onToggle={() => setShowNoDate((v) => !v)}
            />
            {showNoDate && (
              <div className="space-y-2 pl-6">
                {sections.noDate.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={handleClick}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* COMPLETADAS */}
        {sections.done.length > 0 && (
          <section className="space-y-2">
            <SectionHeader
              icon={CheckCircle2}
              label="Completadas"
              count={sections.done.length}
              color="text-green-500"
              collapsed={!showDone}
              onToggle={() => setShowDone((v) => !v)}
            />
            {showDone && (
              <div className="space-y-2 pl-6">
                {sections.done.slice(0, 30).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDate
                    onClick={handleClick}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {sections.done.length > 30 && (
                  <p className="text-xs text-muted-foreground pl-4 pt-1">
                    +{sections.done.length - 30} más…
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />
    </>
  );
}
