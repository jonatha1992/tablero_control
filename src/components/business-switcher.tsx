'use client';

import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/auth-context';
import { LABELS, displaySpaceName } from '@/lib/terminology';

export function BusinessSwitcher() {
  const { user, switchBusiness } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const activeMembership = user.memberships?.find((m) => m.businessId === user.businessId && m.isActive);
  const activeBusinessName = displaySpaceName(activeMembership?.businessName);
  const hasOwnedBusiness = user.hasOwnedBusiness ?? false;

  const handleCreateBusiness = () => {
    if (hasOwnedBusiness) {
      router.push('/register?newBusiness=true');
    } else {
      router.push('/dashboard/config');
    }
  };

  const handleSwitch = (businessId: string) => {
    if (businessId === user.businessId) return;
    // Navigate away from detail views (task/member) before switching tenant,
    // so old route params don't immediately refetch cross-tenant resources.
    router.push('/dashboard');
    void switchBusiness(businessId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
          <Building2 className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate hidden sm:inline">{activeBusinessName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user.memberships
          ?.filter((m) => m.isActive)
          .map((m) => (
            <DropdownMenuItem
              key={m.businessId}
              className="flex cursor-pointer items-center justify-between gap-2"
              onClick={() => handleSwitch(m.businessId)}
            >
              <span className="truncate">{displaySpaceName(m.businessName) || m.businessId}</span>
              {m.businessId === user.businessId && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-muted-foreground"
          onClick={handleCreateBusiness}
        >
          <Plus className="h-3.5 w-3.5" />
          {hasOwnedBusiness ? LABELS.anotherSpace : `Armar tu ${LABELS.space.toLowerCase()}`}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
