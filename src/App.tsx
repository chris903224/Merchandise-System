// src/App.tsx

import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import SiteLayout from './layout/SiteLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ConfirmationPage from './pages/ConfirmationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import ProfilePage from './pages/ProfilePages';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';

import AuthPageTransition from './components/auth/AuthPageTransition';
import { useNotificationStore } from './store/notificationStore';
import { useApp } from './store';

// ADMIN PAGES
import {
  AdminLayout,
  AdminLoginPage,
  AdminOtpPage,
  DashboardPage as AdminDashboardPage,
  ProductsPage as AdminProductsPage,
  OrdersPage as AdminOrdersPage,
  PaymentsPage as AdminPaymentsPage,
  PayMongoPage as AdminPayMongoPage,
  OrganizationsPage as AdminOrganizationsPage,
  ConsolePage as AdminConsolePage,
  ProfilePage as AdminProfilePage,
  SettingsPage as AdminSettingsPage,
} from './pages/admin';

// ORGANIZATION PAGES
import {
  OrganizationLayout,
  OrgLoginPage,
  DashboardPage as OrgDashboardPage,
  ProductsPage as OrgProductsPage,
  ProductDetailsPage as OrgProductDetailsPage,
  OrdersPage as OrgOrdersPage,
  OrderDetailsPage as OrgOrderDetailsPage,
  NotificationsPage as OrgNotificationsPage,
  ProfilePage as OrgProfilePage,
  SettingsPage as OrgSettingsPage,
  OrgOnboardingPage,
} from './pages/organization';

import { getStoredTheme, applyTheme, getThemeDefinition } from './theme';
import { supabase } from './lib/supabaseClient';

/* ============================================
  ✅ THEME INITIALIZER
============================================ */
function ThemeInitializer() {
  useEffect(() => {
    const theme = getStoredTheme();
    applyTheme(theme);
    const uiStyle = localStorage.getItem('sjc-ui') ?? 'glass';
    document.documentElement.dataset.ui = uiStyle;
    const themeDef = getThemeDefinition(theme);
    document.documentElement.setAttribute('data-theme-mode', themeDef.mode);
  }, []);
  return null;
}

/* ============================================
  ✅ GLOBAL NOTIFICATION LOADER
============================================ */
function GlobalNotificationLoader() {
  const { session, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (!session?.id) {
      useNotificationStore.getState().reset();
      return;
    }
    void useNotificationStore.getState().loadNotifications(session.id, true);
    useNotificationStore.getState().subscribeToRealtime(session.id);
    return () => {
      useNotificationStore.getState().unsubscribeFromRealtime();
    };
  }, [session?.id, isLoading]);
  return null;
}

/* ============================================
  ✅ STUDENT GUARD
============================================ */
function StudentGuard() {
  const { session, isLoading } = useApp();
  if (isLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  if (!session || session.role === 'Organization') return <Navigate to="/login" replace />;
  return <Outlet />;
}

/* ============================================
  ✅ ORG GUARD
============================================ */
function OrgGuard() {
  const { session, isLoading } = useApp();
  if (isLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  if (!session || session.role !== 'Organization') return <Navigate to="/org/login" replace />;
  return <Outlet />;
}

/* ============================================
  ✅ ORG LOGIN GUARD
============================================ */
function OrgLoginGuard() {
  const { session, isLoading } = useApp();
  if (isLoading) return null;
  if (session && session.role === 'Organization') return <Navigate to="/org/dashboard" replace />;
  return <Outlet />;
}

/* ============================================
  ✅ ADMIN LOGIN GUARD
============================================ */
function AdminLoginGuard() {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email && !session.user.email.endsWith('@phinmaed.com')) {
          console.warn('[AdminGuard] Blocked Gmail user.');
          window.location.replace('/login'); 
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    }
    checkUser();
  }, [navigate]);

  if (isChecking) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050a16', color: '#fff' }}>Checking authorization...</div>;
  }

  return <Outlet />;
}

