// src/services/products.ts

import { supabase } from '../lib/supabaseClient';
import type { Product } from '../types';
import { getCachedData, invalidateCache, setCache } from '../utils/cache';

/**
 * Fetch products — with cache (5 min TTL)
 */
export async function fetchProducts(): Promise<Product[]> {
  return getCachedData(
    'products',
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id');

      if (error) {
        console.error('[Products] Failed to fetch:', error);
        return [];
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        organization: row.organization,
        price: Number(row.price),
        stock: row.stock,
        sizes: row.sizes ?? [],
        sizeStocks: row.size_stocks ?? {},
        image: row.image,
        imageAlt: row.image_alt ?? '',
        description: row.description ?? '',
      }));
    },
    5 * 60 * 1000 // 5 minutes
  );
}

/**
 * Force refresh products (bypass cache)
 */
export async function refreshProducts(): Promise<Product[]> {
  invalidateCache('products');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id');

  if (error) {
    console.error('[Products] Failed to refresh:', error);
    return [];
  }

  const products = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    organization: row.organization,
    price: Number(row.price),
    stock: row.stock,
    sizes: row.sizes ?? [],
    sizeStocks: row.size_stocks ?? {},
    image: row.image,
    imageAlt: row.image_alt ?? '',
    description: row.description ?? '',
  }));

  setCache('products', products, 5 * 60 * 1000);
  return products;
}

/**
 * Update product — invalidate cache
 */
export async function updateProductInDb(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      category: product.category,
      organization: product.organization,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes,
      image: product.image,
      image_alt: product.imageAlt,
      description: product.description,
    })
    .eq('id', product.id);

  if (error) {
    console.error('[Products] Failed to update:', error);
    throw new Error(error.message);
  }

  // ✅ Invalidate cache
  invalidateCache('products');
}

/**
 * Delete product — invalidate cache
 */
export async function deleteProductFromDb(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('[Products] Failed to delete:', error);
    throw new Error(error.message);
  }

  invalidateCache('products');
}