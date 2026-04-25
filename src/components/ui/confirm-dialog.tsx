'use client';

/**
 * ConfirmDialog — Diálogo de confirmación reutilizable.
 * Basado en @radix-ui/react-dialog (ya instalado).
 *
 * Uso:
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Eliminar tarea"
 *     description="¿Estás seguro? Esta acción no se puede deshacer."
 *     confirmLabel="Eliminar"
 *     variant="destructive"
 *     onConfirm={() => deleteMutation.mutate(id)}
 *   />
 */

import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

type Variant = 'destructive' | 'warning' | 'default';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  loading?: boolean;
}

const variantConfig: Record<Variant, { icon: React.ElementType; iconColor: string; confirmClass: string }> = {
  destructive: {
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    confirmClass:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    confirmClass:
      'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400',
  },
  default: {
    icon: Info,
    iconColor: 'text-primary',
    confirmClass:
      'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const { icon: Icon, iconColor, confirmClass } = variantConfig[variant];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={description ? undefined : "dialog-description"}
        >
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={cn('mt-0.5 shrink-0', iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <Dialog.Title className="text-base font-semibold leading-tight">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description id="dialog-description" className="sr-only">
                  Confirmar acción
                </Dialog.Description>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                disabled={loading}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm();
              }}
              disabled={loading}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
                confirmClass
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