/* ============================================
  ✅ ADMIN ROUTE GUARD (LOCALSTORAGE FIRST)
============================================ */
function AdminRouteGuard() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminAccess() {
      // 🚨 CHECK #1: Basahin ang localStorage (galing sa OTP verification)
      const adminSession = localStorage.getItem('sjcm_admin_auth');
      
      if (adminSession) {
        console.log('[AdminRouteGuard] ✅ LocalStorage session found. Allowing access.');
        setIsAuthorized(true);
        return; // 🚨 Dito tayo titigil, wag nang titingin sa JWT
      }

      // 🚨 CHECK #2: Kung wala sa localStorage, tignan ang JWT (Fallback)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthorized(false);
        navigate('/admin/login', { replace: true });
        return;
      }

      let isAdminAuthorized = session.user.app_metadata?.is_system_admin === true;

      if (!isAdminAuthorized && session.user.email) {
        const { data } = await supabase.rpc('verify_admin_email', { p_email: session.user.email });
        isAdminAuthorized = data === true;
      }

      if (!isAdminAuthorized) {
        console.warn('[AdminRouteGuard] ⚠️ Unauthorized Admin.');
        // 🚨 INALIS NATIN ANG supabase.auth.signOut() DITO
        setIsAuthorized(false);
        navigate('/admin/login', { replace: true });
        return;
      }

      setIsAuthorized(true);
    }
    checkAdminAccess();
  }, [navigate]);

  if (isAuthorized === null) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Verifying Access...</div>;
  }

  if (!isAuthorized) return null;

  return <Outlet />;
}

/* ============================================
  ✅ DETECT KUNG AUTH PAGE ANG CURRENT ROUTE
============================================ */
function useIsAuthRoute() {
  const location = useLocation();
  const authPaths = ['/login', '/register', '/forgot-password', '/org/login', '/admin/login', '/admin/otp'];
  return authPaths.some((path) => location.pathname === path);
}

export default function App() {
  const isAuthRoute = useIsAuthRoute();

  if (isAuthRoute) {
    return (
      <>
        <ThemeInitializer />
        <Routes>
          <Route path="/login" element={<AuthPageTransition><LoginPage /></AuthPageTransition>} />
          <Route path="/register" element={<AuthPageTransition><RegisterPage /></AuthPageTransition>} />
          <Route path="/forgot-password" element={<AuthPageTransition><ForgotPasswordPage /></AuthPageTransition>} />
          
          <Route element={<OrgLoginGuard />}>
            <Route path="/org/login" element={<AuthPageTransition><OrgLoginPage /></AuthPageTransition>} />
          </Route>

          <Route element={<AdminLoginGuard />}>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/otp" element={<AdminOtpPage />} />
          </Route>
        </Routes>
      </>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <GlobalNotificationLoader />

      <Routes>
        {/* ORGANIZATION DASHBOARD */}
        <Route element={<OrgGuard />}>
          <Route path="/org" element={<OrganizationLayout />}>
            <Route index element={<Navigate to="/org/dashboard" replace />} />
            <Route path="dashboard" element={<OrgDashboardPage />} />
            <Route path="products" element={<OrgProductsPage />} />
            <Route path="products/:id" element={<OrgProductDetailsPage />} />
            <Route path="orders" element={<OrgOrdersPage />} />
            <Route path="orders/:id" element={<OrgOrderDetailsPage />} />
            <Route path="onboarding" element={<OrgOnboardingPage />} />
            <Route path="notifications" element={<OrgNotificationsPage />} />
            <Route path="profile" element={<OrgProfilePage />} />
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="*" element={<Navigate to="/org/dashboard" replace />} />
          </Route>
        </Route>

        {/* STUDENT SIDE */}
        <Route element={<StudentGuard />}>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>
        </Route>

        {/* ADMIN DASHBOARD (Protected) */}
        <Route element={<AdminRouteGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="paymongo" element={<AdminPayMongoPage />} />
            <Route path="orgs" element={<AdminOrganizationsPage />} />
            <Route path="console" element={<AdminConsolePage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}