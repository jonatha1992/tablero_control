'use client';

import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatLocationTypeLabel, normalizeLocationTypeSlug } from '@/lib/location-types';

export const CUSTOM_LOCATION_TYPE = '__custom__';

interface LocationTypeSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LocationTypeSelect({ value, options, onChange, disabled }: LocationTypeSelectProps) {
  const listId = useId();
  const normalizedValue = normalizeLocationTypeSlug(value);
  const isKnown = options.includes(normalizedValue);
  const [mode, setMode] = useState<'list' | 'custom'>(isKnown || !normalizedValue ? 'list' : 'custom');
  const [customDraft, setCustomDraft] = useState(isKnown ? '' : normalizedValue);

  useEffect(() => {
    const known = options.includes(normalizedValue);
    if (known || !normalizedValue) {
      setMode('list');
      if (known) setCustomDraft('');
    } else {
      setMode('custom');
      setCustomDraft(normalizedValue);
    }
  }, [normalizedValue, options]);

  const selectValue = mode === 'custom' ? CUSTOM_LOCATION_TYPE : normalizedValue || options[0] || '';

  return (
    <div className="space-y-2">
      <select
        id={listId}
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === CUSTOM_LOCATION_TYPE) {
            setMode('custom');
            onChange(customDraft || '');
            return;
          }
          setMode('list');
          setCustomDraft('');
          onChange(next);
        }}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatLocationTypeLabel(opt)}
          </option>
        ))}
        <option value={CUSTOM_LOCATION_TYPE}>Agregar otro tipo…</option>
      </select>

      {mode === 'custom' && (
        <Input
          placeholder="Ej: Depósito, Oficina, Proyecto"
          value={customDraft}
          onChange={(e) => {
            const slug = normalizeLocationTypeSlug(e.target.value);
            setCustomDraft(slug);
            onChange(slug);
          }}
          disabled={disabled}
          maxLength={40}
          aria-label="Nuevo tipo"
        />
      )}
    </div>
  );
}
