export interface Shortcut {
  id: string;
  name: string;
  icon: string;
  type: 'app' | 'url';
  target: string;
}

export const STORAGE_KEY = 'deck_shortcuts_v1';

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    icon: '🌐',
    type: 'app',
    target: 'Google Chrome',
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: '💻',
    type: 'app',
    target: 'Visual Studio Code',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    type: 'url',
    target: 'https://www.youtube.com',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    icon: '🧑‍💻',
    type: 'app',
    target: 'Antigravity IDE',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    type: 'url',
    target: 'https://open.spotify.com',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '🔣',
    type: 'app',
    target: 'Terminal',
  },
];

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deck-shortcuts-changed'));
  }
}

export function getLocalShortcuts(): Shortcut[] {
  if (typeof window === 'undefined') {
    return DEFAULT_SHORTCUTS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with defaults on first run
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
      return DEFAULT_SHORTCUTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_SHORTCUTS;
  } catch (err) {
    console.error('Failed to read shortcuts from localStorage:', err);
    return DEFAULT_SHORTCUTS;
  }
}

export function saveLocalShortcuts(shortcuts: Shortcut[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    notifyChange();
  } catch (err) {
    console.error('Failed to save shortcuts to localStorage:', err);
  }
}

export function addLocalShortcut(data: Omit<Shortcut, 'id'>): Shortcut {
  const current = getLocalShortcuts();
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  const newShortcut: Shortcut = {
    id,
    name: data.name.trim(),
    icon: data.icon.trim() || '🚀',
    type: data.type,
    target: data.target.trim(),
  };

  const updated = [...current, newShortcut];
  saveLocalShortcuts(updated);
  return newShortcut;
}

export function updateLocalShortcut(id: string, data: Partial<Shortcut>): Shortcut | null {
  const current = getLocalShortcuts();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updatedShortcut: Shortcut = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    icon: data.icon !== undefined ? data.icon.trim() : existing.icon,
    type: data.type !== undefined ? data.type : existing.type,
    target: data.target !== undefined ? data.target.trim() : existing.target,
  };

  current[index] = updatedShortcut;
  saveLocalShortcuts(current);
  return updatedShortcut;
}

export function deleteLocalShortcut(id: string): boolean {
  const current = getLocalShortcuts();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length === current.length) return false;

  saveLocalShortcuts(filtered);
  return true;
}

export function resetLocalShortcuts(): Shortcut[] {
  saveLocalShortcuts(DEFAULT_SHORTCUTS);
  return DEFAULT_SHORTCUTS;
}

export function exportShortcutsJson(): string {
  const shortcuts = getLocalShortcuts();
  return JSON.stringify(shortcuts, null, 2);
}

export function importShortcutsJson(jsonString: string): { success: boolean; count?: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'JSON content must be an array of shortcuts' };
    }

    const validated: Shortcut[] = parsed.map((item, idx) => {
      if (!item.name || typeof item.name !== 'string') {
        throw new Error(`Item at position ${idx + 1} is missing a valid 'name'`);
      }
      if (!item.target || typeof item.target !== 'string') {
        throw new Error(`Shortcut "${item.name}" is missing a valid 'target'`);
      }
      return {
        id: item.id && typeof item.id === 'string' ? item.id : Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        name: item.name.trim(),
        icon: (item.icon && typeof item.icon === 'string') ? item.icon.trim() : '🚀',
        type: item.type === 'url' ? 'url' : 'app',
        target: item.target.trim(),
      };
    });

    saveLocalShortcuts(validated);
    return { success: true, count: validated.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'Invalid JSON format' };
  }
}
