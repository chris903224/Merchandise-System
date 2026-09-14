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
  /** Alt text including photographer attribution for the stock image. */
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

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  idNumber: string;
  profilePicture?: string; // 👈 IDAGDAG ITO (optional)
}

export interface UserRecord extends SessionUser {
  fullName: string;
  userCode: string;
  passwordSalt: string;
  passwordHash: string;
  /**
   * @deprecated Legacy plaintext password from earlier builds. Records that
   * still carry it are upgraded to salt + hash by `ensureSeeded()`.
   */
  password?: string;
}

export interface BadgeInfo {
  text: string;
  className: string;
}