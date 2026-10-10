// src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './layout/SiteLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import VerifyEmailPage from './pages/VerifyEmailPage'; // ✅ IDAGDAG
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

export default function App() {
  return (
    <Routes>
      {/* ============================================
          AUTH ROUTES (public)
          ============================================ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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

        {/* ✅ Success Page (after PayMongo payment) */}
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

        {/* ✅ Cancel Page */}
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

        {/* ✅ NEW — Verify Email Page (after order placed) */}
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
  );
}