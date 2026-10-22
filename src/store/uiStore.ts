// src/store/uiStore.ts
import { create } from 'zustand';

type UIState = {
  themeOpen: boolean;
  langOpen: boolean;
  openTheme: () => void;
  closeTheme: () => void;
  openLang: () => void;
  closeLang: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  themeOpen: false,
  langOpen: false,
  openTheme: () => set({ themeOpen: true }),
  closeTheme: () => set({ themeOpen: false }),
  openLang: () => set({ langOpen: true }),
  closeLang: () => set({ langOpen: false }),
}));