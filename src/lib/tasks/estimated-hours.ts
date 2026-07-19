export function hoursToParts(estimatedHours?: number): { h: number; min: number } | null {
  if (estimatedHours == null) return null;

  const totalMinutes = Math.round(estimatedHours * 60);
  return {
    h: Math.floor(totalMinutes / 60),
    min: totalMinutes % 60,
  };
}

export function partsToHours(h: number, min: number): number | undefined {
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(min) ? min : 0;

  if (hours === 0 && minutes === 0) return undefined;

  return hours + minutes / 60;
}

export function formatEstimatedHours(estimatedHours?: number): string {
  const parts = hoursToParts(estimatedHours);
  if (!parts) return '';

  const { h, min } = parts;
  if (h === 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}
