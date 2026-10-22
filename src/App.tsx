// src/App.tsx

import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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

// ✅ Para sa global notification loading
import { useNotificationStore } from './store/notificationStore';
import { useApp } from './store';

// ✅ ADMIN PAGES
import {
  AdminLayout,
  AdminLoginPage,
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

// ✅ ORGANIZATION PAGES
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
} from './pages/organization';

// ✅ IMPORT THEME UTILS
import { getStoredTheme, applyTheme, getThemeDefinition } from './theme';

/* ============================================
  ✅ INITIALIZE THEME & UI STYLE
  ✅ Naka-set ang data-theme at data-ui sa <html> tag
  ✅ Ito ang mag-a-apply ng CSS variables sa buong app
============================================ */
function ThemeInitializer() {
  useEffect(() => {
    // 1. I-apply ang Theme
    const theme = getStoredTheme();
    applyTheme(theme);

    // 2. I-apply ang UI Style (Morphism)
    const uiStyle = localStorage.getItem('sjc-ui') ?? 'glass';
    document.documentElement.dataset.ui = uiStyle;

    // 3. I-apply ang theme mode (light/dark)
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
  ✅ ORG ROUTE GUARD
============================================ */
function OrgGuard() {
  const { session, isLoading } = useApp();
  
  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  }

  if (!session || session.role !== 'Organization') {
    console.warn('[OrgGuard] ⚠️ Unauthorized. Redirecting to /org/login');
    return <Navigate to="/org/login" replace />;
  }

  return <Outlet />;
}

/* ============================================
  ✅ ORG LOGIN GUARD
============================================ */
function OrgLoginGuard() {
  const { session, isLoading } = useApp();

  if (isLoading) return null;

  if (session && session.role === 'Organization') {
    return <Navigate to="/org/dashboard" replace />;
  }

  return <Outlet />;
}

/* ============================================
  ✅ ANIMATED AUTH ROUTES
============================================ */
function AnimatedAuthRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <AuthPageTransition>
              <LoginPage />
            </AuthPageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <AuthPageTransition>
              <RegisterPage />
            </AuthPageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthPageTransition>
              <ForgotPasswordPage />
            </AuthPageTransition>
          }
        />
        
        {/* ✅ ORGANIZATION LOGIN ROUTE (may guard) */}
        <Route element={<OrgLoginGuard />}>
          <Route
            path="/org/login"
            element={
              <AuthPageTransition>
                <OrgLoginPage />
              </AuthPageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

/* ============================================
  ✅ DETECT KUNG AUTH PAGE ANG CURRENT ROUTE
============================================ */
function useIsAuthRoute() {
  const location = useLocation();
  const authPaths = ['/login', '/register', '/forgot-password', '/org/login'];
  return authPaths.some((path) => location.pathname === path);
}

export default function App() {
  const isAuthRoute = useIsAuthRoute();

  if (isAuthRoute) {
    return (
      <>
        <ThemeInitializer />
        <AnimatedAuthRoutes />
      </>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <GlobalNotificationLoader />

      <Routes>
        {/* ============================================
            ADMIN LOGIN (standalone)
            ============================================ */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ============================================
            ORGANIZATION DASHBOARD (protected + guard)
            ============================================ */}
        <Route element={<OrgGuard />}>
          <Route path="/org" element={<OrganizationLayout />}>
            <Route index element={<Navigate to="/org/dashboard" replace />} />
            <Route path="dashboard" element={<OrgDashboardPage />} />
            <Route path="products" element={<OrgProductsPage />} />
            <Route path="products/:id" element={<OrgProductDetailsPage />} />
            <Route path="orders" element={<OrgOrdersPage />} />
            <Route path="orders/:id" element={<OrgOrderDetailsPage />} />
            <Route path="notifications" element={<OrgNotificationsPage />} />
            <Route path="profile" element={<OrgProfilePage />} />
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="*" element={<Navigate to="/org/dashboard" replace />} />
          </Route>
        </Route>

        {/* ============================================
            MAIN APP ROUTES — may SiteLayout
            ============================================ */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* ✅ CHECKOUT ROUTES */}
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

        {/* ============================================
            ADMIN DASHBOARD (protected)
            ============================================ */}
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

        {/* ============================================
            FALLBACK
            ============================================ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}