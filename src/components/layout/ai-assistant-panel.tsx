'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Bot, Calendar, Check, ExternalLink, Loader2, MapPin, Mic,
  Send, Sparkles, Target, Volume2, VolumeX, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAssistantChat } from '@/hooks/mutations/use-assistant-chat';
import type { DisplayMessage } from '@/hooks/mutations/use-assistant-chat';
import { assistantApi } from '@/lib/api/assistant';
import {
  useDictateTasksUpload,
  useConfirmDictatedTasks,
} from '@/hooks/mutations/use-dictate-tasks';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { TaskPriority, TaskStatus } from '@/types/domain/task';

interface AiAssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Pattern requires at least ~5 chars of description after the keyword
const CYCLE_PATTERN =
  /^(crear|nueva?|quiero\s+(crear|hacer)|planificar)\s*(una?\s+)?(planificaci[oó]n|sprint|ciclo|per[ií]odo)[:\-–]\s*(.+)/i;
const OBJECTIVE_PATTERN =
  /^(crear|nuevo?|quiero\s+(crear|hacer))\s*(un[ao]?\s+)?(objetivo|[eé]pica|meta)[:\-–]\s*(.+)/i;

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  low: 'border-l-slate-300', medium: 'border-l-blue-400',
  high: 'border-l-orange-400', urgent: 'border-l-red-500',
};
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
};
const STATUS_LABELS: Record<string, string> = { todo: 'Por hacer', in_progress: 'En progreso' };

