// src/services/favorites.ts

import { supabase } from '../lib/supabaseClient';
import { getCachedData, invalidateCache } from '../utils/cache';

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

/**
 * Fetch favorites — with cache (10 min TTL)
 * ONE fetch for ALL favorites (imbes per-product)
 */
export async function fetchFavorites(userId: string): Promise<Favorite[]> {
  return getCachedData(
    `favorites_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Favorites] Failed to fetch:', error);
        return [];
      }

      return data ?? [];
    },
    10 * 60 * 1000 // 10 minutes
  );
}

/**
 * Add favorite — invalidate cache
 */
export async function addFavorite(
  userId: string,
  productId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) return true;

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId });

  if (error) {
    if (error.code === '23505') return true;
    console.error('[Favorites] Failed to add:', error);
    throw new Error(error.message);
  }

  invalidateCache(`favorites_${userId}`);
  return true;
}

/**
 * Remove favorite — invalidate cache
 */
export async function removeFavorite(
  userId: string,
  productId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    console.error('[Favorites] Failed to remove:', error);
    throw new Error(error.message);
  }

  invalidateCache(`favorites_${userId}`);
  return true;
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(
  userId: string,
  productId: string,
  isCurrentlyFavorite: boolean
): Promise<boolean> {
  if (isCurrentlyFavorite) {
    await removeFavorite(userId, productId);
    return false;
  } else {
    await addFavorite(userId, productId);
    return true;
  }
}