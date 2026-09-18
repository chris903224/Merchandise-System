// src/theme.ts

export type ThemeId =
  | 'forest-green'
  | 'emerald-green'
  | 'dark-green'
  | 'hunter-green'
  | 'sage-green'
  | 'olive-green'
  | 'jade-green'
  | 'pine-green'
  | 'mint-green'
  | 'sea-green';

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  emoji: string;
  gradient: string;
  preview: string;
};

export const themeOptions: ThemeDefinition[] = [
  {
    id: 'forest-green',
    label: 'Forest Green',
    emoji: '🌲',
    gradient: 'linear-gradient(135deg, #176B52 0%, #0F4C3A 100%)',
    preview: 'linear-gradient(135deg, #176B52, #0F4C3A)',
  },
  {
    id: 'emerald-green',
    label: 'Emerald Green',
    emoji: '💎',
    gradient: 'linear-gradient(135deg, #087F5B 0%, #056645 100%)',
    preview: 'linear-gradient(135deg, #087F5B, #056645)',
  },
  {
    id: 'dark-green',
    label: 'Dark Green',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #14532D 0%, #0A3D1F 100%)',
    preview: 'linear-gradient(135deg, #14532D, #0A3D1F)',
  },
  {
    id: 'hunter-green',
    label: 'Hunter Green',
    emoji: '🏹',
    gradient: 'linear-gradient(135deg, #355E3B 0%, #264A2C 100%)',
    preview: 'linear-gradient(135deg, #355E3B, #264A2C)',
  },
  {
    id: 'sage-green',
    label: 'Sage Green',
    emoji: '🍃',
    gradient: 'linear-gradient(135deg, #6B8068 0%, #586B56 100%)',
    preview: 'linear-gradient(135deg, #6B8068, #586B56)',
  },
  {
    id: 'olive-green',
    label: 'Olive Green',
    emoji: '🫒',
    gradient: 'linear-gradient(135deg, #65743A 0%, #4F5C2D 100%)',
    preview: 'linear-gradient(135deg, #65743A, #4F5C2D)',
  },
  {
    id: 'jade-green',
    label: 'Jade Green',
    emoji: '🪷',
    gradient: 'linear-gradient(135deg, #278A68 0%, #1D6E52 100%)',
    preview: 'linear-gradient(135deg, #278A68, #1D6E52)',
  },
  {
    id: 'pine-green',
    label: 'Pine Green',
    emoji: '🌲',
    gradient: 'linear-gradient(135deg, #1F5F4A 0%, #14473A 100%)',
    preview: 'linear-gradient(135deg, #1F5F4A, #14473A)',
  },
  {
    id: 'mint-green',
    label: 'Mint Green',
    emoji: '🌱',
    gradient: 'linear-gradient(135deg, #4CAF83 0%, #3D8E69 100%)',
    preview: 'linear-gradient(135deg, #4CAF83, #3D8E69)',
  },
  {
    id: 'sea-green',
    label: 'Sea Green',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #2E8B72 0%, #24705C 100%)',
    preview: 'linear-gradient(135deg, #2E8B72, #24705C)',
  },
];

const STORAGE_KEY = 'sjcm_theme';

export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'forest-green';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && themeOptions.some((t) => t.id === stored)) {
    return stored as ThemeId;
  }
  return 'forest-green';
}

export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', themeId);
  window.localStorage.setItem(STORAGE_KEY, themeId);
}

export function getThemeDefinition(id: string): ThemeDefinition {
  return themeOptions.find((t) => t.id === id) ?? themeOptions[0];
}