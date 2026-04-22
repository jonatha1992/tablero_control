'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Users, CreditCard, ScrollText, Settings, LogOut,
} from 'lucide-react';
import { logout as signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/superadmin',              label: 'Plataforma',    icon: LayoutDashboard },
  { href: '/superadmin/businesses',   label: 'Negocios',      icon: Building2 },
  { href: '/superadmin/users',        label: 'Usuarios',      icon: Users },
  { href: '/superadmin/subscriptions',label: 'Suscripciones', icon: CreditCard },
  { href: '/superadmin/audit',        label: 'Auditoría',     icon: ScrollText },
];

export function SuperadminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <aside className="w-56 shrink-0 bg-zinc-950 text-zinc-100 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-zinc-800 flex items-center gap-3">
        <Image src="/logo.png" alt="TecnoFusión Logo" width={40} height={40} className="rounded-lg object-contain" />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">TecnoFusión</p>
          <p className="font-bold mt-0.5">Panel Superadmin</p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/superadmin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
