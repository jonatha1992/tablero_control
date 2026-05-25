'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info } from 'lucide-react';

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
  hideCancel?: boolean;
  children?: React.ReactNode;
}

const variantConfig: Record<Variant, { icon: React.ElementType; iconColor: string; confirmClass: string }> = {
  destructive: {
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    confirmClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    confirmClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  default: {
    icon: Info,
    iconColor: 'text-primary',
    confirmClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
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
  hideCancel = false,
  children,
}: ConfirmDialogProps) {
  const { icon: Icon, iconColor, confirmClass } = variantConfig[variant];

  function handleOpenChange(next: boolean) {
    if (loading) return;
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (loading) e.preventDefault(); }}>
        <DialogHeader className="flex flex-row items-start gap-4">
          <div className={cn('mt-1 shrink-0', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          {!hideCancel && (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn(confirmClass)}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
