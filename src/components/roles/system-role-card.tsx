'use client';

import { Lock, CheckCircle2 } from 'lucide-react';

interface SystemRole {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  permissions: readonly string[];
}

interface Props {
  role: SystemRole;
}

export function SystemRoleCard({ role }: Props) {
  return (
    <div className="border bg-card rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center"
            style={{ backgroundColor: role.color }}
          >
            <span className="text-white text-xs font-bold">
              {role.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm leading-tight">{role.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role.slug}</p>
          </div>
        </div>
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      </div>

      <p className="text-xs text-muted-foreground">{role.description}</p>

      <ul className="space-y-1">
        {role.permissions.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
