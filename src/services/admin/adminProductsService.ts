// src/services/admin/adminProductsService.ts

import type { AdminProduct } from '../../store/adminStore';

/* ============================================
   MOCK DATA
   ============================================ */

const PRODUCT_IMAGES = {
  uniform: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=70',
  shirt:   'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=70',
  lace:    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=70',
  pe:      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=70',
  uniform2:'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&q=70',
  jacket:  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=70',
};

let PRODUCTS: AdminProduct[] = [
  { id: 'prod-pe-001',    name: 'College PE Uniform',   category: 'Uniforms', price: 1000, stock: 35,  stockLabel: '35 in stock',  stockState: 'in-stock',  img: PRODUCT_IMAGES.uniform },
  { id: 'prod-cite-001',  name: 'CITE Shirt',           category: 'Shirts',   price: 350,  stock: 40,  stockLabel: '40 in stock',  stockState: 'in-stock',  img: PRODUCT_IMAGES.shirt },
  { id: 'prod-lace-001',  name: 'SJC ID Lace',          category: 'ID Laces', price: 80,   stock: 8,   stockLabel: '8 left',       stockState: 'low-stock', img: PRODUCT_IMAGES.lace },
  { id: 'prod-shspe-001', name: 'SHS PE Uniform',       category: 'Uniforms', price: 300,  stock: 50,  stockLabel: '50 in stock',  stockState: 'in-stock',  img: PRODUCT_IMAGES.pe },
  { id: 'prod-masid-001', name: 'MASID Uniform',        category: 'Uniforms', price: 500,  stock: 5,   stockLabel: '5 left',       stockState: 'low-stock', img: PRODUCT_IMAGES.uniform2 },
  { id: 'prod-cite-002',  name: 'CITE Windbreaker',     category: 'Shirts',   price: 1000, stock: 0,   stockLabel: 'Out of stock', stockState: 'out',       img: PRODUCT_IMAGES.jacket },
  { id: 'prod-nurse-001', name: 'Nursing Jersey',       category: 'Shirts',   price: 700,  stock: 30,  stockLabel: '30 in stock',  stockState: 'in-stock',  img: PRODUCT_IMAGES.uniform },
  { id: 'prod-liga-001',  name: 'La Liga ID Lace',      category: 'ID Laces', price: 80,   stock: 100, stockLabel: '100 in stock', stockState: 'in-stock',  img: PRODUCT_IMAGES.lace },
];

/* ============================================
   HELPERS
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

/* ============================================
   CRUD
   ============================================ */

export function getProducts(filter: string = 'all'): AdminProduct[] {
  if (filter === 'all') return [...PRODUCTS];
  if (filter === 'uniforms') return PRODUCTS.filter((p) => p.category === 'Uniforms');
  if (filter === 'shirts')   return PRODUCTS.filter((p) => p.category === 'Shirts');
  if (filter === 'laces')    return PRODUCTS.filter((p) => p.category === 'ID Laces');
  if (filter === 'low-stock') return PRODUCTS.filter((p) => p.stockState === 'low-stock' || p.stockState === 'out');
  return [...PRODUCTS];
}

export function getProductById(id: string): AdminProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getAllProducts(): AdminProduct[] {
  return [...PRODUCTS];
}

export function updateProduct(id: string, updates: Partial<AdminProduct>): AdminProduct | null {
  const idx = PRODUCTS.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const next: AdminProduct = { ...PRODUCTS[idx], ...updates };

  // Auto-recompute stock state kung stock binago
  if ('stock' in updates) {
    next.stockState = stockStateFromCount(next.stock);
    next.stockLabel = stockLabelFromCount(next.stock);
  }

  PRODUCTS[idx] = next;
  return next;
}

export function addProduct(data: Omit<AdminProduct, 'id'>): AdminProduct {
  const created: AdminProduct = {
    ...data,
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  PRODUCTS = [created, ...PRODUCTS];
  return created;
}

export function deleteProduct(id: string): boolean {
  const before = PRODUCTS.length;
  PRODUCTS = PRODUCTS.filter((p) => p.id !== id);
  return PRODUCTS.length < before;
}

export function updateStock(id: string, stock: number): AdminProduct | null {
  const safeStock = Math.max(0, stock);
  return updateProduct(id, {
    stock: safeStock,
    stockState: stockStateFromCount(safeStock),
    stockLabel: stockLabelFromCount(safeStock),
  });
}