// src/data/seed.ts

import type { Order, Product } from '../types';
import { STORAGE_KEYS, writeStorage } from './storage';

const SEED_VERSION = 'v6-dynamic-images';
const SEED_VERSION_KEY = 'sjcm_seed_version';

/* ============================================================
   ✅ DYNAMIC IMAGE RESOLVER
============================================================ */

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const resolveImage = (productName: string): string => {
  const slug = slugify(productName);
  return `/product-pictures/${slug}.jpg`;
};

const createProduct = (
  id: string,
  name: string,
  category: string,
  organization: string,
  price: number,
  stock: number,
  sizes: string[],
  description: string,
  customImage?: string
): Product => ({
  id,
  name,
  category,
  organization,
  price,
  stock,
  sizes,
  image: customImage ?? resolveImage(name),
  imageAlt: name,
  description,
});

/* ============================================================
   PRODUCTS
============================================================ */

export const MOCK_PRODUCTS: Product[] = [
  createProduct('prod-gen-001', 'SJC ID Lace', 'General', 'Institutional', 80, 100, ['N/A'], 'Official Saint Jude College ID lace with safety clip.'),
  createProduct('prod-gen-002', 'SJC Foundation Week Shirt', 'General', 'Institutional', 350, 50, ['S', 'M', 'L', 'XL', '2XL'], 'Commemorative Foundation Week shirt.'),
  createProduct('prod-gen-003', 'SJC Educational Tour Shirt', 'General', 'Institutional', 350, 50, ['S', 'M', 'L', 'XL', '2XL'], 'Official Educational Tour shirt.'),
  createProduct('prod-gen-004', 'CSDL/CSG Uniform', 'General', 'CSDL/CSG', 500, 30, ['S', 'M', 'L', 'XL'], 'Official CSDL/CSG organization uniform.'),
  
  createProduct('prod-col-001', 'College General Uniform Set', 'College', 'Institutional', 1000, 40, ['XS', 'S', 'M', 'L', 'XL', '2XL'], 'College general uniform set (Top P500 / Bottom P500).'),
  createProduct('prod-col-002', 'College Specialized Uniform', 'College', 'Institutional', 1000, 40, ['XS', 'S', 'M', 'L', 'XL', '2XL'], 'College specialized uniform (Top P500 / Bottom P500).'),
  createProduct('prod-col-003', 'PE Uniform Set', 'College', 'Athletic Department', 1000, 35, ['S', 'M', 'L', 'XL', '2XL'], 'Official PE uniform set.'),
  
  createProduct('prod-shs-001', 'SHS General Uniform Set', 'SHS', 'Institutional', 1000, 40, ['XS', 'S', 'M', 'L', 'XL'], 'SHS general uniform set (Top P500 / Bottom P500).'),
  createProduct('prod-shs-002', 'SHS Specialized Uniform Set', 'SHS', 'Institutional', 1000, 40, ['XS', 'S', 'M', 'L', 'XL'], 'SHS specialized uniform set (Top P500 / Bottom P500).'),
  createProduct('prod-shs-003', 'SHS SC Uniform', 'SHS', 'SHS Student Council', 500, 25, ['S', 'M', 'L', 'XL'], 'SHS Student Council uniform.'),
  createProduct('prod-shs-004', 'SHS PE Uniform Top', 'SHS', 'Athletic Department', 300, 50, ['S', 'M', 'L', 'XL'], 'SHS PE uniform top.'),
  
  createProduct('prod-cas-001', 'NSTP Uniform', 'CAS', 'NSTP', 500, 30, ['S', 'M', 'L', 'XL'], 'Official NSTP uniform.'),
  
  createProduct('prod-cite-001', 'CITE Shirt', 'CITE', 'CITE Department', 350, 40, ['S', 'M', 'L', 'XL', '2XL'], 'Official CITE department shirt.'),
  createProduct('prod-cite-002', 'CITE Internship Uniform', 'CITE', 'CITE Department', 1000, 20, ['S', 'M', 'L', 'XL'], 'CITE internship uniform.'),
  createProduct('prod-cite-003', 'SSITE Org Shirt', 'CITE', 'SSITE', 350, 40, ['S', 'M', 'L', 'XL'], 'SSITE organization shirt.'),
  createProduct('prod-cite-004', 'SSITE Windbreaker', 'CITE', 'SSITE', 1000, 15, ['S', 'M', 'L', 'XL', '2XL'], 'SSITE organization windbreaker.'),
  createProduct('prod-cite-005', 'CITE ID Lace', 'CITE', 'CITE Department', 80, 100, ['N/A'], 'Official CITE ID lace.'),
  createProduct('prod-cis-001', 'CISE Shirt', 'CITE', 'CISE', 350, 40, ['S', 'M', 'L', 'XL'], 'Official CISE organization shirt.'),
  
  createProduct('prod-coed-001', 'BSED Specialized Uniform', 'COED', 'COED', 1000, 30, ['XS', 'S', 'M', 'L', 'XL'], 'BSED specialized uniform (Top P500 / Bottom P500).'),
  
  createProduct('prod-ccje-001', 'BSCRIM Type A Specialized Uniform', 'CCJE', 'CCJE', 1000, 25, ['S', 'M', 'L', 'XL'], 'BSCRIM Type A specialized uniform.'),
  createProduct('prod-ccje-002', 'BSCRIM Type B Specialized Uniform', 'CCJE', 'CCJE', 1000, 25, ['S', 'M', 'L', 'XL'], 'BSCRIM Type B specialized uniform.'),
  createProduct('prod-ccje-003', 'Criminal Justice SC Uniform', 'CCJE', 'Criminal Justice Student Council', 500, 25, ['S', 'M', 'L', 'XL'], 'Criminal Justice Student Council uniform.'),
  
  createProduct('prod-cma-001', 'BSTM Specialized Uniform', 'CMA', 'BSTM', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'BSTM specialized uniform (Top P500 / Bottom P500).'),
  createProduct('prod-cma-002', 'BSHM Specialized Uniform', 'CMA', 'BSHM', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'BSHM specialized uniform (Top P500 / Bottom P500).'),
  
  createProduct('prod-bsa-001', 'BSA Specialized Uniform', 'BSA', 'BSA', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'BSA specialized uniform (Top P500 / Bottom P500).'),
  createProduct('prod-bsa-002', 'Junior Philippine Institution of Accountancy Shirt', 'BSA', 'JPIA', 350, 40, ['S', 'M', 'L', 'XL'], 'Junior Philippine Institution of Accountancy shirt.'),
  
  createProduct('prod-bsba-001', 'BSBA Specialized Uniform', 'BSBA', 'BSBA', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'BSBA specialized uniform (Top P500 / Bottom P500).'),
  
  createProduct('prod-cahs-001', 'CAHS Scrub', 'CAHS', 'CAHS', 1000, 30, ['XS', 'S', 'M', 'L', 'XL'], 'CAHS scrub (Top P500 / Bottom P500).'),
  createProduct('prod-cahs-002', 'Vanguards Shirt', 'CAHS', 'Vanguards', 600, 30, ['S', 'M', 'L', 'XL'], 'Vanguards organization shirt.'),
  createProduct('prod-cahs-003', 'CAHS Classroom Uniform', 'CAHS', 'CAHS', 1000, 30, ['XS', 'S', 'M', 'L', 'XL'], 'CAHS classroom uniform (Top P500 / Bottom P500).'),
  createProduct('prod-cahs-004', 'CAHS Clinical Internship Uniform', 'CAHS', 'CAHS', 1000, 20, ['XS', 'S', 'M', 'L', 'XL'], 'CAHS clinical internship uniform (Top P500 / Bottom P500).'),
  createProduct('prod-bsn-001', 'BSN Specialized Uniform', 'CAHS', 'BSN', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'BSN specialized uniform (Top P500 / Bottom P500).'),
  createProduct('prod-bsn-002', 'Nursing Type B Uniform', 'CAHS', 'BSN', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'Nursing Type B uniform.'),
  createProduct('prod-bsn-003', 'Nursing Jersey', 'CAHS', 'BSN', 700, 30, ['S', 'M', 'L', 'XL'], 'Official Nursing jersey.'),
  createProduct('prod-bsrt-001', 'BSRT Type B Uniform', 'CAHS', 'BSRT', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'BSRT Type B uniform.'),
  createProduct('prod-bsmt-001', 'MLS Type B Uniform', 'CAHS', 'BSMT', 1000, 25, ['XS', 'S', 'M', 'L', 'XL'], 'MLS Type B uniform.'),
  
  createProduct('prod-org-llh-001', 'La Liga Historia Uniform', 'Interest Based Organizations', 'La Liga Historia', 500, 25, ['S', 'M', 'L', 'XL'], 'La Liga Historia organization uniform.'),
  createProduct('prod-org-llh-002', 'La Liga Historia ID Lace', 'Interest Based Organizations', 'La Liga Historia', 80, 100, ['N/A'], 'La Liga Historia ID lace.'),
  createProduct('prod-org-masid-001', 'MASID Uniform', 'Interest Based Organizations', 'MASID', 500, 25, ['S', 'M', 'L', 'XL'], 'MASID organization uniform.'),
  createProduct('prod-org-masid-002', 'MASID ID Lace', 'Interest Based Organizations', 'MASID', 80, 100, ['N/A'], 'MASID ID lace.'),
  createProduct('prod-org-btl-001', 'Behind The Lens Uniform', 'Interest Based Organizations', 'Behind The Lens', 350, 25, ['S', 'M', 'L', 'XL'], 'Behind The Lens organization uniform.'),
];

