// src/data/storage.ts

import { supabase } from '../lib/supabaseClient';

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

export const STORAGE_KEYS = {
  products: 'products_db',
  users: 'users_db',
  orders: 'orders_db',
  cart: 'cart',
  session: 'session',
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return (value ?? fallback) as T;
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage.`, error);
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// SUPABASE STORAGE — avatar at cover uploads
// ============================================

export type UploadResult = {
  url: string;
  path: string;
};

/**
 * Upload a profile picture (avatar) to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to save avatar URL: ${updateError.message}`);
  }

  return { url: publicUrl, path: filePath };
}

/**
 * Upload a cover photo to Supabase Storage
 */
export async function uploadCover(
  userId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `${userId}/cover-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Failed to upload cover: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('covers')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ cover_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to save cover URL: ${updateError.message}`);
  }

  return { url: publicUrl, path: filePath };
}

/**
 * Fetch avatar and cover URLs from profiles table
 */
export async function fetchProfileImages(userId: string): Promise<{
  avatar_url: string | null;
  cover_url: string | null;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, cover_url')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Could not fetch profile images:', error);
    return { avatar_url: null, cover_url: null };
  }

  return {
    avatar_url: data?.avatar_url ?? null,
    cover_url: data?.cover_url ?? null,
  };
}

/**
 * Delete old avatar files (cleanup — optional)
 */
export async function deleteAvatar(userId: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    const paths = data.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(paths);
  }
}

/**
 * Delete old cover files (cleanup — optional)
 */
export async function deleteCover(userId: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('covers')
    .list(userId);

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    const paths = data.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('covers').remove(paths);
  }
}

// ============================================
// ✅ BAGO — PROFILE FIELDS (course, year, DOB)
// ============================================

/**
 * Fetch buong user profile — avatar, cover, course, year, DOB
 */
export async function fetchUserProfile(userId: string): Promise<{
  avatar_url: string | null;
  cover_url: string | null;
  course_strand: string | null;
  year_level: string | null;
  date_of_birth: string | null;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, cover_url, course_strand, year_level, date_of_birth')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Storage] Failed to fetch user profile:', error);
    return null;
  }

  return {
    avatar_url: data?.avatar_url ?? null,
    cover_url: data?.cover_url ?? null,
    course_strand: data?.course_strand ?? null,
    year_level: data?.year_level ?? null,
    date_of_birth: data?.date_of_birth ?? null,
  };
}

/**
 * Save o update ang profile fields (course, year, DOB)
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    course_strand?: string | null;
    year_level?: string | null;
    date_of_birth?: string | null;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('[Storage] Failed to update profile:', error);
    throw new Error(error.message);
  }

  return true;
}