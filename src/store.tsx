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
  updatePaymentStatus as updatePaymentStatusService,
  refreshOrders as refreshOrdersService,
} from './services/orders';
import { createUserNotification } from './services/userNotifications';
import { invalidateCache } from './utils/cache';
import {
  getOnboardingStatus,
  saveOnboardingResponse,
  type UniformResponse,
  type OnboardingRecord,
} from './services/onboarding';

/* ============================================
   TYPES
============================================ */

interface AppState {
  session: SessionUser | null;
  cart: CartItem[];
  products: Product[];
  orders: Order[];
  onboarding: OnboardingRecord | null;
}

interface AppContextValue extends AppState {
  signIn: (user: SessionUser) => void;
  signOut: () => void;
  setCart: (items: CartItem[]) => void;
  setProductStock: (productId: string, stock: number) => Promise<void>;
  setOrderStatus: (orderId: string, orderStatus: string) => Promise<void>;
  setOrderPaymentStatus: (orderId: string, paymentStatus: string) => Promise<void>;
  placeOrder: (order: Order) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProfilePicture: (imageUrl: string | null) => void;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;

  isLoading: boolean;

  loginLockUntil: number | null;
  isLoginLocked: boolean;
  lockLogin: (seconds: number) => void;
  unlockLogin: () => void;

  onboarding: OnboardingRecord | null;
  isLoadingOnboarding: boolean;
  refreshOnboarding: () => Promise<void>;
  saveOnboarding: (response: UniformResponse) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const LOGIN_LOCK_KEY = 'sjcm_login_lock_until';

function readLoginLock(): number | null {
  const stored = readStorage<number | null>(LOGIN_LOCK_KEY, null);
  if (stored && Date.now() < stored) return stored;
  if (stored) localStorage.removeItem(LOGIN_LOCK_KEY);
  return null;
}

/* ============================================
   ✅ FIXED: SESSION INITIAL LOAD
   🚨 Tinitiyak na ang course ay laging tama
============================================ */
function readClientState(): Pick<AppState, 'session' | 'cart'> {
  const session = readStorage<SessionUser | null>(STORAGE_KEYS.session, null);
  
  // 🚨 KUNIN ANG COURSE MULA SA LOCALSTORAGE (galing sa LoginPage/SettingsPage)
  const savedCourse = localStorage.getItem('sjc-course');
  const savedYearLevel = localStorage.getItem('sjc-year-level');
  const savedDob = localStorage.getItem('sjc-dob');

  // 👈 I-override ang session properties kung may naka-save sa localStorage
  if (session) {
    // Kung may naka-save na course sa localStorage, ito ang gamitin
    if (savedCourse && savedCourse.trim() !== '') {
      (session as any).course = savedCourse.trim();
    }
    if (savedYearLevel && savedYearLevel.trim() !== '') {
      (session as any).yearLevel = savedYearLevel.trim();
    }
    if (savedDob && savedDob.trim() !== '') {
      (session as any).dateOfBirth = savedDob.trim();
    }
  }

  console.log('[Store] readClientState:', {
    sessionId: session?.id,
    sessionCourse: (session as any)?.course,
    localStorageCourse: savedCourse,
    finalCourse: session?.id ? (session as any)?.course : 'NO SESSION',
  });

  return {
    session,
    cart: session ? readStorage<CartItem[]>(STORAGE_KEYS.cart, []) : [],
  };
}

/* ============================================
   PROVIDER
============================================ */

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

