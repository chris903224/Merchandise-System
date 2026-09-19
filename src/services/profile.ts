// src/services/profile.ts

import { supabase } from '../lib/supabaseClient';

export type UserProfile = {
  user_id: string;
  avatar_url: string | null;
  course_strand: string | null;
  year_level: string | null;
  date_of_birth: string | null;
};

/**
 * Fetch ang buong profile ng user
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Profile] Failed to fetch:', error);
    return null;
  }

  return data;
}

/**
 * Save o update ang profile fields
 */
export async function upsertUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'user_id'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[Profile] Failed to save:', error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Keep existing — para sa avatar
 */
export async function fetchProfileImages(userId: string) {
  const profile = await fetchUserProfile(userId);
  return {
    avatar_url: profile?.avatar_url ?? null,
    course_strand: profile?.course_strand ?? null,
    year_level: profile?.year_level ?? null,
    date_of_birth: profile?.date_of_birth ?? null,
  };
}