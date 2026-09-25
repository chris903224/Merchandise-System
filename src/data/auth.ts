// src/data/auth.ts

import { supabase } from '../lib/supabaseClient';

// ============================================
// TYPES
// ============================================

export type UserRole = 'Student' | 'Staff' | 'Admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  profilePicture?: string;
  emailVerified: boolean;
}

/** Shape returned by Supabase auth — user may be null */
interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface VerifyOtpResult {
  user: SupabaseAuthUser;
  session: unknown;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  studentId: string;
}

// ============================================
// REGISTER
// ============================================

/**
 * Creates a new Supabase user. Supabase automatically sends a
 * 6-digit OTP to the user's email for verification.
 */
export async function registerUser(payload: RegisterPayload) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      data: {
        name: payload.name.trim(),
        role: 'Student',
        student_id: payload.studentId.trim(),
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registration failed. Please try again.');

  return data;
}

// ============================================
// VERIFY OTP
// ============================================

/**
 * Verifies the 6-digit OTP from the registration email.
 * On success, Supabase creates a session automatically.
 */
export async function verifyOtp(
  email: string,
  token: string,
): Promise<VerifyOtpResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'signup',
  });

  if (error) throw new Error(error.message);
  if (!data.user || !data.session) {
    throw new Error('Verification failed. Please try again.');
  }

  return {
    user: data.user,
    session: data.session,
  };
}

// ============================================
// RESEND OTP
// ============================================

export async function resendOtp(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });

  if (error) throw new Error(error.message);
}

// ============================================
// LOGIN
// ============================================

export async function loginUser(
  email: string,
  password: string,
): Promise<VerifyOtpResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user || !data.session) {
    throw new Error('Login failed. Please try again.');
  }

  return {
    user: data.user,
    session: data.session,
  };
}

// ============================================
// LOGOUT
// ============================================

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ============================================
// GET CURRENT SESSION
// ============================================

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

// ============================================
// ✅ PASSWORD RESET — STEP 1: Send reset code
// ============================================

/**
 * Sends a 6-digit password reset OTP to the user's email.
 * Uses Supabase's built-in "recovery" flow.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
  );

  if (error) throw new Error(error.message);
}

// ============================================
// ✅ PASSWORD RESET — STEP 2: Verify reset OTP
// ============================================

/**
 * Verifies the 6-digit reset OTP.
 * On success, Supabase creates a temporary session which allows
 * the user to update their password in step 3.
 */
export async function verifyPasswordResetOtp(
  email: string,
  token: string,
): Promise<VerifyOtpResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'recovery',
  });

  if (error) throw new Error(error.message);
  if (!data.user) {
    throw new Error('Reset code is invalid or expired.');
  }

  return {
    user: data.user,
    session: data.session,
  };
}

// ============================================
// ✅ PASSWORD RESET — STEP 3: Update password
// ============================================

/**
 * Updates the currently-authenticated user's password.
 * Must be called right after verifyPasswordResetOtp() while
 * the temporary recovery session is still active.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
}

// ============================================
// ✅ PASSWORD RESET — Resend reset code
// ============================================

/**
 * Resends a password reset OTP to the given email.
 * Supabase's `resend` doesn't support `type: 'recovery'`,
 * so we re-call `resetPasswordForEmail`.
 */
export async function resendPasswordResetEmail(email: string): Promise<void> {
  // Same as the initial send — Supabase allows re-sending
  await sendPasswordResetEmail(email);
}

// ============================================
// MAP SUPABASE USER → APP USER
// ============================================

export function mapSupabaseUser(user: SupabaseAuthUser): AuthUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: (meta.name as string) || 'New User',
    email: user.email || '',
    role: ((meta.role as string) || 'Student') as UserRole,
    studentId: meta.student_id as string | undefined,
    profilePicture: meta.profile_picture as string | undefined,
    emailVerified: true,
  };
}