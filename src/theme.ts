// src/theme.ts

export type ThemeId =
  | 'green-glass'
  | 'cream-glass'
  | 'white-glass'
  | 'yellow-glass'
  | 'orange-glass'
  | 'purple-glass'
  | 'gray-glass'
  | 'light-black-glass'
  | 'dark-glass';

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  emoji: string;
  gradient: string;
  preview: string;
};

export const themeOptions: ThemeDefinition[] = [
  {
    id: 'green-glass',
    label: 'Green Glass',
    emoji: '🍀',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    preview: 'linear-gradient(135deg, #34d399, #059669)',
  },
  {
    id: 'cream-glass',
    label: 'Cream Glass',
    emoji: '🍦',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    preview: 'linear-gradient(135deg, #fef3c7, #fde68a)',
  },
  {
    id: 'white-glass',
    label: 'White Glass',
    emoji: '🤍',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    preview: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
  },
  {
    id: 'yellow-glass',
    label: 'Yellow Glass',
    emoji: '💛',
    gradient: 'linear-gradient(135deg, #fde047 0%, #eab308 100%)',
    preview: 'linear-gradient(135deg, #fde047, #eab308)',
  },
  {
    id: 'orange-glass',
    label: 'Orange Glass',
    emoji: '🧡',
    gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
    preview: 'linear-gradient(135deg, #fb923c, #ea580c)',
  },
  {
    id: 'purple-glass',
    label: 'Purple Glass',
    emoji: '💜',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
    preview: 'linear-gradient(135deg, #c084fc, #a855f7)',
  },
  {
    id: 'gray-glass',
    label: 'Gray Glass',
    emoji: '🩶',
    gradient: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
    preview: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
  },
  {
    id: 'light-black-glass',
    label: 'Light Black Glass',
    emoji: '🖤',
    gradient: 'linear-gradient(135deg, #3f3f46 0%, #18181b 100%)',
    preview: 'linear-gradient(135deg, #3f3f46, #18181b)',
  },
  {
    id: 'dark-glass',
    label: 'Dark Glass',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    preview: 'linear-gradient(135deg, #1e293b, #0f172a)',
  },
];

const STORAGE_KEY = 'sjcm_theme';

export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'cream-glass';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && themeOptions.some((t) => t.id === stored)) {
    return stored as ThemeId;
  }
  return 'cream-glass';
}

export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', themeId);
  window.localStorage.setItem(STORAGE_KEY, themeId);
}

export function getThemeDefinition(id: string): ThemeDefinition {
  return themeOptions.find((t) => t.id === id) ?? themeOptions[1];
}