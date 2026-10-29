// src/types.ts

/* ============================================
   ROLES — 3 actors only
============================================ */
export type UserRole = 'Student' | 'Admin' | 'Organization';

/* ============================================
   PRODUCT
============================================ */
export interface Product {
  id: string;
  name: string;
  category: string;
  organization: string;
  price: number;
  stock: number;
  sizes: string[];
  sizeStocks?: Record<string, number>;
  image: string;
  imageAlt: string;
  description: string;
}

/* ============================================
   CART
============================================ */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  organization: string;
  size: string;
  qty: number;
}

/* ============================================
   ORDER
============================================ */
export interface OrderItem {
  id: string;
  name: string;
  organization: string;
  price: number;
  qty: number;
  size: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  studentId: string;
  email: string;
  phone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentRef: string | null;
  paymentStatus: string;
  orderStatus: string;
  claimLocation: string;
  claimDate: string;
  createdAt: string;
}

/* ============================================
   SESSION
============================================ */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  idNumber: string;
  course: string;          // 🚨 IDINAGDAG
  yearLevel: string;       // 🚨 IDINAGDAG
  dateOfBirth: string;     // 🚨 IDINAGDAG
  profilePicture?: string;
}

export interface UserRecord extends SessionUser {
  fullName: string;
  userCode: string;
  passwordSalt: string;
  passwordHash: string;
  password?: string;
}

/* ============================================
   MISC
============================================ */
export interface BadgeInfo {
  text: string;
  className: string;
}