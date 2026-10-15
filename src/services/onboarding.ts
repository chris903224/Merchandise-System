// src/services/onboarding.ts

import { supabase } from '../lib/supabaseClient';

/* ============================================
   ✅ TYPES — yes/no ONLY
============================================ */
export type UniformResponse = 'yes' | 'no';

export interface OnboardingRecord {
  id: string;
  user_id: string;
  uniform_response: UniformResponse;
  responded_at: string;
  created_at: string;
}

/* ============================================
   ✅ GET ONBOARDING STATUS
============================================ */
export async function getOnboardingStatus(
  userId: string
): Promise<OnboardingRecord | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Onboarding] Failed to fetch status:', error);
    return null;
  }

  return data as OnboardingRecord | null;
}

/* ============================================
   ✅ SAVE ONBOARDING RESPONSE — yes OR no lang
============================================ */
export async function saveOnboardingResponse(
  userId: string,
  response: UniformResponse
): Promise<OnboardingRecord | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .upsert(
      {
        user_id: userId,
        uniform_response: response,
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[Onboarding] Failed to save response:', error);
    throw new Error(error.message);
  }

  return data as OnboardingRecord;
}

/* ============================================
   ✅ CHECK KUNG MAY RECORD NA
============================================ */
export async function hasCompletedOnboarding(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Onboarding] Check failed:', error);
    return false;
  }

  return !!data;
}