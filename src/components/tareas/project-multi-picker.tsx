'use client';

import { FolderKanban, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NamedProject {
  id: string;
  name: string;
}

export interface ProjectMultiPickerProps {
  projects: NamedProject[];
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  size?: 'sm' | 'md';
  placeholder?: string;
}

export function ProjectMultiPicker({
  projects,
  value,
  onChange,
  className,
  size = 'sm',
  placeholder = 'Tableros',
}: ProjectMultiPickerProps) {
  if (projects.length === 0) return null;

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...value, id]);
    } else {
      onChange(value.filter((v) => v !== id));
    }
  };

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? projects.find((p) => p.id === value[0])?.name ?? placeholder
        : `${value.length} tableros`;

  const btnClass = size === 'sm'
    ? 'h-auto min-h-0 px-1 py-0.5 text-[10px] font-normal gap-0.5'
    : 'h-10 w-full justify-between text-sm font-normal';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'border-border bg-background text-foreground',
            btnClass,
            className,
          )}
        >
          <FolderKanban className={cn('text-muted-foreground shrink-0', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
          <span className="truncate max-w-[120px]">{label}</span>
          <ChevronDown className={cn('opacity-50 shrink-0', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-56 overflow-y-auto">
        {projects.map((p) => (
          <DropdownMenuCheckboxItem
            key={p.id}
            checked={value.includes(p.id)}
            onCheckedChange={(checked) => toggle(p.id, checked === true)}
            onSelect={(e) => e.preventDefault()}
            className="gap-2 text-xs"
          >
            <FolderKanban className="h-3 w-3 shrink-0 text-muted-foreground" />
            {p.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Muestra el picker solo si hay más de un tablero o multi-tableros habilitado. */
export function shouldShowProjectMultiPicker(
  projectsCount: number,
  multipleBoards: boolean,
): boolean {
  return multipleBoards || projectsCount > 1;
}
