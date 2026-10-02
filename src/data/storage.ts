// src/data/storage.ts

import { supabase } from '../lib/supabaseClient';

/* ============================================
   LOCALSTORAGE HELPERS
   ============================================ */

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

/* ============================================
   SUPABASE STORAGE — avatar at cover uploads
   ============================================ */

export type UploadResult = {
  url: string;
  path: string;
};

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

/* ============================================
   FETCH PROFILE IMAGES
   ============================================ */

export async function fetchProfileImages(userId: string): Promise<{
  avatar_url: string | null;
  cover_url: string | null;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, cover_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Storage] Could not fetch profile images:', error.message);
    return { avatar_url: null, cover_url: null };
  }

  return {
    avatar_url: data?.avatar_url ?? null,
    cover_url: data?.cover_url ?? null,
  };
}

/* ============================================
   DELETE AVATAR / COVER
   ============================================ */

export async function deleteAvatar(userId: string): Promise<void> {
  const { data, error } = await supabase.storage.from('avatars').list(userId);

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    const paths = data.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(paths);
  }
}

export async function deleteCover(userId: string): Promise<void> {
  const { data, error } = await supabase.storage.from('covers').list(userId);

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    const paths = data.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('covers').remove(paths);
  }
}

/* ============================================
   PROFILE FIELDS — kasama phone
   ============================================ */

export interface UserProfileData {
  avatar_url: string | null;
  cover_url: string | null;
  course_strand: string | null;
  year_level: string | null;
  date_of_birth: string | null;
  phone: string | null;
}

export async function fetchUserProfile(
  userId: string
): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'avatar_url, cover_url, course_strand, year_level, date_of_birth, phone'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Storage] Failed to fetch user profile:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    avatar_url: data.avatar_url ?? null,
    cover_url: data.cover_url ?? null,
    course_strand: data.course_strand ?? null,
    year_level: data.year_level ?? null,
    date_of_birth: data.date_of_birth ?? null,
    phone: data.phone ?? null,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: {
    course_strand?: string | null;
    year_level?: string | null;
    date_of_birth?: string | null;
    phone?: string | null;
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