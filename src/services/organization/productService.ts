// src/services/organization/productServices.ts

import { supabase } from '../../lib/supabaseClient';
import type { Product } from '../../types';
import { getCachedData, invalidateCache, setCache } from '../../utils/cache';

/* ============================================
   ✅ FETCH PRODUCTS (Scoped to Organization)
============================================ */
export async function fetchOrgProducts(organization: string): Promise<Product[]> {
  if (!organization) return [];

  const cacheKey = `products_org_${organization}`;

  return getCachedData(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization', organization)
        .order('id');

      if (error) {
        console.error('[OrgProducts] Failed to fetch:', error);
        return [];
      }

      return (data ?? []).map(mapProductRow);
    },
    2 * 60 * 1000 // 2 minutes (pinaikli natin para mas mabilis mag-refresh)
  );
}

/* ============================================
   ✅ REFRESH PRODUCTS (Bypass Cache)
============================================ */
export async function refreshOrgProducts(organization: string): Promise<Product[]> {
  if (!organization) return [];

  const cacheKey = `products_org_${organization}`;
  invalidateCache(cacheKey);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization', organization)
    .order('id');

  if (error) {
    console.error('[OrgProducts] Failed to refresh:', error);
    return [];
  }

  const products = (data ?? []).map(mapProductRow);
  setCache(cacheKey, products, 2 * 60 * 1000);

  // ✅ I-invalidate din ang global cache para mag-update ang Student at Admin
  invalidateCache('products');
  invalidateCache('products_all');

  return products;
}

/* ============================================
   ✅ FETCH SINGLE PRODUCT
============================================ */
export async function fetchOrgProductById(
  productId: string,
  organization: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('organization', organization)
    .maybeSingle();

  if (error) {
    console.error('[OrgProducts] Failed to fetch single:', error);
    return null;
  }

  return data ? mapProductRow(data) : null;
}

/* ============================================
   ✅ UPDATE PRODUCT (With Security Check)
============================================ */
export async function updateOrgProduct(
  product: Product,
  organization: string
): Promise<void> {
  if (!organization) throw new Error('Organization is required');

  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      category: product.category,
      organization: product.organization,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes,
      size_stocks: product.sizeStocks ?? {},
      image: product.image,
      image_alt: product.imageAlt,
      description: product.description,
    })
    .eq('id', product.id);

  if (error) {
    console.error('[OrgProducts] Failed to update:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate lahat ng caches para mag-sync
  invalidateCache('products');
  invalidateCache('products_all');
  invalidateCache(`products_org_${organization}`);
}

/* ============================================
   ✅ DELETE PRODUCT (With Security Check)
============================================ */
export async function deleteOrgProduct(
  productId: string,
  organization: string
): Promise<void> {
  if (!organization) throw new Error('Organization is required');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('[OrgProducts] Failed to delete:', error);
    throw new Error(error.message);
  }

  invalidateCache('products');
  invalidateCache('products_all');
  invalidateCache(`products_org_${organization}`);
}

/* ============================================
   MAPPER
============================================ */
function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    organization: row.organization,
    price: Number(row.price),
    stock: Number(row.stock) ?? 0,
    sizes: row.sizes ?? [],
    sizeStocks: row.size_stocks ?? {},
    image: row.image ?? '',
    imageAlt: row.image_alt ?? '',
    description: row.description ?? '',
  };
}