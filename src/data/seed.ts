// src/data/seed.ts

import type { Order, Product, UserRecord } from '../types';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage';
import { createPasswordSalt, hashPassword } from './password';

/** Shared query string so every stock photo is served pre-cropped and compressed. */
const PHOTO_PARAMS = '?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800';

/**
 * Placeholder image URLs — palitan mo na lang ito ng sarili mong images
 * sa /public/products/ kapag ready na.
 */
const PLACEHOLDER_LACE = `https://images.pexels.com/photos/8761297/pexels-photo-8761297.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_POLO = `https://images.pexels.com/photos/11176397/pexels-photo-11176397.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_UNIFORM = `https://images.pexels.com/photos/28576633/pexels-photo-28576633.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_PE = `https://images.pexels.com/photos/16359090/pexels-photo-16359090.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_SHIRT = `https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_SCRUB = `https://images.pexels.com/photos/3768131/pexels-photo-3768131.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_JACKET = `https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg${PHOTO_PARAMS}`;
const PLACEHOLDER_SPORTS = `https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg${PHOTO_PARAMS}`;

export const MOCK_PRODUCTS: Product[] = [
  // ============================================
  // GENERAL
  // ============================================
  {
    id: 'prod-gen-001',
    name: 'SJC ID Lace',
    category: 'General',
    organization: 'Institutional',
    price: 80.0,
    stock: 100,
    sizes: ['N/A'],
    image: PLACEHOLDER_LACE,
    imageAlt: 'Official SJC ID lace',
    description: 'Official Saint Jude College ID lace with safety clip.',
  },
  {
    id: 'prod-gen-002',
    name: 'SJC Foundation Week Shirt',
    category: 'General',
    organization: 'Institutional',
    price: 350.0,
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'SJC Foundation Week shirt',
    description: 'Commemorative Foundation Week shirt.',
  },
  {
    id: 'prod-gen-003',
    name: 'SJC Educational Tour Shirt',
    category: 'General',
    organization: 'Institutional',
    price: 350.0,
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'SJC Educational Tour shirt',
    description: 'Official Educational Tour shirt.',
  },
  {
    id: 'prod-gen-004',
    name: 'CSDL/CSG Uniform',
    category: 'General',
    organization: 'CSDL/CSG',
    price: 500.0,
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'CSDL/CSG uniform polo',
    description: 'Official CSDL/CSG organization uniform.',
  },

  // ============================================
  // COLLEGE
  // ============================================
  {
    id: 'prod-col-001',
    name: 'College General Uniform Set',
    category: 'College',
    organization: 'Institutional',
    price: 1000.0,
    stock: 40,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'College general uniform set',
    description: 'College general uniform set (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-col-002',
    name: 'College Specialized Uniform',
    category: 'College',
    organization: 'Institutional',
    price: 1000.0,
    stock: 40,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'College specialized uniform',
    description: 'College specialized uniform (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-col-003',
    name: 'PE Uniform Set',
    category: 'College',
    organization: 'Athletic Department',
    price: 1000.0,
    stock: 35,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_PE,
    imageAlt: 'College PE uniform set',
    description: 'Official PE uniform set.',
  },

  // ============================================
  // SHS
  // ============================================
  {
    id: 'prod-shs-001',
    name: 'SHS General Uniform Set',
    category: 'SHS',
    organization: 'Institutional',
    price: 1000.0,
    stock: 40,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'SHS general uniform set',
    description: 'SHS general uniform set (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-shs-002',
    name: 'SHS Specialized Uniform Set',
    category: 'SHS',
    organization: 'Institutional',
    price: 1000.0,
    stock: 40,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'SHS specialized uniform set',
    description: 'SHS specialized uniform set (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-shs-003',
    name: 'SHS SC Uniform',
    category: 'SHS',
    organization: 'SHS Student Council',
    price: 500.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'SHS Student Council uniform',
    description: 'SHS Student Council uniform.',
  },
  {
    id: 'prod-shs-004',
    name: 'SHS PE Uniform Top',
    category: 'SHS',
    organization: 'Athletic Department',
    price: 300.0,
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_PE,
    imageAlt: 'SHS PE uniform top',
    description: 'SHS PE uniform top.',
  },

  // ============================================
  // CAS
  // ============================================
  {
    id: 'prod-cas-001',
    name: 'NSTP Uniform',
    category: 'CAS',
    organization: 'NSTP',
    price: 500.0,
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'NSTP uniform',
    description: 'Official NSTP uniform.',
  },

  // ============================================
  // CITE — BSIT
  // ============================================
  {
    id: 'prod-cite-001',
    name: 'CITE Shirt',
    category: 'CITE',
    organization: 'CITE Department',
    price: 350.0,
    stock: 40,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'CITE shirt',
    description: 'Official CITE department shirt.',
  },
  {
    id: 'prod-cite-002',
    name: 'CITE Internship Uniform',
    category: 'CITE',
    organization: 'CITE Department',
    price: 1000.0,
    stock: 20,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'CITE internship uniform',
    description: 'CITE internship uniform.',
  },
  {
    id: 'prod-cite-003',
    name: 'SSITE Org Shirt',
    category: 'CITE',
    organization: 'SSITE',
    price: 350.0,
    stock: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'SSITE org shirt',
    description: 'SSITE organization shirt.',
  },
  {
    id: 'prod-cite-004',
    name: 'SSITE Windbreaker',
    category: 'CITE',
    organization: 'SSITE',
    price: 1000.0,
    stock: 15,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    image: PLACEHOLDER_JACKET,
    imageAlt: 'SSITE windbreaker',
    description: 'SSITE organization windbreaker.',
  },
  {
    id: 'prod-cite-005',
    name: 'CITE ID Lace',
    category: 'CITE',
    organization: 'CITE Department',
    price: 80.0,
    stock: 100,
    sizes: ['N/A'],
    image: PLACEHOLDER_LACE,
    imageAlt: 'CITE ID lace',
    description: 'Official CITE ID lace.',
  },

  // ============================================
  // CITE — BSIS
  // ============================================
  {
    id: 'prod-cis-001',
    name: 'CISE Shirt',
    category: 'CITE',
    organization: 'CISE',
    price: 350.0,
    stock: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'CISE shirt',
    description: 'Official CISE organization shirt.',
  },

  // ============================================
  // COED — BSED
  // ============================================
  {
    id: 'prod-coed-001',
    name: 'BSED Specialized Uniform',
    category: 'COED',
    organization: 'COED',
    price: 1000.0,
    stock: 30,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSED specialized uniform',
    description: 'BSED specialized uniform (Top P500 / Bottom P500).',
  },

  // ============================================
  // CCJE — BSCRIM
  // ============================================
  {
    id: 'prod-ccje-001',
    name: 'BSCRIM Type A Specialized Uniform',
    category: 'CCJE',
    organization: 'CCJE',
    price: 1000.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSCRIM Type A specialized uniform',
    description: 'BSCRIM Type A specialized uniform.',
  },
  {
    id: 'prod-ccje-002',
    name: 'BSCRIM Type B Specialized Uniform',
    category: 'CCJE',
    organization: 'CCJE',
    price: 1000.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSCRIM Type B specialized uniform',
    description: 'BSCRIM Type B specialized uniform.',
  },
  {
    id: 'prod-ccje-003',
    name: 'Criminal Justice SC Uniform',
    category: 'CCJE',
    organization: 'Criminal Justice Student Council',
    price: 500.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'Criminal Justice Student Council uniform',
    description: 'Criminal Justice Student Council uniform.',
  },

  // ============================================
  // CMA — BSTM
  // ============================================
  {
    id: 'prod-cma-001',
    name: 'BSTM Specialized Uniform',
    category: 'CMA',
    organization: 'BSTM',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSTM specialized uniform',
    description: 'BSTM specialized uniform (Top P500 / Bottom P500).',
  },

  // ============================================
  // CMA — BSHM
  // ============================================
  {
    id: 'prod-cma-002',
    name: 'BSHM Specialized Uniform',
    category: 'CMA',
    organization: 'BSHM',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSHM specialized uniform',
    description: 'BSHM specialized uniform (Top P500 / Bottom P500).',
  },

  // ============================================
  // BSA
  // ============================================
  {
    id: 'prod-bsa-001',
    name: 'BSA Specialized Uniform',
    category: 'BSA',
    organization: 'BSA',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSA specialized uniform',
    description: 'BSA specialized uniform (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-bsa-002',
    name: 'Junior Philippine Institution of Accountancy Shirt',
    category: 'BSA',
    organization: 'JPIA',
    price: 350.0,
    stock: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'JPIA shirt',
    description: 'Junior Philippine Institution of Accountancy shirt.',
  },

  // ============================================
  // BSBA
  // ============================================
  {
    id: 'prod-bsba-001',
    name: 'BSBA Specialized Uniform',
    category: 'BSBA',
    organization: 'BSBA',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSBA specialized uniform',
    description: 'BSBA specialized uniform (Top P500 / Bottom P500).',
  },

  // ============================================
  // CAHS — General
  // ============================================
  {
    id: 'prod-cahs-001',
    name: 'CAHS Scrub',
    category: 'CAHS',
    organization: 'CAHS',
    price: 1000.0,
    stock: 30,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SCRUB,
    imageAlt: 'CAHS scrub',
    description: 'CAHS scrub (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-cahs-002',
    name: 'Vanguards Shirt',
    category: 'CAHS',
    organization: 'Vanguards',
    price: 600.0,
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SHIRT,
    imageAlt: 'Vanguards shirt',
    description: 'Vanguards organization shirt.',
  },
  {
    id: 'prod-cahs-003',
    name: 'CAHS Classroom Uniform',
    category: 'CAHS',
    organization: 'CAHS',
    price: 1000.0,
    stock: 30,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'CAHS classroom uniform',
    description: 'CAHS classroom uniform (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-cahs-004',
    name: 'CAHS Clinical Internship Uniform',
    category: 'CAHS',
    organization: 'CAHS',
    price: 1000.0,
    stock: 20,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SCRUB,
    imageAlt: 'CAHS clinical internship uniform',
    description: 'CAHS clinical internship uniform (Top P500 / Bottom P500).',
  },

  // ============================================
  // CAHS — BSN
  // ============================================
  {
    id: 'prod-bsn-001',
    name: 'BSN Specialized Uniform',
    category: 'CAHS',
    organization: 'BSN',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSN specialized uniform',
    description: 'BSN specialized uniform (Top P500 / Bottom P500).',
  },
  {
    id: 'prod-bsn-002',
    name: 'Nursing Type B Uniform',
    category: 'CAHS',
    organization: 'BSN',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'Nursing Type B uniform',
    description: 'Nursing Type B uniform.',
  },
  {
    id: 'prod-bsn-003',
    name: 'Nursing Jersey',
    category: 'CAHS',
    organization: 'BSN',
    price: 700.0,
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_SPORTS,
    imageAlt: 'Nursing jersey',
    description: 'Official Nursing jersey.',
  },

  // ============================================
  // CAHS — BSRT
  // ============================================
  {
    id: 'prod-bsrt-001',
    name: 'BSRT Type B Uniform',
    category: 'CAHS',
    organization: 'BSRT',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'BSRT Type B uniform',
    description: 'BSRT Type B uniform.',
  },

  // ============================================
  // CAHS — BSMT
  // ============================================
  {
    id: 'prod-bsmt-001',
    name: 'MLS Type B Uniform',
    category: 'CAHS',
    organization: 'BSMT',
    price: 1000.0,
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_UNIFORM,
    imageAlt: 'MLS Type B uniform',
    description: 'MLS Type B uniform.',
  },

  // ============================================
  // INTEREST BASED ORGANIZATIONS — La Liga Historia
  // ============================================
  {
    id: 'prod-org-llh-001',
    name: 'La Liga Historia Uniform',
    category: 'Interest Based Organizations',
    organization: 'La Liga Historia',
    price: 500.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'La Liga Historia uniform',
    description: 'La Liga Historia organization uniform.',
  },
  {
    id: 'prod-org-llh-002',
    name: 'La Liga Historia ID Lace',
    category: 'Interest Based Organizations',
    organization: 'La Liga Historia',
    price: 80.0,
    stock: 100,
    sizes: ['N/A'],
    image: PLACEHOLDER_LACE,
    imageAlt: 'La Liga Historia ID lace',
    description: 'La Liga Historia ID lace.',
  },

  // ============================================
  // INTEREST BASED ORGANIZATIONS — MASID
  // ============================================
  {
    id: 'prod-org-masid-001',
    name: 'MASID Uniform',
    category: 'Interest Based Organizations',
    organization: 'MASID',
    price: 500.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'MASID uniform',
    description: 'MASID organization uniform.',
  },
  {
    id: 'prod-org-masid-002',
    name: 'MASID ID Lace',
    category: 'Interest Based Organizations',
    organization: 'MASID',
    price: 80.0,
    stock: 100,
    sizes: ['N/A'],
    image: PLACEHOLDER_LACE,
    imageAlt: 'MASID ID lace',
    description: 'MASID ID lace.',
  },

  // ============================================
  // INTEREST BASED ORGANIZATIONS — Behind The Lens
  // ============================================
  {
    id: 'prod-org-btl-001',
    name: 'Behind The Lens Uniform',
    category: 'Interest Based Organizations',
    organization: 'Behind The Lens',
    price: 350.0,
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    image: PLACEHOLDER_POLO,
    imageAlt: 'Behind The Lens uniform',
    description: 'Behind The Lens organization uniform.',
  },
];

