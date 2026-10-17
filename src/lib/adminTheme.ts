// src/lib/adminTheme.ts
// Two independent settings:
//   style   -> default | clay | glass            (data-admin-theme)
//   palette -> forest | midnight | sand | ocean   (data-admin-palette)

export type AdminTheme = 'default' | 'clay' | 'glass';
export type AdminPalette = 'forest' | 'midnight' | 'sand' | 'ocean';

const STYLE_KEY = 'admin-theme';
const PALETTE_KEY = 'admin-palette';

const root = () => document.documentElement;

export function getAdminTheme(): AdminTheme {
  try {
    const saved = localStorage.getItem(STYLE_KEY);
    if (saved === 'clay' || saved === 'glass') return saved;
  } catch {}
  return 'default';
}

export function getAdminPalette(): AdminPalette {
  try {
    const saved = localStorage.getItem(PALETTE_KEY);
    if (saved === 'midnight' || saved === 'sand' || saved === 'ocean') return saved;
  } catch {}
  return 'forest';
}

/** Starts the slow ripple transition (top-left -> bottom-right). */
function startMorph() {
  document.querySelectorAll<HTMLElement>('.admin-shell *').forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--i', String(Math.min(14, Math.round((r.top + r.left * 0.3) / 90))));
  });
  root().classList.add('admin-morphing');
  window.setTimeout(() => root().classList.remove('admin-morphing'), 3200);
}

/** Style: default / clay / glass. Pass animate:false on first load. */
export function applyAdminTheme(name: AdminTheme, animate = true) {
  if (animate) startMorph();
  root().dataset.adminTheme = name;
  try { localStorage.setItem(STYLE_KEY, name); } catch {}
}

/** Color palette. "forest" is the original look, so it removes the attribute. */
export function applyAdminPalette(name: AdminPalette, animate = true) {
  if (animate) startMorph();
  if (name === 'forest') delete root().dataset.adminPalette;
  else root().dataset.adminPalette = name;
  try { localStorage.setItem(PALETTE_KEY, name); } catch {}
}

/** Restore both saved choices without animation (call once at app start). */
export function restoreAdminAppearance() {
  applyAdminTheme(getAdminTheme(), false);
  applyAdminPalette(getAdminPalette(), false);
}