function TaskPreviewCard({ task, members, locations, onChange, onRemove }: {
  task: ExtractedTask;
  members: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  onChange: (t: ExtractedTask) => void;
  onRemove: () => void;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-2.5 border-l-4 text-xs', PRIORITY_BORDER[task.priority])}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{task.order}</span>
        <Input value={task.title} onChange={(e) => onChange({ ...task, title: e.target.value })} className="h-7 text-xs font-medium bg-background flex-1" maxLength={200} />
        <button type="button" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive p-0.5"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-7">
        <select value={task.priority} onChange={(e) => onChange({ ...task, priority: e.target.value as TaskPriority })} className="rounded border border-border bg-background text-foreground px-1 py-0.5 text-[10px]">
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
        <select value={task.status} onChange={(e) => onChange({ ...task, status: e.target.value as Extract<TaskStatus, 'todo' | 'in_progress'> })} className="rounded border border-border bg-background text-foreground px-1 py-0.5 text-[10px]">
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {locations.length > 0 && (
          <div className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
            <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <select value={task.locationId ?? ''} onChange={(e) => onChange({ ...task, locationId: e.target.value || undefined })} className="bg-background text-foreground outline-none max-w-[90px]">
              <option value="">Sin sector</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
        {task.dueDate && <span className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">📅 {task.dueDate}</span>}
        {task.estimatedHours && <span className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">⏱ {task.estimatedHours}h</span>}
        {members.slice(0, 3).map((m) => {
          const on = task.assigneeIds.includes(m.id);
          return <button key={m.id} type="button" onClick={() => onChange({ ...task, assigneeIds: on ? task.assigneeIds.filter((id) => id !== m.id) : [...task.assigneeIds, m.id] })} className={cn('rounded-full px-1.5 py-0.5 text-[10px] border transition-colors', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary')}>{m.name.split(' ')[0]}</button>;
        })}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  '¿Qué tareas están vencidas?',
  '¿Para qué sirven los ciclos?',
  'Quiero planificar el lanzamiento de un producto',
  'Crear planificación: migrar el servidor a la nube',
];

export function AiAssistantPanel({ open, onOpenChange }: AiAssistantPanelProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [recSeconds, setRecSeconds] = useState(0);
  const [confirmingIdx, setConfirmingIdx] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('ai_panel_muted') === 'true' : false
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgLenRef = useRef(0);

  const {
    messages, send, addAction, addPreview, confirmPreview, cancelPreview,
    replacePreviewWithAction, addTaskPreview, confirmTaskMessage,
    updateTaskInMessage, removeTaskFromMessage, clear, isPending,
  } = useAssistantChat();

  const uploadMutation = useDictateTasksUpload();
  const confirmMutation = useConfirmDictatedTasks();

  const { data: membersData } = useMembersQuery();
  const members = (membersData ?? []).map((m) => ({ id: m.id, name: m.name }));
  const { data: locationsData = [] } = useLocationsQuery();
  const locations = locationsData.map((l) => ({ id: l.id, name: l.name }));

  const isLoading = isPending || isGenerating || micState === 'processing';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, micState]);

  // Timer for recording duration
  useEffect(() => {
    if (micState === 'recording') {
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [micState]);

  // TTS for assistant messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (messages.length > prevMsgLenRef.current && lastMsg?.role === 'assistant' && !isMuted) {
      const utt = new SpeechSynthesisUtterance(lastMsg.content);
      utt.lang = 'es-AR'; utt.rate = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
    prevMsgLenRef.current = messages.length;
  }, [messages, isMuted]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('ai_panel_muted', String(next));
    if (next) window.speechSynthesis.cancel();
  };

  const handleClose = () => {
    if (isLoading || micState === 'recording') return;
    window.speechSynthesis.cancel();
    clear(); setInput(''); onOpenChange(false);
  };

  const handleSend = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isLoading || micState !== 'idle') return;
    setInput('');

    const cycleMatch = msg.match(CYCLE_PATTERN);
    const objMatch = msg.match(OBJECTIVE_PATTERN);

    if (cycleMatch || objMatch) {
      const type = cycleMatch ? 'cycle' : 'objective';
      // extract description from capture group 5
      const description = (cycleMatch ?? objMatch)![5]?.trim() ?? msg;
      setIsGenerating(true);
      try {
        const result = await assistantApi.previewPlan(type, description);
        addPreview(result.type, result.description, result.plan);
      } catch {
        await send(msg);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    await send(msg);
  };

  const handleConfirmPreview = async (msgIdx: number, type: 'cycle' | 'objective', description: string) => {
    confirmPreview(msgIdx);
    setIsGenerating(true);
    try {
      const result = await assistantApi.generatePlan(type, description);
      replacePreviewWithAction(msgIdx, result);
    } catch {
      cancelPreview(msgIdx);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMic = async () => {
    if (micState === 'idle') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
          setMicState('processing');
          uploadMutation.mutate(file, {
            onSuccess: (data) => {
              setMicState('idle');
              addTaskPreview(data.tasks, data.parseError);
            },
            onError: () => setMicState('idle'),
          });
        };
        mr.start();
        setMicState('recording');
      } catch {
        setMicState('idle');
      }
    } else if (micState === 'recording') {
      mediaRecorderRef.current?.stop();
      setMicState('processing');
    }
  };

  const handleConfirmTasks = (tasks: ExtractedTask[], msgIdx: number) => {
    setConfirmingIdx(msgIdx);
    confirmMutation.mutate(tasks, {
      onSuccess: () => { confirmTaskMessage(msgIdx); setConfirmingIdx(null); },
      onError: () => setConfirmingIdx(null),
    });
  };

  const fmtSec = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-2xl flex flex-col p-0 gap-0 h-[580px]"
        onInteractOutside={(e) => { if (isLoading) e.preventDefault(); }}
      >
        <DialogHeader className="px-4 pt-3 pb-3 shrink-0 border-b">
          <div className="flex items-center gap-2 pr-8">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <DialogTitle className="text-base">Asistente IA</DialogTitle>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">

          {/* Empty state */}
          {messages.length === 0 && micState === 'idle' && (
            <div className="flex flex-col items-center justify-center gap-4 text-center h-full text-muted-foreground">
              <Bot className="h-10 w-10 opacity-15" />
              <div>
                <p className="text-sm font-medium text-foreground/70">¿En qué puedo ayudarte?</p>
                <p className="text-xs mt-0.5">Preguntá, usá el 🎤 para dictar tareas, o pedí una planificación</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)} className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground/70 hover:bg-muted hover:text-foreground transition-colors">{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Recording banner */}
          {micState === 'recording' && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 self-stretch">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Grabando…</p>
                <p className="text-xs text-muted-foreground">Hablá con claridad. Pulsá 🎤 para detener.</p>
              </div>
              <span className="font-mono text-sm text-red-500 font-semibold">{fmtSec(recSeconds)}</span>
            </div>
          )}

          {/* Processing banner */}
          {micState === 'processing' && (
            <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 self-stretch">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">Transcribiendo audio y detectando tareas…</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg: DisplayMessage, i) => {

            /* ── Action card (planificación/objetivo creado) ── */
            if (msg.role === 'action') {
              const { action } = msg;
              const isCycle = action.type === 'cycle';
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {isCycle ? <Calendar className="h-4 w-4 text-primary shrink-0" /> : <Target className="h-4 w-4 text-primary shrink-0" />}
                      <span className="text-sm font-medium text-primary">{isCycle ? 'Planificación creada' : 'Objetivo creado'}</span>
                    </div>
                    <p className="text-sm font-semibold">{action.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{action.tasksCreated} tarea{action.tasksCreated !== 1 ? 's' : ''} generada{action.tasksCreated !== 1 ? 's' : ''}:</p>
                    <ul className="mt-1 space-y-0.5">{action.taskTitles.map((t, j) => <li key={j} className="text-xs text-muted-foreground">• {t}</li>)}</ul>
                    <a href={action.link} onClick={handleClose} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">Ver {isCycle ? 'planificación' : 'objetivo'} <ExternalLink className="h-3 w-3" /></a>
                  </div>
                </div>
              );
            }

            /* ── Preview card (pendiente de confirmación) ── */
            if (msg.role === 'preview') {
              const isCycle = msg.type === 'cycle';
              const label = isCycle ? 'planificación' : 'objetivo';
              if (msg.state === 'cancelled') {
                return (
                  <div key={i} className="self-start text-xs text-muted-foreground italic px-1">
                    Creación cancelada.
                  </div>
                );
              }
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-border bg-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {isCycle ? <Calendar className="h-4 w-4 text-primary shrink-0" /> : <Target className="h-4 w-4 text-primary shrink-0" />}
                      <span className="text-sm font-semibold">{msg.plan.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{msg.plan.goal}</p>
                    <p className="text-xs font-medium mb-1">{msg.plan.tasks.length} tareas propuestas:</p>
                    <ul className="space-y-0.5 mb-3">
                      {msg.plan.tasks.map((t, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{t.title} {t.estimatedHours && <span className="text-muted-foreground/60">({t.estimatedHours}h)</span>}</span>
                        </li>
                      ))}
                    </ul>
                    {msg.state === 'confirmed' ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Creando {label}…
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleConfirmPreview(i, msg.type, msg.description)}>
                          Crear {label}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => cancelPreview(i)}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            /* ── Tasks preview (desde audio) ── */
            if (msg.role === 'tasks') {
              const sorted = [...msg.tasks].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm self-start max-w-[85%]">
                    {msg.parseError || msg.tasks.length === 0 ? 'No detecté tareas. ¿Podés ser más específico?' : `Detecté ${msg.tasks.length} tarea${msg.tasks.length !== 1 ? 's' : ''}:`}
                  </div>
                  {msg.tasks.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {sorted.map((task) => {
                        const ti = msg.tasks.indexOf(task);
                        return <TaskPreviewCard key={ti} task={task} members={members} locations={locations} onChange={(u) => updateTaskInMessage(i, ti, u)} onRemove={() => removeTaskFromMessage(i, ti)} />;
                      })}
                    </div>
                  )}
                  {msg.tasks.length > 0 && (
                    msg.confirmed
                      ? <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><Check className="h-3.5 w-3.5" />{msg.tasks.length} tarea{msg.tasks.length !== 1 ? 's' : ''} creada{msg.tasks.length !== 1 ? 's' : ''}</div>
                      : <Button size="sm" className="self-start" onClick={() => handleConfirmTasks(msg.tasks, i)} disabled={confirmingIdx === i}>{confirmingIdx === i ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Creando…</> : `Crear ${msg.tasks.length} tarea${msg.tasks.length !== 1 ? 's' : ''}`}</Button>
                  )}
                </div>
              );
            }

            /* ── Text message (user / assistant) ── */
            return (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap', msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm')}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && micState !== 'processing' && (
            <div className="flex gap-1 items-center bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 self-start">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t px-3 py-2.5 flex items-center gap-2 shrink-0">
          <button onClick={toggleMute} title={isMuted ? 'Activar voz' : 'Silenciar voz'} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={micState === 'recording' ? '🔴 Grabando… pulsá 🎤 para detener' : 'Preguntá, o escribí "Crear planificación: …"'}
            disabled={isLoading || micState !== 'idle'}
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleMic}
            disabled={isPending || isGenerating || micState === 'processing'}
            title={micState === 'recording' ? 'Detener grabación' : 'Dictar tareas por voz'}
            className={cn('h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0', micState === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-muted hover:bg-muted-foreground/20 text-muted-foreground')}
          >
            {micState === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || micState !== 'idle'}
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
