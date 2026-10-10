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
// ✅ CUSTOM ERROR TYPES
// ============================================

export class EmailAlreadyRegisteredError extends Error {
  constructor(message = 'This email is already registered. Please sign in instead.') {
    super(message);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class StudentIdAlreadyRegisteredError extends Error {
  constructor(message = 'This Student ID is already registered. Please sign in instead or contact support.') {
    super(message);
    this.name = 'StudentIdAlreadyRegisteredError';
  }
}

// ============================================
// ✅ REGISTER — with pre-check
// ============================================

/**
 * Creates a new Supabase user.
 * ✅ Pre-checks kung existing na yung email o student ID bago mag-signUp.
 * ✅ Supabase automatically sends a 6-digit OTP to the user's email.
 */
export async function registerUser(payload: RegisterPayload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedStudentId = payload.studentId.trim();

  /* ============================================
     ✅ PRE-CHECK #1: Existing email?
     ============================================ */
  const { data: existingEmail, error: emailCheckError } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (emailCheckError) {
    // Log pero hindi i-block yung registration kung may error sa check
    console.warn('[registerUser] Email pre-check failed:', emailCheckError);
  }

  if (existingEmail) {
    throw new EmailAlreadyRegisteredError();
  }

  /* ============================================
     ✅ PRE-CHECK #2: Existing student ID?
     ============================================ */
  const { data: existingStudentId, error: studentIdCheckError } = await supabase
    .from('profiles')
    .select('id, student_id')
    .eq('student_id', normalizedStudentId)
    .maybeSingle();

  if (studentIdCheckError) {
    console.warn('[registerUser] Student ID pre-check failed:', studentIdCheckError);
  }

  if (existingStudentId) {
    throw new StudentIdAlreadyRegisteredError();
  }

  /* ============================================
     ✅ PROCEED: signUp
     ============================================ */
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: payload.password,
    options: {
      data: {
        name: payload.name.trim(),
        role: 'Student',
        student_id: normalizedStudentId,
      },
    },
  });

  if (error) {
    /* ✅ Handle specific Supabase errors */
    const message = error.message.toLowerCase();

    if (
      message.includes('already registered') ||
      message.includes('already exists') ||
      message.includes('user already registered')
    ) {
      throw new EmailAlreadyRegisteredError();
    }

    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration failed. Please try again.');
  }

  return data;
}

// ============================================
// VERIFY OTP
// ============================================

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

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
  );

  if (error) throw new Error(error.message);
}

// ============================================
// ✅ PASSWORD RESET — STEP 2: Verify reset OTP
// ============================================

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

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
}

// ============================================
// ✅ PASSWORD RESET — Resend reset code
// ============================================

export async function resendPasswordResetEmail(email: string): Promise<void> {
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
