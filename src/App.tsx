// src/App.tsx

import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

/* ============================================
   ✅ GLOBAL NOTIFICATION LOADER
   - Nag-l-load ng notifications sa buong app
   - FORCE REFRESH — bypass empty cache
   - Naka-subscribe sa real-time updates
   - Auto-cleanup kapag nag-logout
============================================ */
function GlobalNotificationLoader() {
  const { session, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) {
      console.log('[GlobalNotif] ⏳ Waiting for app to finish loading...');
      return;
    }

    if (!session?.id) {
      console.log('[GlobalNotif] ⚠️ No session — resetting notifications');
      useNotificationStore.getState().reset();
      return;
    }

    console.log('[GlobalNotif] 🔔 Loading notifications for user:', session.id);

    // ✅ FORCE REFRESH — bypass empty cache
    void useNotificationStore
      .getState()
      .loadNotifications(session.id, true);   // ← true = force refresh

    // ✅ Subscribe sa real-time updates
    useNotificationStore.getState().subscribeToRealtime(session.id);

    return () => {
      console.log('[GlobalNotif] 🧹 Cleaning up subscription');
      useNotificationStore.getState().unsubscribeFromRealtime();
    };
  }, [session?.id, isLoading]);

  return null;   // Logic lang — walang UI
}

/* ============================================
   ✅ ANIMATED AUTH ROUTES
   Hiwalay na wrapper para sa auth pages lang
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
      </Routes>
    </AnimatePresence>
  );
}

/* ============================================
   ✅ DETECT KUNG AUTH PAGE ANG CURRENT ROUTE
============================================ */
function useIsAuthRoute() {
  const location = useLocation();
  const authPaths = ['/login', '/register', '/forgot-password'];
  return authPaths.some((path) => location.pathname === path);
}

export default function App() {
  const isAuthRoute = useIsAuthRoute();

  /* ✅ Kung nasa auth page, i-render LANG ang animated auth routes */
  if (isAuthRoute) {
    return <AnimatedAuthRoutes />;
  }

  /* ✅ Kung HINDI auth page, normal routes */
  return (
    <>
      {/* ✅ GLOBAL NOTIFICATION LOADER */}
      <GlobalNotificationLoader />

      <Routes>
        {/* ============================================
            ADMIN LOGIN (standalone)
            ============================================ */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

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