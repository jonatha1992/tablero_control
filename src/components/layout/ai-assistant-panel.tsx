'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Bot, Calendar, Check, ExternalLink, Loader2, Mic,
  Send, Sparkles, Target, Volume2, VolumeX, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAssistantChat } from '@/hooks/mutations/use-assistant-chat';
import type { DisplayMessage } from '@/hooks/mutations/use-assistant-chat';
import { assistantApi } from '@/lib/api/assistant';
import {
  useDictateTasksUpload,
  useConfirmDictatedTasks,
} from '@/hooks/mutations/use-dictate-tasks';
import { useTaskPreviewContext } from '@/hooks/use-task-preview-context';
import { EventPreviewCard } from '@/components/tareas/event-preview-card';
import { TaskPreviewCard } from '@/components/tareas/task-preview-card';
import { useCreateCalendarEvent } from '@/hooks/mutations/use-create-calendar-event';
import { useAuth } from '@/hooks/auth-context';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { extractedTaskToDraft } from '@/lib/create-task-draft';
import type { CreateCalendarEventDTO } from '@/types/domain/calendar';
import type { ExtractedEvent } from '@/lib/groq/extract-events';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import { toast } from 'sonner';

const SUGGESTIONS = [
  '¿Qué tareas están vencidas?',
  'Resumen del estado general',
  'Crear tarea de inventario',
  'Planificar migración del servidor',
  'Dictar tareas por voz 🎤',
];

const EMPTY_STATE = {
  title: '¿En qué te ayudo?',
  subtitle: 'Preguntá sobre tus tareas, o pedime crear nuevas planificaciones y tareas. Usá el 🎤 para dictar.',
};

const PLACEHOLDER = 'Describí qué querés hacer o preguntá algo…';
const DEFAULT_EVENT_REMINDERS = [
  { type: 'notification', minutesBefore: 0 },
  { type: 'email', minutesBefore: 0 },
] as const;

function buildLocalDate(date: string, time?: string): Date {
  return new Date(`${date}T${time ?? '00:00'}`);
}

function mapEventToCreateDto(event: ExtractedEvent, currentUserId?: string): CreateCalendarEventDTO {
  const start = event.allDay
    ? buildLocalDate(event.startDate)
    : buildLocalDate(event.startDate, event.startTime ?? '09:00');

  const end = event.allDay
    ? new Date(buildLocalDate(event.endDate ?? event.startDate).setHours(23, 59, 59, 999))
    : event.endTime
      ? buildLocalDate(event.endDate ?? event.startDate, event.endTime)
      : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: event.title.trim(),
    description: event.description?.trim() || undefined,
    start,
    end,
    allDay: event.allDay,
    color: event.color,
    assigneeIds: event.assigneeIds.length
      ? event.assigneeIds
      : currentUserId
        ? [currentUserId]
        : undefined,
    reminders: [...DEFAULT_EVENT_REMINDERS],
  };
}

