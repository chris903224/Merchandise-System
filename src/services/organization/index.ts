// src/services/organization/index.ts

// 1. I-export ang lahat mula sa ibang services (maliban sa session/order na magka-conflict)
export * from './analyticsService';
export * from './notificationService';
export * from './productService';
export * from './profileService';
export * from './settingService';

// 2. I-export nang tahasan ang OrgSession functions para malaman ng TypeScript kung alin ang gagamitin.
// Gagamitin natin ang galing sa orgSessionService.ts
export {
  saveOrgSession,
  getOrgSession,
  clearOrgSession,
  getOrgAuthHeaders,
  type OrgSession,
} from './orgSessionService';

// 3. I-export ang natitirang logic mula sa orgOrderService (kung meron pa).
// Siguraduhing hindi na i-export muli ang mga session functions doon.
export * from './orgOrderService';