// src/services/favorites.ts

import { supabase } from '../lib/supabaseClient';

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

/**
 * Fetch lahat ng favorites ng user
 */
export async function fetchFavorites(userId: string): Promise<Favorite[]> {
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
}

/**
 * Add favorite (kung wala pa)
 */
export async function addFavorite(
  userId: string,
  productId: string
): Promise<boolean> {
  // ✅ I-check muna kung existing na
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    // Nasa favorites na — walang gagawin
    return true;
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId });

  if (error) {
    // Ignore duplicate errors (race condition)
    if (error.code === '23505') return true;
    console.error('[Favorites] Failed to add:', error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Remove favorite
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

  return true;
}

/**
 * Toggle favorite (add o remove)
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