interface AiAssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiAssistantPanel({ open, onOpenChange }: AiAssistantPanelProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [recSeconds, setRecSeconds] = useState(0);
  const [confirmingIdx, setConfirmingIdx] = useState<number | null>(null);
  const [confirmingEventIdx, setConfirmingEventIdx] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('ai_panel_muted') === 'true' : false
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgLenRef = useRef<number>(0);

  const chat = useAssistantChat('planner');

  const {
    messages, send, answerClarify, confirmPreview, cancelPreview,
    replacePreviewWithAction, addTaskPreview, confirmTaskMessage,
    confirmEventMessage, updateTaskInMessage, removeTaskFromMessage,
    updateEventInMessage, removeEventFromMessage, setEventsInMessage, isPending,
  } = chat;

  const uploadMutation = useDictateTasksUpload();
  const confirmMutation = useConfirmDictatedTasks();
  const createCalendarEventMutation = useCreateCalendarEvent({
    successMessage: null,
    errorMessage: null,
  });
  const openCreateModalWithDraft = useKanbanUIStore((s) => s.openCreateModalWithDraft);
  const { user } = useAuth();

  const {
    members,
    locations,
    projects,
    cycles,
    objectives,
    confirmOptions,
  } = useTaskPreviewContext();

  const isLoading = isPending || isGenerating || micState === 'processing';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, micState]);

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

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const prevLen = prevMsgLenRef.current;
    if (messages.length > prevLen && lastMsg?.role === 'assistant' && !isMuted) {
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
    if (isLoading || micState === 'recording' || confirmingEventIdx !== null) return;
    window.speechSynthesis.cancel();
    chat.clear();
    setInput('');
    onOpenChange(false);
  };

  const handleSend = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isLoading || micState !== 'idle') return;
    setInput('');
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

  const processAudioBlob = useCallback((blob: Blob) => {
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    setMicState('processing');

    // Siempre intentar extraer tareas del audio.
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setMicState('idle');
        addTaskPreview(data.tasks, data.parseError);
      },
      onError: () => setMicState('idle'),
    });
  }, [uploadMutation, addTaskPreview]);

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
          processAudioBlob(blob);
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
    confirmMutation.mutate(
      { tasks, options: confirmOptions },
      {
        onSuccess: () => { confirmTaskMessage(msgIdx); setConfirmingIdx(null); },
        onError: () => setConfirmingIdx(null),
      },
    );
  };

  const handleConfirmEvents = async (events: ExtractedEvent[], msgIdx: number) => {
    setConfirmingEventIdx(msgIdx);
    const failedEvents: ExtractedEvent[] = [];
    let createdCount = 0;

    for (const event of events) {
      try {
        await createCalendarEventMutation.mutateAsync(mapEventToCreateDto(event, user?.id));
        createdCount += 1;
      } catch {
        failedEvents.push(event);
      }
    }

    if (failedEvents.length === 0) {
      confirmEventMessage(msgIdx);
      toast.success(
        createdCount === 1 ? 'Evento creado en calendario' : `${createdCount} eventos creados en calendario`,
      );
    } else {
      setEventsInMessage(msgIdx, failedEvents);
      if (createdCount > 0) {
        toast.success(
          createdCount === 1 ? '1 evento creado en calendario' : `${createdCount} eventos creados en calendario`,
        );
      }
      toast.error(
        failedEvents.length === events.length
          ? 'No pude crear los eventos'
          : `Quedaron ${failedEvents.length} evento${failedEvents.length !== 1 ? 's' : ''} por crear`,
      );
    }

    setConfirmingEventIdx(null);
  };

  const handleOpenInForm = (task: ExtractedTask) => {
    openCreateModalWithDraft(extractedTaskToDraft(task));
    handleClose();
  };

  const fmtSec = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const processingLabel = 'Transcribiendo audio y detectando tareas…';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-3xl flex flex-col p-0 gap-0 h-[min(720px,90vh)]"
        onInteractOutside={(e) => { if (isLoading) e.preventDefault(); }}
      >
        <DialogHeader className="px-4 pt-3 pb-2 shrink-0 border-b">
          <div className="flex items-center gap-2 pr-8">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <DialogTitle className="text-sm font-semibold">Asistente IA</DialogTitle>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">

          {/* Empty state */}
          {messages.length === 0 && micState === 'idle' && (
            <div className="flex flex-col items-center justify-center gap-4 text-center h-full text-muted-foreground">
              <Sparkles className="h-10 w-10 opacity-15" />
              <div>
                <p className="text-sm font-medium text-foreground/70">{EMPTY_STATE.title}</p>
                <p className="text-xs mt-0.5">{EMPTY_STATE.subtitle}</p>
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
              <p className="text-sm text-muted-foreground">{processingLabel}</p>
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

            /* ── Clarify (pregunta del agente) ── */
            if (msg.role === 'clarify') {
              return (
                <div key={i} className="flex flex-col gap-2 self-start max-w-[90%]">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm">
                    {msg.question}
                  </div>
                  {msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => answerClarify(msg.field, opt)}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Events preview (planner calendario) ── */
            if (msg.role === 'events') {
              const sorted = [...msg.events].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm self-start max-w-[85%]">
                    {msg.parseError || msg.events.length === 0
                      ? 'No detecté eventos. ¿Podés ser más específico?'
                      : `Detecté ${msg.events.length} evento${msg.events.length !== 1 ? 's' : ''}:`}
                  </div>
                  {msg.events.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {sorted.map((event) => {
                        const ei = msg.events.indexOf(event);
                        return (
                          <EventPreviewCard
                            key={ei}
                            event={event}
                            members={members}
                            onChange={(updated) => updateEventInMessage(i, ei, updated)}
                            onRemove={() => removeEventFromMessage(i, ei)}
                          />
                        );
                      })}
                    </div>
                  )}
                  {msg.events.length > 0 && (
                    msg.confirmed ? (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="h-3.5 w-3.5" />
                        {msg.events.length} evento{msg.events.length !== 1 ? 's' : ''} creado
                        {msg.events.length !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="self-start"
                        onClick={() => handleConfirmEvents(msg.events, i)}
                        disabled={confirmingEventIdx === i}
                      >
                        {confirmingEventIdx === i ? (
                          <>
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            Creando…
                          </>
                        ) : (
                          `Crear ${msg.events.length} evento${msg.events.length !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    )
                  )}
                </div>
              );
            }

            /* ── Tasks preview (desde audio o texto) ── */
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
                        return (
                          <div key={ti} className="space-y-1">
                            <TaskPreviewCard
                              task={task}
                              members={members}
                              locations={locations}
                              projects={projects}
                              cycles={cycles}
                              objectives={objectives}
                              onChange={(u) => updateTaskInMessage(i, ti, u)}
                              onRemove={() => removeTaskFromMessage(i, ti)}
                            />
                            {!msg.confirmed && (
                              <button
                                type="button"
                                onClick={() => handleOpenInForm(task)}
                                className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                              >
                                <Pencil className="h-3 w-3" />
                                Editar en formulario
                              </button>
                            )}
                          </div>
                        );
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
            placeholder={micState === 'recording' ? '🔴 Grabando… pulsá 🎤 para detener' : PLACEHOLDER}
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
