export const STORAGE_KEYS = {
  products: 'products_db',
  users: 'users_db',
  orders: 'orders_db',
  cart: 'cart',
  session: 'session',
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return (value ?? fallback) as T;
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage.`, error);
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
