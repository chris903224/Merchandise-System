// src/services/admin/adminProductsService.ts

import {
  fetchProducts,
  updateProductInDb,
  deleteProductFromDb,
  refreshProducts,
} from '../products';
import type { Product } from '../../types';
import type { AdminProduct } from '../../store/adminStore';

/* ============================================
   HELPERS — Convert Product → AdminProduct
   ============================================ */

export function stockStateFromCount(stock: number): AdminProduct['stockState'] {
  if (stock <= 0) return 'out';
  if (stock <= 10) return 'low-stock';
  return 'in-stock';
}

export function stockLabelFromCount(stock: number): string {
  if (stock === 0) return 'Out of stock';
  if (stock <= 10) return `${stock} left`;
  return `${stock} in stock`;
}

function mapProductToAdmin(p: Product): AdminProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    stock: p.stock,
    stockState: stockStateFromCount(p.stock),
    stockLabel: stockLabelFromCount(p.stock),
    img: p.image,
  };
}

/* ============================================
   READ — Real Supabase (with client-side filter)
   ============================================ */

export async function getProducts(filter: string = 'all'): Promise<AdminProduct[]> {
  const products = await fetchProducts();
  const mapped = products.map(mapProductToAdmin);

  if (filter === 'all') return mapped;
  if (filter === 'uniforms') return mapped.filter((p) => p.category === 'Uniforms');
  if (filter === 'shirts')   return mapped.filter((p) => p.category === 'Shirts');
  if (filter === 'laces')    return mapped.filter((p) => p.category === 'ID Laces');
  if (filter === 'low-stock') return mapped.filter((p) => p.stockState === 'low-stock' || p.stockState === 'out');

  return mapped;
}

export async function getAllProducts(): Promise<AdminProduct[]> {
  const products = await fetchProducts();
  return products.map(mapProductToAdmin);
}

/* ============================================
   WRITE — Real Supabase
   ============================================ */

export async function updateProduct(
  id: string,
  updates: Partial<AdminProduct>
): Promise<void> {
  // Get full product para hindi ma-overwrite yung ibang fields
  const all = await fetchProducts();
  const existing = all.find((p) => p.id === id);
  if (!existing) throw new Error(`Product ${id} not found.`);

  // Merge updates
  const merged: Product = {
    ...existing,
    name: updates.name ?? existing.name,
    category: updates.category ?? existing.category,
    price: updates.price ?? existing.price,
    stock: updates.stock ?? existing.stock,
    image: updates.img ?? existing.image,
  };

  await updateProductInDb(merged);
}

export async function addProduct(
  data: Omit<AdminProduct, 'id' | 'stockState' | 'stockLabel'>
): Promise<void> {
  const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const product: Product = {
    id,
    name: data.name,
    category: data.category,
    organization: 'Institutional',
    price: data.price,
    stock: data.stock,
    sizes: [],
    sizeStocks: {},
    image: data.img,
    imageAlt: data.name,
    description: '',
  };

  // Use supabase directly for insert (walang insertProductInDb sa existing products.ts)
  const { error } = await (await import('../../lib/supabaseClient')).supabase
    .from('products')
    .insert([{
      id: product.id,
      name: product.name,
      category: product.category,
      organization: product.organization,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes,
      size_stocks: product.sizeStocks,
      image: product.image,
      image_alt: product.imageAlt,
      description: product.description,
    }]);

  if (error) throw new Error(error.message);

  // Invalidate cache
  const { invalidateCache } = await import('../../utils/cache');
  invalidateCache('products');
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteProductFromDb(id);
}

export async function updateStock(id: string, stock: number): Promise<void> {
  const safeStock = Math.max(0, stock);
  await updateProduct(id, { stock: safeStock });
}

/* ============================================
   FORCE REFRESH
   ============================================ */

export async function forceRefreshProducts(): Promise<AdminProduct[]> {
  const products = await refreshProducts();
  return products.map(mapProductToAdmin);
}