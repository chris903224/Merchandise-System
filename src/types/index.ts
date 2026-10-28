// src/types/index.ts

// ✅ TOTOONG ROLES LANG: Student, Admin, Organization
export type UserRole = 'Student' | 'Admin' | 'Organization';

export interface Product {
  id: string;
  name: string;
  category: string;
  organization: string;
  price: number;
  stock: number;
  sizes: string[];
  /** ✅ Per-size stock tracking */
  sizeStocks?: Record<string, number>;
  image: string;
  imageAlt: string;
  description: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  organization: string;
  size: string;
  qty: number;
}

export interface OrderItem {
  id: string;
  name: string;
  organization: string;
  price: number;
  qty: number;
  size: string;
  /** ✅ Para sa product image sa orders list */
  image?: string;
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
  /** ✅ Para sa cancelled orders */
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  idNumber: string;
  profilePicture?: string | null;
  
  // ✅ MGA PROFILE FIELDS
  course?: string;
  yearLevel?: string;
  dateOfBirth?: string;
  phone?: string | null;
}

export interface UserRecord extends SessionUser {
  fullName: string;
  userCode: string;
  passwordSalt: string;
  passwordHash: string;
  password?: string;
}

export interface BadgeInfo {
  text: string;
  className: string;
}