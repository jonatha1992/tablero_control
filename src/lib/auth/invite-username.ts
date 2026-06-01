import type { PrismaClient } from '@prisma/client';

const USERNAME_PATTERN = /^[a-z0-9_.-]{3,30}$/;

export function nameToUsernameBase(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  if (normalized.length >= 3) {
    return normalized.slice(0, 30);
  }

  const fallback = normalized.replace(/\./g, '') || 'user';
  return fallback.padEnd(3, '0').slice(0, 30);
}

export function syntheticEmail(username: string): string {
  return `${username}@guest.local`;
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export async function ensureUniqueUsername(
  prisma: Pick<PrismaClient, 'user'>,
  base: string,
): Promise<string> {
  const root = isValidUsername(base) ? base : nameToUsernameBase(base);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate =
      attempt === 0 ? root : `${root.slice(0, Math.max(1, 28 - String(attempt + 1).length))}-${attempt + 1}`;

    if (!isValidUsername(candidate)) continue;

    const existing = await prisma.user.findFirst({
      where: { username: { equals: candidate, mode: 'insensitive' } },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  throw new Error('username_generation_failed');
}
