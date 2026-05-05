'use client';

import { useState, useRef, useEffect } from 'react';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import type { User } from '@/types';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  maxLength?: number;
}

export function MentionInput({ value, onChange, onSubmit, placeholder, maxLength }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: members = [] } = useMembersQuery();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart ?? 0;
    onChange(newValue);
    setCursorPosition(pos);

    // Detectar si estamos escribiendo una mención
    const textBeforeCursor = newValue.slice(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Solo mostrar sugerencias si no hay espacio después del @
      if (!textAfterAt.includes(' ')) {
        setQuery(textAfterAt.toLowerCase());
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelectMember = (member: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const beforeMention = value.slice(0, lastAtIndex);
    const afterCursor = value.slice(cursorPosition);
    const newValue = `${beforeMention}@${member.name} ${afterCursor}`;
    onChange(newValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const filteredMembers = query
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      )
    : members;

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full max-h-40 overflow-y-auto rounded-md border bg-background shadow-md z-50">
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelectMember(member)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
            >
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{member.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
