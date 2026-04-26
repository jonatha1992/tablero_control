export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // browser sin acceso a localStorage (SSR, incógnito bloqueado)
  }
}

export function getLocalStorage<T>(key: string, fallback?: T): T | undefined {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}
