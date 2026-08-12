'use client';

import Link from 'next/link';
import { CircleHelp, CreditCard, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface HeaderUserMenuProps { displayName: string; initials: string; avatarColor: string; avatar?: string | null; roleLabel?: string; roleClassName?: string; canManageBilling?: boolean; onSignOut: () => void; }

export function HeaderUserMenu({ displayName, initials, avatarColor, avatar, roleLabel, roleClassName, canManageBilling = false, onSignOut }: HeaderUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Abrir menú de ${displayName}`}>
          <Avatar className="h-7 w-7 shrink-0">{avatar && <AvatarImage src={avatar} alt={displayName} />}<AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>{initials}</AvatarFallback></Avatar>
          <span className="hidden max-w-40 truncate text-sm font-medium md:inline">{displayName}</span>
          {roleLabel && <Badge className={`${roleClassName ?? ''} hidden h-5 px-1.5 text-[10px] md:inline-flex`}>{roleLabel}</Badge>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel><DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard/config"><Settings className="mr-2 h-4 w-4" />Configuración</Link></DropdownMenuItem>
        {canManageBilling && <DropdownMenuItem asChild><Link href="/dashboard/billing"><CreditCard className="mr-2 h-4 w-4" />Facturación</Link></DropdownMenuItem>}
        <DropdownMenuItem asChild><Link href="/dashboard/ayuda"><CircleHelp className="mr-2 h-4 w-4" />Ayuda</Link></DropdownMenuItem><DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
