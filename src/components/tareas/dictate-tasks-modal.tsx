'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Loader2, X, ChevronDown, Send, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useDictateTasksUpload,
  useDictateTasksFromText,
  useConfirmDictatedTasks,
} from '@/hooks/mutations/use-dictate-tasks';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';

interface DictateTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UserMessage = { role: 'user'; text: string };
type AssistantMessage = {
  role: 'assistant';
  tasks: ExtractedTask[];
  parseError: boolean;
  confirmed: boolean;
};
type ChatMessage = UserMessage | AssistantMessage;

/* ─── Task preview card (inline, editable) ─── */

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'Por hacer', in_progress: 'En progreso',
};
const TYPE_LABELS: Record<TaskType, string> = {
  task: 'Tarea', feature: 'Feature', bug: 'Bug', improvement: 'Mejora', documentation: 'Doc.',
};
const PRIORITY_BORDER: Record<TaskPriority, string> = {
  low: 'border-l-slate-300', medium: 'border-l-blue-400',
  high: 'border-l-orange-400', urgent: 'border-l-red-500',
};

function TaskPreviewCard({
  task,
  members,
  onChange,
  onRemove,
}: {
  task: ExtractedTask;
  members: { id: string; name: string }[];
  onChange: (t: ExtractedTask) => void;
  onRemove: () => void;
}) {
  return (
    <div className={cn('relative rounded-lg border border-border bg-card p-2.5 border-l-4 text-xs', PRIORITY_BORDER[task.priority])}>
      <div className="flex items-start gap-1.5 mb-1.5">
        <span className="shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold mt-0.5">
          {task.order}
        </span>
        <Input
          value={task.title}
          onChange={(e) => onChange({ ...task, title: e.target.value })}
          className="h-6 text-xs font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent flex-1"
          placeholder="Título"
        />
        <button type="button" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <select
          value={task.priority}
          onChange={(e) => onChange({ ...task, priority: e.target.value as TaskPriority })}
          className="rounded border border-border bg-background px-1 py-0.5 text-[10px]"
        >
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <select
          value={task.status}
          onChange={(e) => onChange({ ...task, status: e.target.value as Extract<TaskStatus, 'todo' | 'in_progress'> })}
          className="rounded border border-border bg-background px-1 py-0.5 text-[10px]"
        >
          {Object.entries(STATUS_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        {task.dueDate && (
          <span className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
            📅 {task.dueDate}
          </span>
        )}
        <label className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
          ⏱
          <input
            type="number" min={0.5} max={99} step={0.5}
            value={task.estimatedHours ?? ''}
            onChange={(e) => onChange({ ...task, estimatedHours: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="h"
            className="w-8 bg-transparent outline-none"
          />
          h
        </label>
        {members.length > 0 && members.slice(0, 3).map((m) => {
          const assigned = task.assigneeIds.includes(m.id);
          return (
            <button
              key={m.id} type="button"
              onClick={() => onChange({ ...task, assigneeIds: assigned ? task.assigneeIds.filter((id) => id !== m.id) : [...task.assigneeIds, m.id] })}
              className={cn('rounded-full px-1.5 py-0.5 text-[10px] border transition-colors', assigned ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary')}
            >
              {m.name.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main modal ─── */

export function DictateTasksModal({ open, onOpenChange }: DictateTasksModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [creatingIdx, setCreatingIdx] = useState<number | null>(null);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: membersData } = useMembersQuery();
  const members = (membersData ?? []).map((m) => ({ id: m.id, name: m.name }));

  const fromTextMutation = useDictateTasksFromText();
  const uploadMutation = useDictateTasksUpload();
  const confirmMutation = useConfirmDictatedTasks();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const pushAssistant = (tasks: ExtractedTask[], parseError: boolean) => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', tasks, parseError, confirmed: false },
    ]);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsProcessing(true);
    try {
      const result = await fromTextMutation.mutateAsync(text);
      pushAssistant(result.tasks, result.parseError);
    } catch {
      // error ya notificado por la mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendText(text);
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
              if (data.transcription) {
                setMessages((prev) => [...prev, { role: 'user', text: data.transcription }]);
                pushAssistant(data.tasks, data.parseError);
              }
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
    }
  };

  const handleConfirm = (tasks: ExtractedTask[], msgIdx: number) => {
    setCreatingIdx(msgIdx);
    confirmMutation.mutate(tasks, {
      onSuccess: () => {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === msgIdx && m.role === 'assistant' ? { ...m, confirmed: true } : m
          )
        );
        setCreatingIdx(null);
      },
      onError: () => setCreatingIdx(null),
    });
  };

  const updateTask = (msgIdx: number, taskIdx: number, updated: ExtractedTask) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== 'assistant') return m;
        return { ...m, tasks: m.tasks.map((t, ti) => (ti === taskIdx ? updated : t)) };
      })
    );
  };

  const removeTask = (msgIdx: number, taskIdx: number) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || m.role !== 'assistant') return m;
        return { ...m, tasks: m.tasks.filter((_, ti) => ti !== taskIdx) };
      })
    );
  };

  const handleClose = () => {
    if (isProcessing || micState !== 'idle') return;
    setMessages([]);
    setInput('');
    onOpenChange(false);
  };

  const isLocked = isProcessing || micState !== 'idle';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-md flex flex-col p-0 gap-0 h-[560px]"
        onInteractOutside={(e) => { if (isLocked) e.preventDefault(); }}
      >
        <DialogHeader className="flex-row items-center gap-2 px-4 py-3 border-b shrink-0">
          <MessageSquare className="h-4 w-4 text-primary shrink-0" />
          <DialogTitle className="text-base">Crear con IA</DialogTitle>
        </DialogHeader>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 text-center h-full text-muted-foreground">
              <MessageSquare className="h-10 w-10 opacity-15" />
              <div>
                <p className="text-sm font-medium text-foreground/70">Contame qué necesitás hacer</p>
                <p className="text-xs mt-0.5">La IA detecta tareas, orden y horas estimadas</p>
              </div>
              <div className="text-xs bg-muted/50 rounded-lg p-3 text-left space-y-1 max-w-[240px]">
                <p className="font-medium text-foreground/60 mb-1.5">Ejemplos:</p>
                <p>"Login de usuarios, después el panel de admin"</p>
                <p>"Revisar el inventario del local centro"</p>
                <p>"Limpieza de cocina, salón y baños para mañana"</p>
              </div>
            </div>
          )}

          {messages.map((msg, msgIdx) => {
            if (msg.role === 'user') {
              return (
                <div key={msgIdx} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const sorted = [...msg.tasks].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

            return (
              <div key={msgIdx} className="flex flex-col gap-2">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm self-start max-w-[85%]">
                  {msg.parseError || msg.tasks.length === 0
                    ? 'No detecté tareas en el texto. ¿Podés ser más específico?'
                    : `Encontré ${msg.tasks.length} tarea${msg.tasks.length !== 1 ? 's' : ''}:`}
                </div>

                {msg.tasks.length > 0 && (
                  <div className="flex flex-col gap-1.5 pl-1">
                    {sorted.map((task) => {
                      const ti = msg.tasks.indexOf(task);
                      return (
                        <TaskPreviewCard
                          key={ti}
                          task={task}
                          members={members}
                          onChange={(updated) => updateTask(msgIdx, ti, updated)}
                          onRemove={() => removeTask(msgIdx, ti)}
                        />
                      );
                    })}
                  </div>
                )}

                {msg.tasks.length > 0 && (
                  msg.confirmed ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 pl-1">
                      <Check className="h-3.5 w-3.5" />
                      {msg.tasks.length} tarea{msg.tasks.length !== 1 ? 's' : ''} creada{msg.tasks.length !== 1 ? 's' : ''}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="self-start ml-1"
                      onClick={() => handleConfirm(msg.tasks, msgIdx)}
                      disabled={creatingIdx === msgIdx}
                    >
                      {creatingIdx === msgIdx ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Creando…</>
                      ) : (
                        `Crear ${msg.tasks.length} tarea${msg.tasks.length !== 1 ? 's' : ''}`
                      )}
                    </Button>
                  )
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isProcessing && (
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
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={micState === 'recording' ? 'Grabando…' : 'Describí las tareas…'}
            disabled={isProcessing || micState !== 'idle'}
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleMic}
            disabled={isProcessing || micState === 'processing'}
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0',
              micState === 'recording'
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-muted hover:bg-muted-foreground/20 text-muted-foreground'
            )}
            title={micState === 'recording' ? 'Detener grabación' : 'Grabar audio'}
          >
            {micState === 'processing'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || micState !== 'idle'}
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
