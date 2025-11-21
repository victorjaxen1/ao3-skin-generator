import { SkinProject } from './schema';

const KEY = 'ao3SkinProject';

export function loadStoredProject<T extends SkinProject>(fallback: () => T): T {
  if (typeof window === 'undefined') return fallback();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw);
    // shallow shape check
    if (!parsed || !parsed.settings || !Array.isArray(parsed.messages)) return fallback();
    return parsed;
  } catch { return fallback(); }
}

export function persistProject(project: SkinProject) {
  try { localStorage.setItem(KEY, JSON.stringify(project)); } catch { /* ignore */ }
}
