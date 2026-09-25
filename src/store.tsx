// src/store.tsx

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
import { supabase } from './lib/supabaseClient';
import { fetchProducts, refreshProducts as refreshProductsService } from './services/products';
import {
  placeOrder as placeOrderService,
  fetchAllOrders,
  updateOrderStatus as updateOrderStatusService,
} from './services/orders';
import { createNotification } from './services/notifications';
import { invalidateCache } from './utils/cache';

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
  setProductStock: (productId: string, stock: number) => Promise<void>;
  setOrderStatus: (orderId: string, orderStatus: string) => Promise<void>;
  placeOrder: (order: Order) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProfilePicture: (imageUrl: string | null) => void;
  refreshProducts: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function readClientState(): Pick<AppState, 'session' | 'cart'> {
  return {
    session: readStorage<SessionUser | null>(STORAGE_KEYS.session, null),
    cart: readStorage<CartItem[]>(STORAGE_KEYS.cart, []),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(
    () => readClientState().session
  );
  const [cart, setCartState] = useState<CartItem[]>(
    () => readClientState().cart
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // INITIAL LOAD (with cache)
  // ============================================
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const [productsData, ordersData] = await Promise.all([
        fetchProducts(),   // ✅ Cached
        fetchAllOrders(),  // ✅ Cached
      ]);

      setProducts(productsData);
      setOrders(ordersData);
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    const productsChannel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          // ✅ Invalidate cache sa real-time update
          invalidateCache('products');

          if (payload.eventType === 'INSERT') {
            setProducts((prev) => [...prev, mapProductRow(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? mapProductRow(payload.new) : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          invalidateCache('orders_all');
          invalidateCache('orders');

          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [mapOrderRow(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id ? mapOrderRow(payload.new) : o
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // ============================================
  // SESSION
  // ============================================
  const signIn = useCallback((user: SessionUser) => {
    writeStorage(STORAGE_KEYS.session, user);
    setSession(user);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.session);
    setSession(null);
  }, []);

  const updateProfilePicture = useCallback((imageUrl: string | null) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, profilePicture: imageUrl ?? undefined };
      writeStorage(STORAGE_KEYS.session, next);
      return next;
    });
  }, []);

  // ============================================
  // CART
  // ============================================
  const setCart = useCallback((items: CartItem[]) => {
    writeStorage(STORAGE_KEYS.cart, items);
    setCartState(items);
  }, []);

  // ============================================
  // PRODUCTS CRUD
  // ============================================
  const setProductStock = useCallback(
    async (productId: string, stock: number) => {
      const safeStock = Math.max(0, stock);

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: safeStock } : p))
      );

      await supabase
        .from('products')
        .update({ stock: safeStock })
        .eq('id', productId);

      invalidateCache('products');
    },
    []
  );

  const addProduct = useCallback(async (product: Product) => {
    setProducts((prev) => [...prev, product]);

    await supabase.from('products').insert([
      {
        id: product.id,
        name: product.name,
        category: product.category,
        organization: product.organization,
        price: product.price,
        stock: product.stock,
        sizes: product.sizes,
        image: product.image,
        image_alt: product.imageAlt,
        description: product.description,
      },
    ]);

    invalidateCache('products');
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? product : p))
    );

    await supabase
      .from('products')
      .update({
        name: product.name,
        category: product.category,
        organization: product.organization,
        price: product.price,
        stock: product.stock,
        sizes: product.sizes,
        image: product.image,
        image_alt: product.imageAlt,
        description: product.description,
      })
      .eq('id', product.id);

    invalidateCache('products');
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    await supabase.from('products').delete().eq('id', productId);
    invalidateCache('products');
  }, []);

  // ============================================
  // ORDERS
  // ============================================
  const setOrderStatus = useCallback(
    async (orderId: string, orderStatus: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus } : o))
      );

      await updateOrderStatusService(orderId, orderStatus);

      // Auto-create notification
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        const statusMessages: Record<
          string,
          { title: string; message: string; type: 'order' | 'pickup' | 'system' | 'info' | 'promo' }
        > = {
          Pending: {
            title: 'Order Placed',
            message: `Your order #${orderId} has been placed and is pending review.`,
            type: 'order',
          },
          Processing: {
            title: 'Order Processing',
            message: `Your order #${orderId} is now being prepared.`,
            type: 'order',
          },
          'Ready for Pickup': {
            title: 'Ready for Pickup! 🎉',
            message: `Your order #${orderId} is ready for pickup at SJCM Campus.`,
            type: 'pickup',
          },
          Claimed: {
            title: 'Order Claimed',
            message: `Your order #${orderId} has been successfully claimed. Thank you!`,
            type: 'order',
          },
          Cancelled: {
            title: 'Order Cancelled',
            message: `Your order #${orderId} has been cancelled.`,
            type: 'system',
          },
        };

        const statusInfo = statusMessages[orderStatus];
        if (statusInfo) {
          await createNotification(order.userId, {
            type: statusInfo.type,
            title: statusInfo.title,
            message: statusInfo.message,
            link: `/orders/${orderId}`,
            actionLabel: 'View Order',
            metadata: {
              orderId,
              status: orderStatus,
              productId: order.items[0]?.id,
            },
          });
        }
      }
    },
    [orders]
  );

  const placeOrder = useCallback(async (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setProducts((prev) =>
      prev.map((product) => {
        const reserved = order.items
          .filter((item) => item.id === product.id)
          .reduce((total, item) => total + (Number(item.qty) || 0), 0);
        return reserved > 0
          ? { ...product, stock: Math.max(0, product.stock - reserved) }
          : product;
      })
    );
    setCartState([]);
    writeStorage(STORAGE_KEYS.cart, []);

    await placeOrderService(order);

    await createNotification(order.userId, {
      type: 'order',
      title: 'Order Confirmed ✅',
      message: `Your order #${order.id} has been successfully placed! Total: ₱${order.totalAmount.toFixed(2)}.`,
      link: `/orders/${order.id}`,
      actionLabel: 'View Order',
      metadata: { orderId: order.id, totalAmount: order.totalAmount },
    });
  }, []);

  // ============================================
  // REFRESH PRODUCTS (bypass cache)
  // ============================================
  const refreshProductsData = useCallback(async () => {
    const data = await refreshProductsService();
    setProducts(data);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      session,
      cart,
      products,
      orders,
      isLoading,
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
      refreshProducts: refreshProductsData,
    }),
    [
      session,
      cart,
      products,
      orders,
      isLoading,
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
      refreshProductsData,
    ]
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

// ============================================
// MAPPERS
// ============================================
function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    organization: row.organization,
    price: Number(row.price),
    stock: row.stock,
    sizes: row.sizes ?? [],
    sizeStocks: row.size_stocks ?? {},
    image: row.image,
    imageAlt: row.image_alt ?? '',
    description: row.description ?? '',
  };
}

function mapOrderRow(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    studentId: row.student_id ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    items: row.items ?? [],
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method ?? '',
    paymentRef: row.payment_ref ?? null,
    paymentStatus: row.payment_status ?? '',
    orderStatus: row.order_status ?? '',
    claimLocation: row.claim_location ?? '',
    claimDate: row.claim_date ?? '',
    createdAt: row.created_at,
  };
}