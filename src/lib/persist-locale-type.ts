import { auth } from '@/lib/firebase/client';
import { normalizeLocationTypeSlug } from '@/lib/location-types';
import type { BusinessSettings } from '@/types/domain/business';

/** Append a new location type slug to the espacio's localeTypes if missing. */
export async function persistLocaleType(
  settings: BusinessSettings | undefined,
  rawType: string,
): Promise<void> {
  const slug = normalizeLocationTypeSlug(rawType);
  if (!slug) return;

  const current = (settings?.localeTypes ?? []).map(normalizeLocationTypeSlug);
  if (current.includes(slug)) return;

  const token = await auth.currentUser?.getIdToken();
  if (!token) return;

  const res = await fetch('/api/business/config', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      settings: {
        ...settings,
        localeTypes: [...current, slug],
      },
    }),
  });

  if (!res.ok) {
    throw new Error('locale_type_save_failed');
  }
}
