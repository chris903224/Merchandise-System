// src/services/admin/adminActivityService.ts

export interface AdminActivity {
  text: string;
  time: string;
  type?: '' | 'warn' | 'info';
}

/* ============================================
   MOCK DATA
   ============================================ */

const ACTIVITY: AdminActivity[] = [
  { text: 'New order #SJCM-0087 placed by Juan Dela Cruz',                                    time: '2 min ago',  type: '' },
  { text: 'Product "CITE Windbreaker" is now out of stock',                                   time: '18 min ago', type: 'warn' },
  { text: 'Payment #TXN-0450 submitted via GCash — awaiting verification',                    time: '32 min ago', type: 'info' },
  { text: 'Order #SJCM-0084 marked as Completed',                                             time: '1 hr ago',   type: '' },
  { text: 'New organization account: "Nursing Society (BSN)" created',                        time: '3 hrs ago',  type: 'info' },
  { text: 'PayMongo sync completed — 4 new transactions',                                     time: '4 hrs ago',  type: '' },
  { text: 'Weekly sales report generated',                                                    time: '5 hrs ago',  type: '' },
  { text: 'Admin logged in from a new device',                                                time: '6 hrs ago',  type: 'warn' },
];

/* ============================================
   READ
   ============================================ */

export function getActivity(): AdminActivity[] {
  return [...ACTIVITY];
}

export function getActivityByType(type: AdminActivity['type']): AdminActivity[] {
  return ACTIVITY.filter((a) => a.type === type);
}

export function getRecentActivity(limit = 5): AdminActivity[] {
  return ACTIVITY.slice(0, limit);
}