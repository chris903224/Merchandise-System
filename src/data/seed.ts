import type { Order, Product, UserRecord } from '../types';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage';
import { createPasswordSalt, hashPassword } from './password';

/** Shared query string so every stock photo is served pre-cropped and compressed. */
const PHOTO_PARAMS = '?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Official SJCM Lanyard / ID Lace',
    category: 'ID Lace',
    organization: 'Supreme Student Council',
    price: 85.0,
    stock: 45,
    sizes: ['N/A'],
    image: `https://images.pexels.com/photos/8761297/pexels-photo-8761297.jpeg${PHOTO_PARAMS}`,
    imageAlt: 'Close-up of blue ID lanyards hanging in a row, photo by Pavel Danilyuk on Pexels',
    description: 'Official Saint Jude Catholic School lanyard with safety clip and heavy-duty swivel hook.',
  },
  {
    id: 'prod-002',
    name: 'College Department Org Polo Shirt',
    category: 'Org Uniform',
    organization: 'Computer Society',
    price: 450.0,
    stock: 8,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    image: `https://images.pexels.com/photos/11176397/pexels-photo-11176397.jpeg${PHOTO_PARAMS}`,
    imageAlt: 'Neatly stacked folded polo shirts, photo by onkar salvi on Pexels',
    description: 'Dri-fit breathable organization polo shirt with high-density embroidered emblem.',
  },
  {
    id: 'prod-003',
    name: 'SJCM Standard School Uniform Set',
    category: 'School Uniform',
    organization: 'Institutional',
    price: 750.0,
    stock: 0,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: `https://images.pexels.com/photos/28576633/pexels-photo-28576633.jpeg${PHOTO_PARAMS}`,
    imageAlt: 'Neatly pressed white school uniform shirt on a hanger, photo by Jonathan Borba on Pexels',
    description: 'Standard campus uniform tailored from durable cotton blend fabric.',
  },
  {
    id: 'prod-004',
    name: 'College Athletic PE Shirt & Joggers',
    category: 'School Uniform',
    organization: 'Athletic Department',
    price: 620.0,
    stock: 22,
    sizes: ['S', 'M', 'L', 'XL'],
    image: `https://images.pexels.com/photos/16359090/pexels-photo-16359090.jpeg${PHOTO_PARAMS}`,
    imageAlt: 'Student wearing an athletic t-shirt and grey jogger pants, photo by TYTO Sport100 on Pexels',
    description: 'Official physical education uniform shirt with matching elastic fleece joggers.',
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
      { id: 'prod-001', name: 'Official SJCM Lanyard / ID Lace', organization: 'Supreme Student Council', price: 85.0, qty: 2, size: 'N/A' },
    ],
    totalAmount: 170.0,
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
      { id: 'prod-002', name: 'College Department Org Polo Shirt', organization: 'Computer Society', price: 450.0, qty: 1, size: 'L' },
    ],
    totalAmount: 450.0,
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
