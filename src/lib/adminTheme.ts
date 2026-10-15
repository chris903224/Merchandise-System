export type AdminTheme = 'default' | 'clay' | 'glass';

const KEY = 'admin-theme';

export function getAdminTheme(): AdminTheme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'clay' || saved === 'glass') return saved;
  } catch {}
  return 'default';
}

/** Apply a theme. Pass animate:false on first load to skip the morph. */
export function applyAdminTheme(name: AdminTheme, animate = true) {
  const root = document.documentElement;

  if (animate) {
    document.querySelectorAll<HTMLElement>('.admin-shell *').forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--i', String(Math.min(14, Math.round((r.top + r.left * 0.3) / 90))));
    });
    root.classList.add('admin-morphing');
    window.setTimeout(() => root.classList.remove('admin-morphing'), 3200);
  }

  root.dataset.adminTheme = name;
  try { localStorage.setItem(KEY, name); } catch {}
}