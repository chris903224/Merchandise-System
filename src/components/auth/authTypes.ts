export type AuthMode = 'login' | 'register';
export type AuthStage = 'register' | 'otp' | 'success';

export interface GuidelineItem {
  id: 'account' | 'security' | 'review' | 'support';
  label: string;
  body: string;
  icon: 'account' | 'security' | 'review' | 'support';
}

export interface MarqueeItem {
  id: 'scrub' | 'uniform' | 'student-life';
  src: string;
  alt: string;
}
