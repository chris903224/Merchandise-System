import type { BadgeInfo, CartItem, Order, Product, SessionUser, UserRecord, UserRole } from './types';
import { STORAGE_KEYS, readStorage, writeStorage } from './data/storage';
import { createPasswordSalt, hashPassword, verifyPassword } from './data/password';

/* ---- Formatting ---- */

const PH_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

export function formatPrice(amount: number | string | undefined): string {
  return PH_FORMATTER.format(Number(amount) || 0);
}

export function formatDate(value: string | undefined): string {
  const date = new Date(value ?? '');
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/* ---- Order accessors (mirrors original getOrder*) ---- */

export function getOrderId(order: Order | undefined): string {
  return order?.id ?? '—';
}

export function getOrderStatus(order: Order | undefined): string {
  return order?.orderStatus ?? 'Pending';
}

export function getOrderTotal(order: Order | undefined): number {
  return Number(order?.totalAmount ?? 0);
}

export function getOrderDate(order: Order | undefined): string {
  return order?.createdAt ?? '';
}

export function getOrderCustomerName(order: Order | undefined): string {
  return order?.customerName ?? '—';
}

export function getOrderEmail(order: Order | undefined): string {
  return order?.email ?? '—';
}

export function getOrderStudentId(order: Order | undefined): string {
  return order?.studentId ?? '—';
}

export function getOrderClaimDate(order: Order | undefined): string {
  return order?.claimDate ?? '';
}

/* ---- Badges ---- */

export function getStockBadge(stockCount: number | string | undefined): BadgeInfo {
  const stock = Number(stockCount) || 0;
  if (stock <= 0) {
    return { text: 'Out of Stock', className: 'status-chip status-chip--danger' };
  }
  if (stock <= 10) {
    return { text: `Low Stock (${stock})`, className: 'status-chip status-chip--warning' };
  }
  return { text: 'In Stock', className: 'status-chip status-chip--success' };
}

export function getOrderStatusBadge(status: string | undefined): BadgeInfo {
  const normalizedStatus = String(status || 'Pending');
  switch (normalizedStatus.toLowerCase()) {
    case 'pending':
      return { text: 'Pending', className: 'status-chip status-chip--warning' };
    case 'processing':
      return { text: 'Processing', className: 'status-chip status-chip--info' };
    case 'ready for pickup':
      return { text: 'Ready for Pickup', className: 'status-chip status-chip--info' };
    case 'claimed':
    case 'completed':
      return { text: normalizedStatus, className: 'status-chip status-chip--success' };
    case 'cancelled':
      return { text: 'Cancelled', className: 'status-chip status-chip--danger' };
    default:
      return { text: normalizedStatus, className: 'status-chip status-chip--neutral' };
  }
}

/* ---- Auth ---- */

function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    name: user.name || user.fullName || 'User',
    email: user.email || '',
    role: user.role,
    organization: user.organization || 'SJCM General',
    idNumber: user.idNumber || user.userCode || user.id || '',
  };
}

export interface AuthResult {
  success: boolean;
  user: SessionUser | null;
  message: string;
}

export async function loginUser(
  email: string,
  password: string,
  role: string,
): Promise<AuthResult> {
  const users = readStorage<UserRecord[]>(STORAGE_KEYS.users, []);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = users.find(
    (candidate) => String(candidate.email || '').toLowerCase() === normalizedEmail,
  );

  const passwordMatches =
    user !== undefined &&
    (await verifyPassword(password, user.passwordSalt, user.passwordHash));

  if (!user || !passwordMatches) {
    return { success: false, user: null, message: 'Invalid email or password.' };
  }

  if (role && user.role !== role) {
    return { success: false, user: null, message: 'That account does not use the selected role.' };
  }

  return { success: true, user: toSessionUser(user), message: 'Signed in successfully.' };
}

export interface RegisterInput {
  name: string;
  email: string;
  role: UserRole;
  idNumber: string;
  organization: string;
  password: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const users = readStorage<UserRecord[]>(STORAGE_KEYS.users, []);
  const email = String(input.email || '').trim();
  const alreadyRegistered = users.some(
    (user) => String(user.email || '').toLowerCase() === email.toLowerCase(),
  );

  if (alreadyRegistered) {
    return { success: false, user: null, message: 'An account with this email already exists.' };
  }

  const name = String(input.name || '').trim();
  const idNumber = String(input.idNumber || '').trim();
  const passwordSalt = createPasswordSalt();

  const newUser: UserRecord = {
    id: `USR-${Date.now().toString().slice(-6)}`,
    name,
    fullName: name,
    email,
    role: input.role || 'Student',
    organization: input.organization || 'SJCM General',
    idNumber,
    userCode: idNumber,
    passwordSalt,
    passwordHash: await hashPassword(input.password || '', passwordSalt),
  };

  writeStorage(STORAGE_KEYS.users, [...users, newUser]);

  return { success: true, user: toSessionUser(newUser), message: 'Registration successful.' };
}

export function isStaffRole(role: string | undefined): boolean {
  return role === 'Admin' || role === 'School Staff';
}

export function getConsolePath(role: string | undefined): string {
  return isStaffRole(role) ? '/admin' : '/dashboard';
}

/* ---- Cart maths (pure helpers over the cart held in AppProvider) ---- */

export function countCartItems(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + (Number(item.qty) || 0), 0);
}

export function sumCartItems(cart: Pick<CartItem, 'price' | 'qty'>[]): number {
  return cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0,
  );
}

/* ---- Catalog helpers ---- */

export function productIcon(category: string): 'badge' | 'shirt' {
  return category === 'ID Lace' ? 'badge' : 'shirt';
}

export function findProduct(products: Product[], productId: string | undefined): Product | null {
  if (!productId) return null;
  return products.find((product) => product.id === productId) ?? null;
}
