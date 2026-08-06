/**
 * Canonical API key collector — TypeScript port.
 *
 * This is the same contract as `collect_api_keys()` in the Python repos
 * (Auditext, anotador, spinpredictor, matchanalyzer, mis_gastos_tracker). Keep
 * the two in sync: a provider key that resolves in one repo and not in another
 * is the exact class of bug this file exists to prevent.
 *
 * Behaviours it unifies:
 *   1. Strips BOM (U+FEFF) and surrounding quotes. A key pasted into a hosting
 *      dashboard can carry an invisible BOM, which then blows up header
 *      encoding at request time with an error that names neither the key nor
 *      the variable.
 *   2. Reads up to key number 20, so adding a key never silently does nothing.
 *   3. Accepts a single-line comma or semicolon separated list
 *      (`GEMINI_API_KEYS=k1,k2,k3`), which is how hosting providers prefer it.
 *   4. Discards `.env.example` placeholders, so an unfilled file fails with
 *      "no key configured" instead of a cryptic 401.
 *   5. Deduplicates by value, preserving order.
 */

const KEY_LIMIT = 20;

function looksLikePlaceholder(value: string): boolean {
  const low = value.toLowerCase();
  if (
    low.startsWith('your') ||
    low.startsWith('tu_') ||
    low.startsWith('tu-') ||
    low.startsWith('<')
  ) {
    return true;
  }
  return ['api-key-here', 'api_key_here', 'xxxxxxxx', 'changeme', 'replace-me', 'no-key'].some(
    (marker) => low.includes(marker),
  );
}

function sanitizeApiKey(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^﻿+/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  if (!cleaned || looksLikePlaceholder(cleaned)) return null;
  return cleaned;
}

/**
 * Collect every key a provider has in the environment.
 *
 * Reads, in this order and deduplicating by value:
 *   PREFIX+S  (comma or semicolon separated list)
 *   PREFIX
 *   PREFIX1..PREFIX{limit}  and  PREFIX_1..PREFIX_{limit}
 *
 * `extraNames` covers legacy variable names a repo still has to honour.
 */
export function collectApiKeys(
  prefix: string,
  options: { limit?: number; extraNames?: string[] } = {},
): string[] {
  const { limit = KEY_LIMIT, extraNames = [] } = options;
  const keys: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string | undefined): void => {
    if (!raw) return;
    for (const part of raw.replace(/;/g, ',').split(',')) {
      const key = sanitizeApiKey(part);
      if (key && !seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  };

  add(process.env[`${prefix}S`]);
  add(process.env[prefix]);
  for (const name of extraNames) add(process.env[name]);
  for (let n = 1; n <= limit; n += 1) {
    add(process.env[`${prefix}${n}`]);
    add(process.env[`${prefix}_${n}`]);
  }
  return keys;
}
