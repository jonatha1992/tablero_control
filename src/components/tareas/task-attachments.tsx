'use client';

import { useRef, useState } from 'react';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { auth } from '@/lib/firebase/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { Paperclip, Upload, Trash2, FileText, Image, Loader2, File } from 'lucide-react';

interface Props {
  task: Task;
}

function getFileIcon(url: string) {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg)/.test(lower)) return Image;
  if (/\.pdf/.test(lower)) return FileText;
  return File;
}

function getFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split('/').pop() ?? url);
  } catch {
    return url;
  }
}

export function TaskAttachments({ task }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [pendingDeleteUrl, setPendingDeleteUrl] = useState<string | null>(null);
  const updateTask = useUpdateTask();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  async function uploadFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`El archivo "${file.name}" supera los 10 MB`);
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'attachment');
      fd.append('id', task.id);
      fd.append('fileName', file.name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Error al subir archivo');
      const data = await res.json() as { url: string };

      const current: string[] = task.attachmentUrls ?? [];
      updateTask.mutate({ id: task.id, data: { attachmentUrls: [...current, data.url] } });
    } catch (err) {
      setUploadError(`Error: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) void uploadFile(file);
  }

  function handleDelete() {
    if (!pendingDeleteUrl) return;
    const updated = (task.attachmentUrls ?? []).filter((u) => u !== pendingDeleteUrl);
    updateTask.mutate(
      { id: task.id, data: { attachmentUrls: updated } },
      { onSuccess: () => setPendingDeleteUrl(null) }
    );
  }


  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <p className="text-sm">Arrastrá archivos o hacé click para seleccionar</p>
            <p className="text-xs">Máx 10 MB · JPG, PNG, PDF, DOC, TXT</p>
            {uploadError && (
              <p className="text-xs text-destructive mt-1">{uploadError}</p>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {task.attachmentUrls?.length > 0 && (
        <ul className="space-y-2">
          {task.attachmentUrls.map((url) => {
            const Icon = getFileIcon(url);
            const attachment = task.attachments?.find(a => a.url === url);
            const name = attachment?.name ?? getFileName(url);
            const isImage = /\.(jpg|jpeg|png|gif|webp)/.test(url.toLowerCase());
            return (
              <li key={url} className="flex items-center gap-3 border rounded-lg p-2 group">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={name} className="h-10 w-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm truncate hover:underline"
                >
                  {name}
                </a>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDeleteUrl(url); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(!task.attachmentUrls || task.attachmentUrls.length === 0) && !uploading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5" /> Sin adjuntos
        </p>
      )}
      <ConfirmDialog
        open={pendingDeleteUrl !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteUrl(null); }}
        title="Eliminar adjunto"
        description="El archivo se quitará de esta tarea."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={updateTask.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
