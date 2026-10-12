// src/store/favoritesStore.ts
// ✅ Global favorites store — shared sa lahat ng pages

import { create } from 'zustand';
import {
  fetchFavorites,
  toggleFavorite as toggleFavService,
  type Favorite,
} from '../services/favorites';

type FavoritesState = {
  favorites: Favorite[];
  favIds: Set<string>;
  isLoading: boolean;
  isInitialized: boolean;
  loadFavorites: (userId: string, force?: boolean) => Promise<void>;
  toggleFavorite: (userId: string, productId: string) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  favIds: new Set(),
  isLoading: false,
  isInitialized: false,

  loadFavorites: async (userId: string, force = false) => {
    if (get().isInitialized && !force) return;

    set({ isLoading: true });
    try {
      const favs = await fetchFavorites(userId);
      set({
        favorites: favs,
        favIds: new Set(favs.map((f) => f.product_id)),
        isLoading: false,
        isInitialized: true,
      });
    } catch (err) {
      console.warn('[FavoritesStore] Failed to load:', err);
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (userId: string, productId: string) => {
    const { favIds } = get();
    const wasFav = favIds.has(productId);

    // ✅ Optimistic update — instant feedback sa user
    set((state) => {
      const next = new Set(state.favIds);
      if (wasFav) next.delete(productId);
      else next.add(productId);
      return { favIds: next };
    });

    try {
      const nowFav = await toggleFavService(userId, productId, wasFav);

      // ✅ Sync favorites array
      set((state) => {
        const nextFavs = nowFav
          ? [
              {
                id: `temp-${Date.now()}`,
                user_id: userId,
                product_id: productId,
                created_at: new Date().toISOString(),
              } as Favorite,
              ...state.favorites,
            ]
          : state.favorites.filter((f) => f.product_id !== productId);

        return { favorites: nextFavs };
      });

      return nowFav;
    } catch (err) {
      // ❌ Rollback kung fail ang API
      set((state) => {
        const next = new Set(state.favIds);
        if (wasFav) next.add(productId);
        else next.delete(productId);
        return { favIds: next };
      });
      throw err;
    }
  },

  isFavorite: (productId: string) => get().favIds.has(productId),

  clearFavorites: () => {
    set({
      favorites: [],
      favIds: new Set(),
      isInitialized: false,
    });
  },
}));