/* ============================================================
   SEED ORDERS
============================================================ */

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-1001',
    userId: 'usr-student',
    customerName: 'Juan Cruz',
    studentId: '2024-00123',
    email: 'student@sjcm.edu.ph',
    phone: '0917 555 0123',
    items: [
      {
        id: 'prod-gen-001',
        name: 'SJC ID Lace',
        organization: 'Institutional',
        price: 80.0,
        qty: 2,
        size: 'N/A',
      },
    ],
    totalAmount: 160.0,
    paymentMethod: 'Over the Counter (Cash)',
    paymentRef: null,
    paymentStatus: 'Unpaid (OTC)',
    orderStatus: 'Pending',
    claimLocation: 'SJCM Supply Office (Main Campus)',
    claimDate: '2026-08-14',
    createdAt: '2026-08-13T08:30:00.000Z',
  },
  {
    id: 'ORD-2026-0988',
    userId: 'usr-student',
    customerName: 'Juan Cruz',
    studentId: '2024-00123',
    email: 'student@sjcm.edu.ph',
    phone: '0917 555 0123',
    items: [
      {
        id: 'prod-cite-001',
        name: 'CITE Shirt',
        organization: 'CITE Department',
        price: 350.0,
        qty: 1,
        size: 'L',
      },
    ],
    totalAmount: 350.0,
    paymentMethod: 'GCash / E-Wallet',
    paymentRef: '1002938481',
    paymentStatus: 'Verification Pending',
    orderStatus: 'Ready for Pickup',
    claimLocation: 'School Cashier Counter B',
    claimDate: '2026-08-13',
    createdAt: '2026-08-12T14:15:00.000Z',
  },
];

/* ============================================================
   SEEDING LOGIC
============================================================ */

export async function ensureSeeded(): Promise<void> {
  const currentVersion = localStorage.getItem(SEED_VERSION_KEY);
  const isNewVersion = currentVersion !== SEED_VERSION;

  // Products
  if (localStorage.getItem(STORAGE_KEYS.products) === null || isNewVersion) {
    writeStorage(STORAGE_KEYS.products, MOCK_PRODUCTS);
  }
  
  // Orders
  if (localStorage.getItem(STORAGE_KEYS.orders) === null) {
    writeStorage(STORAGE_KEYS.orders, MOCK_ORDERS);
  }

  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
}