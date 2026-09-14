import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Order, Product, SessionUser } from './types';
import { STORAGE_KEYS, readStorage, writeStorage } from './data/storage';

interface AppState {
  session: SessionUser | null;
  cart: CartItem[];
  products: Product[];
  orders: Order[];
}

interface AppContextValue extends AppState {
  signIn: (user: SessionUser) => void;
  signOut: () => void;
  setCart: (items: CartItem[]) => void;
  /** Overwrites the stock count for a single product. */
  setProductStock: (productId: string, stock: number) => void;
  /** Moves an order to the next fulfillment status. */
  setOrderStatus: (orderId: string, orderStatus: string) => void;
  /** Commits a new order, decrements stock for its items and empties the cart. */
  placeOrder: (order: Order) => void;
  /** Appends a new product to the inventory. */
  addProduct: (product: Product) => void;
  /** Replaces an existing product record in-place. */
  updateProduct: (product: Product) => void;
  /** Removes a product from the inventory by ID. */
  deleteProduct: (productId: string) => void;
  /** Updates the signed-in user's profile picture. */
  updateProfilePicture: (imageUrl: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readState(): AppState {
  return {
    session: readStorage<SessionUser | null>(STORAGE_KEYS.session, null),
    cart: readStorage<CartItem[]>(STORAGE_KEYS.cart, []),
    products: readStorage<Product[]>(STORAGE_KEYS.products, []),
    orders: readStorage<Order[]>(STORAGE_KEYS.orders, []),
  };
}

/**
 * Single source of truth for everything persisted in localStorage. Components
 * read from this context instead of hitting localStorage during render, so an
 * update on one page is immediately visible on every other page.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(readState);

  // Keep other tabs/windows of the store in sync.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      const watchedKeys: string[] = Object.values(STORAGE_KEYS);
      if (event.key !== null && !watchedKeys.includes(event.key)) return;
      setState(readState());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const signIn = useCallback((user: SessionUser) => {
    writeStorage(STORAGE_KEYS.session, user);
    setState((previous) => ({ ...previous, session: user }));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.session);
    setState((previous) => ({ ...previous, session: null }));
  }, []);

  const setCart = useCallback((items: CartItem[]) => {
    writeStorage(STORAGE_KEYS.cart, items);
    setState((previous) => ({ ...previous, cart: items }));
  }, []);

  const setProductStock = useCallback((productId: string, stock: number) => {
    setState((previous) => {
      const products = previous.products.map((product) =>
        product.id === productId ? { ...product, stock: Math.max(0, stock) } : product,
      );
      writeStorage(STORAGE_KEYS.products, products);
      return { ...previous, products };
    });
  }, []);

  const setOrderStatus = useCallback((orderId: string, orderStatus: string) => {
    setState((previous) => {
      const orders = previous.orders.map((order) =>
        order.id === orderId ? { ...order, orderStatus } : order,
      );
      writeStorage(STORAGE_KEYS.orders, orders);
      return { ...previous, orders };
    });
  }, []);

  const placeOrder = useCallback((order: Order) => {
    setState((previous) => {
      const orders = [order, ...previous.orders];
      const products = previous.products.map((product) => {
        const reserved = order.items
          .filter((item) => item.id === product.id)
          .reduce((total, item) => total + (Number(item.qty) || 0), 0);
        return reserved > 0
          ? { ...product, stock: Math.max(0, product.stock - reserved) }
          : product;
      });

      writeStorage(STORAGE_KEYS.orders, orders);
      writeStorage(STORAGE_KEYS.products, products);
      writeStorage(STORAGE_KEYS.cart, []);

      return { ...previous, orders, products, cart: [] };
    });
  }, []);

  const addProduct = useCallback((product: Product) => {
    setState((previous) => {
      const products = [...previous.products, product];
      writeStorage(STORAGE_KEYS.products, products);
      return { ...previous, products };
    });
  }, []);

  const updateProduct = useCallback((product: Product) => {
    setState((previous) => {
      const products = previous.products.map((p) =>
        p.id === product.id ? product : p,
      );
      writeStorage(STORAGE_KEYS.products, products);
      return { ...previous, products };
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setState((previous) => {
      const products = previous.products.filter((p) => p.id !== productId);
      writeStorage(STORAGE_KEYS.products, products);
      return { ...previous, products };
    });
  }, []);

  const updateProfilePicture = useCallback((imageUrl: string | null) => {
    setState((previous) => {
      if (!previous.session) {
        return previous;
      }
      const session = {
        ...previous.session,
        profilePicture: imageUrl ?? undefined,
      };
      writeStorage(STORAGE_KEYS.session, session);
      return { ...previous, session };
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      setCart,
      setProductStock,
      setOrderStatus,
      placeOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProfilePicture,
    }),
    [state, signIn, signOut, setCart, setProductStock, setOrderStatus, placeOrder, addProduct, updateProduct, deleteProduct, updateProfilePicture],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useProducts(): Product[] {
  return useApp().products;
}

export function useOrders(): Order[] {
  return useApp().orders;
}