/** Seed accounts are declared with a plaintext password, then hashed before storage. */
type SeedUser = Omit<UserRecord, 'passwordHash' | 'passwordSalt' | 'password'> & {
  password: string;
};

const SEED_USERS: SeedUser[] = [
  {
    id: 'usr-student',
    email: 'student@sjcm.edu.ph',
    password: 'password123',
    name: 'Juan Cruz',
    fullName: 'Juan Cruz',
    idNumber: '2024-00123',
    userCode: '2024-00123',
    role: 'Student',
    organization: 'Computer Society',
  },
  {
    id: 'usr-faculty',
    email: 'faculty@sjcm.edu.ph',
    password: 'password123',
    name: 'Prof. Maria Santos',
    fullName: 'Prof. Maria Santos',
    idNumber: 'FAC-8891',
    userCode: 'FAC-8891',
    role: 'Faculty',
    organization: 'College of Arts and Sciences',
  },
  {
    id: 'usr-staff',
    email: 'staff@sjcm.edu.ph',
    password: 'password123',
    name: 'Elena Reyes',
    fullName: 'Elena Reyes',
    idNumber: 'STF-3011',
    userCode: 'STF-3011',
    role: 'School Staff',
    organization: 'Property & Store Office',
  },
  {
    id: 'usr-admin',
    email: 'admin@sjcm.edu.ph',
    password: 'password123',
    name: 'System Developer / Admin',
    fullName: 'System Developer / Admin',
    idNumber: 'ADM-0001',
    userCode: 'ADM-0001',
    role: 'Admin',
    organization: 'IT Management Services',
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-1001',
    userId: 'usr-student',
    customerName: 'Juan Cruz',
    studentId: '2024-00123',
    email: 'student@sjcm.edu.ph',
    phone: '0917 555 0123',
    items: [
      { id: 'prod-gen-001', name: 'SJC ID Lace', organization: 'Institutional', price: 80.0, qty: 2, size: 'N/A' },
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
      { id: 'prod-cite-001', name: 'CITE Shirt', organization: 'CITE Department', price: 350.0, qty: 1, size: 'L' },
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

async function toUserRecord(seed: SeedUser): Promise<UserRecord> {
  const { password, ...profile } = seed;
  const passwordSalt = createPasswordSalt();
  return {
    ...profile,
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
  };
}

/**
 * Upgrades user records written by earlier builds, which stored the password in
 * plaintext, to salted SHA-256 hashes. Runs once; afterwards there is nothing
 * left to migrate.
 */
async function migrateLegacyPasswords(): Promise<void> {
  const storedUsers = readStorage<UserRecord[]>(STORAGE_KEYS.users, []);
  let migratedAny = false;

  const upgraded = await Promise.all(
    storedUsers.map(async (user) => {
      if (!user.password) return user;
      migratedAny = true;
      const { password, ...profile } = user;
      const passwordSalt = createPasswordSalt();
      return {
        ...profile,
        passwordSalt,
        passwordHash: await hashPassword(password, passwordSalt),
      } satisfies UserRecord;
    }),
  );

  if (migratedAny) {
    writeStorage(STORAGE_KEYS.users, upgraded);
  }
}

export async function ensureSeeded(): Promise<void> {
  if (localStorage.getItem(STORAGE_KEYS.products) === null) {
    writeStorage(STORAGE_KEYS.products, MOCK_PRODUCTS);
  }
  if (localStorage.getItem(STORAGE_KEYS.orders) === null) {
    writeStorage(STORAGE_KEYS.orders, MOCK_ORDERS);
  }

  if (localStorage.getItem(STORAGE_KEYS.users) === null) {
    writeStorage(STORAGE_KEYS.users, await Promise.all(SEED_USERS.map(toUserRecord)));
    return;
  }

  await migrateLegacyPasswords();
}