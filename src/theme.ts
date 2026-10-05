// src/theme.ts

export type ThemeId =
  | 'warm-ivory'
  | 'warm-cream'
  | 'soft-almond'
  | 'pale-sand'
  | 'ivory-mist'
  | 'midnight-navy'
  | 'deep-navy'
  | 'slate-navy'
  | 'steel-navy'
  | 'ink-navy';

export type ThemeMode = 'light' | 'dark';

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  emoji: string;
  mode: ThemeMode;
  gradient: string;
  preview: string;
};

export const themeOptions: ThemeDefinition[] = [
  /* ============================================
     LIGHT — WARM IVORY FAMILY (5 variants)
  ============================================ */
  {
    id: 'warm-ivory',
    label: 'Warm Ivory',
    emoji: '☀️',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #FAF7F0 0%, #E8E2D2 100%)',
    preview: 'linear-gradient(135deg, #FAF7F0, #E8E2D2)',
  },
  {
    id: 'warm-cream',
    label: 'Warm Cream',
    emoji: '🥛',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #FBF5E8 0%, #EDE3CD 100%)',
    preview: 'linear-gradient(135deg, #FBF5E8, #EDE3CD)',
  },
  {
    id: 'soft-almond',
    label: 'Soft Almond',
    emoji: '🌰',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #F8F2E5 0%, #E9DFC5 100%)',
    preview: 'linear-gradient(135deg, #F8F2E5, #E9DFC5)',
  },
  {
    id: 'pale-sand',
    label: 'Pale Sand',
    emoji: '🏖️',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #F5EFE0 0%, #E4D9B8 100%)',
    preview: 'linear-gradient(135deg, #F5EFE0, #E4D9B8)',
  },
  {
    id: 'ivory-mist',
    label: 'Ivory Mist',
    emoji: '🌫️',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #F7F3EA 0%, #E6DDC9 100%)',
    preview: 'linear-gradient(135deg, #F7F3EA, #E6DDC9)',
  },

  /* ============================================
     DARK — MIDNIGHT NAVY FAMILY (5 variants)
  ============================================ */
  {
    id: 'midnight-navy',
    label: 'Midnight Navy',
    emoji: '🌙',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #0E1626 0%, #1B2742 100%)',
    preview: 'linear-gradient(135deg, #0E1626, #1B2742)',
  },
  {
    id: 'deep-navy',
    label: 'Deep Navy',
    emoji: '🌊',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #0A1220 0%, #15203A 100%)',
    preview: 'linear-gradient(135deg, #0A1220, #15203A)',
  },
  {
    id: 'slate-navy',
    label: 'Slate Navy',
    emoji: '🪨',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #101B2E 0%, #1A2942 100%)',
    preview: 'linear-gradient(135deg, #101B2E, #1A2942)',
  },
  {
    id: 'steel-navy',
    label: 'Steel Navy',
    emoji: '⚙️',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #0C1A28 0%, #172740 100%)',
    preview: 'linear-gradient(135deg, #0C1A28, #172740)',
  },
  {
    id: 'ink-navy',
    label: 'Ink Navy',
    emoji: '🖋️',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #0B1524 0%, #141F38 100%)',
    preview: 'linear-gradient(135deg, #0B1524, #141F38)',
  },
];

const STORAGE_KEY = 'sjcm_theme';

export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'warm-ivory';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && themeOptions.some((t) => t.id === stored)) {
    return stored as ThemeId;
  }
  return 'warm-ivory';
}

export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  const theme = themeOptions.find((t) => t.id === themeId);
  document.documentElement.setAttribute('data-theme', themeId);
  document.documentElement.setAttribute(
    'data-theme-mode',
    theme?.mode ?? 'light'
  );
  window.localStorage.setItem(STORAGE_KEY, themeId);
}

export function getThemeDefinition(id: string): ThemeDefinition {
  return themeOptions.find((t) => t.id === id) ?? themeOptions[0];
}