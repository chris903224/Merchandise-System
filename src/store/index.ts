// src/types/index.ts

export type UserRole = 'Student' | 'Faculty' | 'School Staff' | 'Admin';

export interface Product {
  id: string;
  name: string;
  category: string;
  organization: string;
  price: number;
  stock: number;
  sizes: string[];
  image: string;
  imageAlt: string;
  description: string;
  
  // ✅ IDINAGDAG: Per-size stock tracking
  sizeStocks?: Record<string, number>;
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
  
  // ✅ Optional fields para sa compatibility
  image?: string;
  category?: string;
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
  
  // ✅ Optional fields na ginagamit ng organization dashboard
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
  
  // ✅ IDAGDAG ITO PARA SA RESTRICTION
  course?: string;
  yearLevel?: string;
  dateOfBirth?: string;
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