// src/services/admin/adminOrgsService.ts

import type { AdminOrg } from '../../store/adminStore';

/* ============================================
   MOCK DATA
   ============================================ */

let ORGS: AdminOrg[] = [
  { name: 'CITE Department',                                type: 'College',        members: 240, products: 12, revenue: '₱ 42K' },
  { name: 'SHS Student Council',                            type: 'SHS',            members: 120, products: 5,  revenue: '₱ 18K' },
  { name: 'La Liga Historia',                               type: 'Interest-Based', members: 85,  products: 4,  revenue: '₱ 12K' },
  { name: 'MASID',                                          type: 'Interest-Based', members: 60,  products: 3,  revenue: '₱ 8K' },
  { name: 'Nursing Society (BSN)',                          type: 'College',        members: 180, products: 8,  revenue: '₱ 26K' },
  { name: 'Junior Philippine Institution of Accountancy',   type: 'College',        members: 95,  products: 6,  revenue: '₱ 14K' },
];

/* ============================================
   READ
   ============================================ */

export function getOrgs(filter: string = 'all'): AdminOrg[] {
  if (filter === 'all') return [...ORGS];
  if (filter === 'college') return ORGS.filter((o) => o.type === 'College');
  if (filter === 'shs') return ORGS.filter((o) => o.type === 'SHS');
  if (filter === 'interest') return ORGS.filter((o) => o.type === 'Interest-Based');
  return [...ORGS];
}

export function getAllOrgs(): AdminOrg[] {
  return [...ORGS];
}

export function getOrgByName(name: string): AdminOrg | undefined {
  return ORGS.find((o) => o.name === name);
}

/* ============================================
   WRITE
   ============================================ */

export function addOrg(org: AdminOrg): AdminOrg {
  // Prevent duplicate names
  const exists = ORGS.some((o) => o.name.toLowerCase() === org.name.toLowerCase());
  if (exists) {
    throw new Error(`Organization "${org.name}" already exists.`);
  }
  ORGS = [org, ...ORGS];
  return org;
}

export function updateOrg(name: string, updates: Partial<AdminOrg>): AdminOrg | null {
  const idx = ORGS.findIndex((o) => o.name === name);
  if (idx === -1) return null;
  ORGS[idx] = { ...ORGS[idx], ...updates };
  return ORGS[idx];
}

export function deleteOrg(name: string): boolean {
  const before = ORGS.length;
  ORGS = ORGS.filter((o) => o.name !== name);
  return ORGS.length < before;
}

/* ============================================
   HELPERS
   ============================================ */

export function orgInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}