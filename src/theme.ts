// src/theme.ts

export type ThemeId =
  | 'cream-yellow'
  | 'warm-beige'
  | 'pure-white'
  | 'soft-gray'
  | 'pale-blush'
  | 'midnight-navy'
  | 'matte-black'
  | 'charcoal-gray'
  | 'deep-forest'
  | 'dark-plum';

export type ThemeMode = 'light' | 'dark';

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  emoji: string;
  mode: ThemeMode;
  gradient: string;
  preview: string;
};

/* ============================================
   🎯 DEFAULT THEME — MIDNIGHT NAVY
   ✅ Bagong user → Midnight Navy agad
   ✅ Naka-list muna ang Midnight Navy
   ============================================ */

export const DEFAULT_THEME: ThemeId = 'midnight-navy';

export const themeOptions: ThemeDefinition[] = [
  /* ============================================
     DARK (5) — Naka-una para default
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
    id: 'matte-black',
    label: 'Matte Black',
    emoji: '🖤',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%)',
    preview: 'linear-gradient(135deg, #0F0F0F, #1A1A1A)',
  },
  {
    id: 'charcoal-gray',
    label: 'Charcoal Gray',
    emoji: '🪨',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
    preview: 'linear-gradient(135deg, #1A1A1A, #2A2A2A)',
  },
  {
    id: 'deep-forest',
    label: 'Deep Forest',
    emoji: '🌲',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #0A1F1A 0%, #153029 100%)',
    preview: 'linear-gradient(135deg, #0A1F1A, #153029)',
  },
  {
    id: 'dark-plum',
    label: 'Dark Plum',
    emoji: '🍇',
    mode: 'dark',
    gradient: 'linear-gradient(135deg, #1A0E1F 0%, #2A1A30 100%)',
    preview: 'linear-gradient(135deg, #1A0E1F, #2A1A30)',
  },

  /* ============================================
     LIGHT (5)
  ============================================ */
  {
    id: 'cream-yellow',
    label: 'Cream Yellow',
    emoji: '☀️',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #FEF9E7 0%, #F5E9C8 100%)',
    preview: 'linear-gradient(135deg, #FEF9E7, #F5E9C8)',
  },
  {
    id: 'warm-beige',
    label: 'Warm Beige',
    emoji: '🍂',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #F5EFE0 0%, #E4D5B7 100%)',
    preview: 'linear-gradient(135deg, #F5EFE0, #E4D5B7)',
  },
  {
    id: 'pure-white',
    label: 'Pure White',
    emoji: '⚪',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E8E8E8 100%)',
    preview: 'linear-gradient(135deg, #FFFFFF, #E8E8E8)',
  },
  {
    id: 'soft-gray',
    label: 'Soft Gray',
    emoji: '🌫️',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 100%)',
    preview: 'linear-gradient(135deg, #F3F4F6, #D1D5DB)',
  },
  {
    id: 'pale-blush',
    label: 'Pale Blush',
    emoji: '🌸',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #FDF2F4 0%, #F0D5DB 100%)',
    preview: 'linear-gradient(135deg, #FDF2F4, #F0D5DB)',
  },
];

const STORAGE_KEY = 'sjcm_theme';

/* ============================================
   ✅ GET STORED THEME
   ✅ Default = Midnight Navy (hindi Cream Yellow)
   ============================================ */
export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const stored = window.localStorage.getItem(STORAGE_KEY);

  // ✅ Valid theme? Return it
  if (stored && themeOptions.some((t) => t.id === stored)) {
    return stored as ThemeId;
  }

  // ✅ Walang valid stored theme → default Midnight Navy
  return DEFAULT_THEME;
}

/* ============================================
   ✅ APPLY THEME
   ✅ Walang change — retain
   ============================================ */
export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;

  const theme = themeOptions.find((t) => t.id === themeId);
  document.documentElement.setAttribute('data-theme', themeId);
  document.documentElement.setAttribute(
    'data-theme-mode',
    theme?.mode ?? 'dark'  // ✅ Fallback = dark
  );
  window.localStorage.setItem(STORAGE_KEY, themeId);
}

/* ============================================
   ✅ GET THEME DEFINITION
   ✅ Fallback = Midnight Navy (hindi Cream Yellow)
   ============================================ */
export function getThemeDefinition(id: string): ThemeDefinition {
  return (
    themeOptions.find((t) => t.id === id) ??
    themeOptions.find((t) => t.id === DEFAULT_THEME) ??
    themeOptions[0]
  );
}