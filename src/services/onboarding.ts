// src/services/onboarding.ts

import { supabase } from '../lib/supabaseClient';

export type UniformResponse = 'yes' | 'no';

export interface OnboardingRecord {
  id: string;
  user_id: string;
  uniform_response: UniformResponse;
  responded_at: string;
  created_at: string;
}

// 🚨 INTERFACE PARA SA VIEW/FUNCTION
export interface OnboardingViewRecord {
  id: string;
  user_id: string;
  email: string;
  name: string;
  student_id: string;
  course_strand: string;
  year_level: string;
  uniform_response: UniformResponse;
  responded_at: string;
  created_at: string;
}

export async function getOnboardingStatus(
  userId: string
): Promise<OnboardingRecord | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;
  return data as OnboardingRecord | null;
}

export async function saveOnboardingResponse(
  userId: string,
  response: UniformResponse
): Promise<OnboardingRecord | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .upsert(
      { user_id: userId, uniform_response: response, responded_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as OnboardingRecord;
}

export async function hasCompletedOnboarding(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/* ============================================
   ✅ GET ALL ONBOARDING VIA RPC (Para sa Org Admin)
   ============================================ */
export async function getAllOnboardingResponses(): Promise<OnboardingViewRecord[]> {
  console.log('[Onboarding] Fetching via secure RPC...');
  
  // 🚨 Gagamitin natin ang function na ginawa sa Supabase
  const { data, error } = await supabase
    .rpc('get_org_onboarding_view');

  if (error) {
    console.error('[Onboarding] Failed to fetch all responses:', error);
    return [];
  }

  console.log('[Onboarding] Data fetched:', data);
  return (data ?? []) as OnboardingViewRecord[];
}