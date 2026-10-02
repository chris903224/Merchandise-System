// src/services/admin/adminOrgsService.ts

import { supabase } from '../../lib/supabaseClient';
import type { AdminOrg } from '../../store/adminStore';

/* ============================================
   MAPPER — Supabase row → AdminOrg
   ============================================ */

function formatRevenue(amount: number): string {
  if (amount >= 1000000) {
    return `₱ ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₱ ${(amount / 1000).toFixed(0)}K`;
  }
  return `₱ ${amount.toLocaleString()}`;
}

function mapOrgRow(row: any): AdminOrg {
  const revenueNum = Number(row.revenue ?? 0);

  return {
    id: row.id,
    name: row.name,
    type: row.type as AdminOrg['type'],
    members: Number(row.members ?? 0),
    products: Number(row.products ?? 0),
    revenue: formatRevenue(revenueNum),
    revenueRaw: revenueNum,
    description: row.description ?? undefined,
    email: row.email ?? undefined,
    adviser: row.adviser ?? undefined,
    createdAt: row.created_at,
  };
}

/* ============================================
   READ
   ============================================ */

export async function getOrgs(filter: string = 'all'): Promise<AdminOrg[]> {
  let query = supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });

  if (filter === 'college') {
    query = query.eq('type', 'College');
  } else if (filter === 'shs') {
    query = query.eq('type', 'SHS');
  } else if (filter === 'interest') {
    query = query.eq('type', 'Interest-Based');
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Orgs] Failed to fetch:', error);
    return [];
  }

  return (data ?? []).map(mapOrgRow);
}

export async function getAllOrgs(): Promise<AdminOrg[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[Orgs] Failed to fetch all:', error);
    return [];
  }

  return (data ?? []).map(mapOrgRow);
}

export async function getOrgByName(name: string): Promise<AdminOrg | undefined> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (error) {
    console.error('[Orgs] Failed to fetch by name:', error);
    return undefined;
  }

  return data ? mapOrgRow(data) : undefined;
}

/* ============================================
   WRITE
   ============================================ */

export async function addOrg(data: {
  name: string;
  type: AdminOrg['type'];
  members?: number;
  products?: number;
  revenue?: number;
  description?: string;
  email?: string;
  adviser?: string;
}): Promise<AdminOrg> {
  const { data: inserted, error } = await supabase
    .from('organizations')
    .insert([
      {
        name: data.name.trim(),
        type: data.type,
        members: data.members ?? 0,
        products: data.products ?? 0,
        revenue: data.revenue ?? 0,
        description: data.description ?? null,
        email: data.email ?? null,
        adviser: data.adviser ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    // Handle duplicate name
    if (error.code === '23505') {
      throw new Error(`Organization "${data.name}" already exists.`);
    }
    console.error('[Orgs] Failed to add:', error);
    throw new Error(error.message);
  }

  return mapOrgRow(inserted);
}

export async function updateOrg(
  id: string,
  updates: Partial<Omit<AdminOrg, 'id' | 'createdAt'>>
): Promise<AdminOrg | null> {
  // Build update object — convert revenue string → raw number kung kailangan
  const dbUpdates: Record<string, any> = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.members !== undefined) dbUpdates.members = updates.members;
  if (updates.products !== undefined) dbUpdates.products = updates.products;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.adviser !== undefined) dbUpdates.adviser = updates.adviser;

  // Special: revenue handling
  if (updates.revenueRaw !== undefined) {
    dbUpdates.revenue = updates.revenueRaw;
  }

  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('organizations')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Orgs] Failed to update:', error);
    throw new Error(error.message);
  }

  return data ? mapOrgRow(data) : null;
}

export async function deleteOrg(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Orgs] Failed to delete:', error);
    return false;
  }

  return true;
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