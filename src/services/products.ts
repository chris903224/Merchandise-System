// src/services/products.ts

import { supabase } from '../lib/supabaseClient';
import type { Product } from '../types';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching products:', error);
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
    sizeStocks: row.size_stocks ?? {}, // 👈 ITO ANG KULANG — idinagdag
    image: row.image,
    imageAlt: row.image_alt ?? '',
    description: row.description ?? '',
  }));
}