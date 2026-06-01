const ES_MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Locale-safe date formatting.
 *
 * We avoid `toLocaleDateString()` because in some Windows/Node setups it can be
 * unexpectedly slow or hang in test environments (missing/partial ICU data).
 */
export function formatDate(date: Date | string, locale = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  if (locale.startsWith('es')) {
    const day = d.getDate();
    const month = ES_MONTHS_SHORT[d.getMonth()] ?? '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Fallback: stable, locale-agnostic.
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatMonthDay(date: Date | string, locale = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  if (locale.startsWith('es')) {
    const day = d.getDate();
    const month = ES_MONTHS_SHORT[d.getMonth()] ?? '';
    return `${day} ${month}`;
  }
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatTimeHHMM(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}


