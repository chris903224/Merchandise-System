// src/components/auth/authTypes.ts

export type AuthMode = 'login' | 'register';
export type AuthStage = 'register' | 'otp' | 'success';

export interface GuidelineItem {
  id: 'account' | 'security' | 'review' | 'pickup' | 'updates' | 'support';
  label: string;
  body: string;
  icon: 'account' | 'security' | 'review' | 'pickup' | 'updates' | 'support';
}

export interface MarqueeItem {
  id: 'scrub' | 'uniform' | 'student-life';
  src: string;
  alt: string;
}