  const [onboarding, setOnboarding] = useState<OnboardingRecord | null>(null);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);

  const [loginLockUntil, setLoginLockUntil] = useState<number | null>(
    () => readLoginLock()
  );
  const [lockTick, setLockTick] = useState(0);

  useEffect(() => {
    if (loginLockUntil) {
      writeStorage(LOGIN_LOCK_KEY, loginLockUntil);
    } else {
      localStorage.removeItem(LOGIN_LOCK_KEY);
    }
  }, [loginLockUntil]);

  useEffect(() => {
    if (!loginLockUntil) return;

    const tick = () => {
      if (Date.now() >= loginLockUntil) {
        setLoginLockUntil(null);
      } else {
        setLockTick((n) => n + 1);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [loginLockUntil]);

  const lockLogin = useCallback((seconds: number) => {
    setLoginLockUntil(Date.now() + seconds * 1000);
  }, []);

  const unlockLogin = useCallback(() => {
    setLoginLockUntil(null);
  }, []);

  const isLoginLocked =
    loginLockUntil !== null && Date.now() < loginLockUntil;
  void lockTick;

  /* ============================================
     ONBOARDING
     ============================================ */
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      if (!session?.id) {
        setOnboarding(null);
        return;
      }

      setIsLoadingOnboarding(true);
      try {
        const status = await getOnboardingStatus(session.id);
        setOnboarding(status);
      } catch (error) {
        console.warn('[Store] Failed to load onboarding:', error);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    void loadOnboardingStatus();
  }, [session?.id]);

  const refreshOnboarding = useCallback(async () => {
    if (!session?.id) {
      setOnboarding(null);
      return;
    }

    setIsLoadingOnboarding(true);
    try {
      const status = await getOnboardingStatus(session.id);
      setOnboarding(status);
    } catch (error) {
      console.warn('[Store] Failed to refresh onboarding:', error);
    } finally {
      setIsLoadingOnboarding(false);
    }
  }, [session?.id]);

  const saveOnboarding = useCallback(
    async (response: UniformResponse) => {
      if (!session?.id) {
        throw new Error('No session — cannot save onboarding');
      }

      const saved = await saveOnboardingResponse(session.id, response);
      setOnboarding(saved);
    },
    [session?.id]
  );

  /* ============================================
     INITIAL LOAD
     ============================================ */
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const [productsData, ordersData] = await Promise.all([
        fetchProducts(),
        fetchAllOrders(),
      ]);

      setProducts(productsData);
      setOrders(ordersData);
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  /* ============================================
     REAL-TIME SUBSCRIPTIONS
     ============================================ */
  useEffect(() => {
    const productsChannel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
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
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
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

          const userId =
            payload.eventType === 'DELETE'
              ? (payload.old as any)?.user_id
              : (payload.new as any)?.user_id;

          if (userId) invalidateCache(`orders_${userId}`);

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

    const userNotificationsChannel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications' },
        (payload) => {
          const userId =
            payload.eventType === 'DELETE'
              ? (payload.old as any)?.user_id
              : (payload.new as any)?.user_id;

          if (userId) invalidateCache(`user_notifications_${userId}`);

          window.dispatchEvent(
            new CustomEvent('user-notifications-updated', {
              detail: {
                userId,
                eventType: payload.eventType,
                notification: payload.new,
              },
            })
          );
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          const userId =
            payload.eventType === 'DELETE'
              ? (payload.old as any)?.user_id
              : (payload.new as any)?.user_id;

          if (userId) invalidateCache(`notifications_${userId}`);

          window.dispatchEvent(
            new CustomEvent('notifications-updated', {
              detail: {
                userId,
                eventType: payload.eventType,
                notification: payload.new,
              },
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(userNotificationsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  /* ============================================
     SESSION — May LocalStorage Sync
     ============================================ */
  const signIn = useCallback((user: SessionUser) => {
    writeStorage(STORAGE_KEYS.session, user);
    setSession(user);

    // 🚨 I-SAVE ANG COURSE, YEAR LEVEL, AT DOB SA LOCAL STORAGE
    const userAny = user as any;
    if (userAny.course) {
      localStorage.setItem('sjc-course', userAny.course);
    }
    if (userAny.yearLevel) {
      localStorage.setItem('sjc-year-level', userAny.yearLevel);
    }
    if (userAny.dateOfBirth) {
      localStorage.setItem('sjc-dob', userAny.dateOfBirth);
    }

    const savedCart = readStorage<CartItem[]>(STORAGE_KEYS.cart, []);
    if (savedCart.length > 0) setCartState(savedCart);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.cart);
    localStorage.removeItem('sjc-course');
    localStorage.removeItem('sjc-year-level');
    localStorage.removeItem('sjc-dob');

    setSession(null);
    setCartState([]);
    setOnboarding(null);
  }, []);

  const updateProfilePicture = useCallback((imageUrl: string | null) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, profilePicture: imageUrl ?? undefined };
      writeStorage(STORAGE_KEYS.session, next);
      return next;
    });
  }, []);

  /* ============================================
     CART
     ============================================ */
  const setCart = useCallback(
    (items: CartItem[]) => {
      if (session) writeStorage(STORAGE_KEYS.cart, items);
      setCartState(items);
    },
    [session]
  );

  /* ============================================
     PRODUCTS CRUD
     ============================================ */
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
        size_stocks: product.sizeStocks ?? {},
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
        size_stocks: product.sizeStocks ?? {},
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

  /* ============================================
     ORDERS — RLS-SAFE (non-fatal notifications)
     ============================================ */
  const setOrderStatus = useCallback(
    async (orderId: string, orderStatus: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus } : o))
      );

      try {
        await updateOrderStatusService(orderId, orderStatus);
      } catch (err) {
        console.error('[Store] ❌ Order status update failed:', err);
        throw err;
      }

      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const statusMessages: Record<
        string,
        {
          title: string;
          message: string;
          type: 'order' | 'pickup' | 'system' | 'info' | 'promo';
        }
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
        Completed: {
          title: 'Order Completed',
          message: `Your order #${orderId} has been completed. Thank you!`,
          type: 'order',
        },
        Cancelled: {
          title: 'Order Cancelled',
          message: `Your order #${orderId} has been cancelled.`,
          type: 'system',
        },
      };

      const statusInfo = statusMessages[orderStatus];
      if (!statusInfo) return;

      try {
        await createUserNotification(order.userId, {
          type: statusInfo.type,
          title: statusInfo.title,
          message: statusInfo.message,
          link: `/orders/${orderId}`,
          actionLabel: 'View Order',
          metadata: { orderId, status: orderStatus },
        });
        console.log('[Store] ✅ Status notification created:', orderStatus);
      } catch (err) {
        console.warn('[Store] ⚠️ Notification failed (non-fatal):', err);
      }
    },
    [orders]
  );

  const setOrderPaymentStatus = useCallback(
    async (orderId: string, paymentStatus: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
      );

      await updatePaymentStatusService(orderId, paymentStatus);

      const order = orders.find((o) => o.id === orderId);
      if (order && paymentStatus === 'Paid') {
        try {
          await createUserNotification(order.userId, {
            type: 'order',
            title: 'Payment Received ✅',
            message: `Payment for order #${orderId} has been confirmed. Total: ₱${order.totalAmount.toFixed(2)}.`,
            link: `/orders/${orderId}`,
            actionLabel: 'View Order',
            metadata: { orderId, paymentStatus },
          });
        } catch (err) {
          console.warn('[Store] ⚠️ Payment notification failed (non-fatal):', err);
        }
      }
    },
    [orders]
  );

  const placeOrder = useCallback(
    async (order: Order) => {
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

      if (session) writeStorage(STORAGE_KEYS.cart, []);
      setCartState([]);

      await placeOrderService(order);

      try {
        await createUserNotification(order.userId, {
          type: 'order',
          title: 'Order Confirmed ✅',
          message: `Your order #${order.id} has been successfully placed! Total: ₱${order.totalAmount.toFixed(2)}.`,
          link: `/orders/${order.id}`,
          actionLabel: 'View Order',
          metadata: { orderId: order.id, totalAmount: order.totalAmount },
        });
      } catch (err) {
        console.warn('[Store] ⚠️ Order notification failed (non-fatal):', err);
      }
    },
    [session]
  );

  /* ============================================
     REFRESH DATA
     ============================================ */
  const refreshProductsData = useCallback(async () => {
    const data = await refreshProductsService();
    setProducts(data);
  }, []);

  const refreshOrdersData = useCallback(async () => {
    const data = await refreshOrdersService();
    setOrders(data);
  }, []);

  /* ============================================
     CONTEXT VALUE
     ============================================ */
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
      setOrderPaymentStatus,
      placeOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProfilePicture,
      refreshProducts: refreshProductsData,
      refreshOrders: refreshOrdersData,

      loginLockUntil,
      isLoginLocked,
      lockLogin,
      unlockLogin,

      onboarding,
      isLoadingOnboarding,
      refreshOnboarding,
      saveOnboarding,
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
      setOrderPaymentStatus,
      placeOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProfilePicture,
      refreshProductsData,
      refreshOrdersData,

      loginLockUntil,
      isLoginLocked,
      lockLogin,
      unlockLogin,

      onboarding,
      isLoadingOnboarding,
      refreshOnboarding,
      saveOnboarding,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ============================================
   HOOKS
   ============================================ */

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

/* ============================================
   MAPPERS
   ============================================ */

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