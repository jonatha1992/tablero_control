'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, ListTodo, Send, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssistantChat } from '@/hooks/mutations/use-assistant-chat';
import { DictateTasksContent } from '@/components/tareas/dictate-tasks-modal';

interface AiAssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'assistant' | 'tasks';

const SUGGESTIONS = [
  '¿Qué tareas están vencidas?',
  '¿Qué tengo para hoy?',
  '¿Qué hay en progreso?',
  '¿Cómo creo un sprint?',
];

export function AiAssistantPanel({ open, onOpenChange }: AiAssistantPanelProps) {
  const [tab, setTab] = useState<Tab>('assistant');
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ai_panel_muted') === 'true';
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgLenRef = useRef(0);
  const { messages, send, clear, isPending } = useAssistantChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (
      tab === 'assistant' &&
      messages.length > prevMsgLenRef.current &&
      lastMsg?.role === 'assistant' &&
      !isMuted
    ) {
      const utterance = new SpeechSynthesisUtterance(lastMsg.content);
      utterance.lang = 'es-AR';
      utterance.rate = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    prevMsgLenRef.current = messages.length;
  }, [messages, isMuted, tab]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('ai_panel_muted', String(next));
    if (next) window.speechSynthesis.cancel();
  };

  const handleSend = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isPending) return;
    setInput('');
    await send(msg);
  };

  const handleClose = () => {
    if (isPending) return;
    window.speechSynthesis.cancel();
    clear();
    setInput('');
    setTab('assistant');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-2xl flex flex-col p-0 gap-0 h-[580px]"
        onInteractOutside={(e) => { if (isPending) e.preventDefault(); }}
      >
        <DialogHeader className="px-4 pt-3 pb-0 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <DialogTitle className="text-base flex-1">Asistente IA</DialogTitle>
            <button
              onClick={toggleMute}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={isMuted ? 'Activar audio' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setTab('assistant')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === 'assistant'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              Asistente
            </button>
            <button
              onClick={() => setTab('tasks')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === 'tasks'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <ListTodo className="h-3.5 w-3.5" />
              Crear tareas
            </button>
          </div>
        </DialogHeader>

        {/* Tab: Asistente */}
        {tab === 'assistant' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 text-center h-full text-muted-foreground">
                  <Bot className="h-10 w-10 opacity-15" />
                  <div>
                    <p className="text-sm font-medium text-foreground/70">¿En qué puedo ayudarte?</p>
                    <p className="text-xs mt-0.5">Preguntame sobre el sistema, tus tareas o cómo usar cada función</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm',
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex gap-1 items-center bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 self-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="border-t px-3 py-2.5 flex items-center gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Preguntá lo que quieras…"
                disabled={isPending}
                className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isPending}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* Tab: Crear tareas */}
        {tab === 'tasks' && (
          <DictateTasksContent onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
