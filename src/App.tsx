// src/App.tsx

import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
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
import { useAdminStore } from './store/adminStore';

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

const ALLOWED_ADMINS = [
  'ropu.sengco.sjc@phinmaed.com',
  'javi.borlagdan.sjc@phinmaed.com',
  'leda.lutrania.sjc@phinmaed.com',
  'chpe.villanueva.sjc@phinmaed.com',
  'chdi.lomocso.sjc@phinmaed.com'
];

function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_ADMINS.includes(email.toLowerCase().trim());
}

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
   🚨 STUDENT GUARD (CLEANED UP)
   ✅ Ini-clear ang Admin at Org session
============================================ */
function StudentGuard() {
  const { session, isLoading } = useApp();
  
  const isTestAdmin = sessionStorage.getItem('sjc_test_admin') === 'true';
  const isImpersonating = sessionStorage.getItem('sjc_impersonating') === 'true';
  
  if (isTestAdmin || isImpersonating) {
    return <Outlet />; 
  }

  // 🚨 I-CLEAR ANG ADMIN SESSION KAPAG NASA STUDENT SIDE
  localStorage.removeItem('sjcm_admin_auth');
  localStorage.removeItem('sjc-admin-session');
  
  const savedSession = localStorage.getItem('sjc-session');
  let localUser = null;
  if (savedSession) {
    try { localUser = JSON.parse(savedSession); } catch (e) {}
  }

  // 🚨 KUNG ORGANIZATION, CLEAR LAHAT AT THROW OUT
  if (localUser?.role === 'Organization') {
    localStorage.removeItem('sjc-session');
    localStorage.removeItem('sjcm_org_session');
    localStorage.removeItem('sjc-org-session');
    return <Navigate to="/org/login" replace />;
  }

  if (localUser) {
    return <Outlet />;
  }

  const isMagicLinkAuth = 
    sessionStorage.getItem('sjc_magic_link_auth') === 'true' || 
    window.location.hash.includes('access_token') || 
    window.location.hash.includes('refresh_token');

  if (isLoading || isMagicLinkAuth) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050a16', color: '#fff' }}>Authenticating...</div>;
  }

  if (session) {
    sessionStorage.removeItem('sjc_magic_link_auth');
    if (session.role === 'Organization') {
      return <Navigate to="/org/login" replace />;
    }
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
}

/* ============================================
   🚨 ORG GUARD
============================================ */
function OrgGuard() {
  const { session, isLoading } = useApp();
  
  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  }

  // 🚨 I-CLEAR ANG ADMIN AT STUDENT SESSION KAPAG NASA ORG SIDE
  localStorage.removeItem('sjcm_admin_auth');
  localStorage.removeItem('sjc-admin-session');
  localStorage.removeItem('sjc-session');

  if (!session || session.role !== 'Organization') {
    return <Navigate to="/org/login" replace />;
  }
  
  return <Outlet />;
}

function OrgLoginGuard() {
  const { session, isLoading } = useApp();
  if (isLoading) return null;
  if (session && session.role === 'Organization') return <Navigate to="/org/dashboard" replace />;
  return <Outlet />;
}

/* ============================================
   🚨 ADMIN LOGIN GUARD
============================================ */
function AdminLoginGuard() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      try {
        // 🚨 I-CLEAR ANG STUDENT AT ORG SESSION KAPAG NASA ADMIN LOGIN
        localStorage.removeItem('sjc-session');
        localStorage.removeItem('sjcm_org_session');
        localStorage.removeItem('sjc-org-session');

        const { data: { session } } = await supabase.auth.getSession();
        const currentEmail = session?.user?.email?.toLowerCase().trim();

        if (currentEmail && !currentEmail.endsWith('@phinmaed.com')) {
          await supabase.auth.signOut();
          localStorage.clear();
          if (!cancelled) window.location.replace('/login');
          return;
        }

        if (!cancelled) setIsChecking(false);
      } catch (err) {
        console.error(err);
        if (!cancelled) setIsChecking(false);
      }
    }

    checkUser();
    return () => { cancelled = true; };
  }, []);

  if (isChecking) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050a16', color: '#fff' }}>Verifying secure portal...</div>;
  }
  return <Outlet />;
}

function AdminOtpGuard() {
  return <Outlet />; 
}

/* ============================================
   🚨 ADMIN ROUTE GUARD
============================================ */
function AdminRouteGuard() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { session: adminSession } = useAdminStore();

  useEffect(() => {
    async function checkAdminAccess() {
      // 🚨 I-CLEAR ANG STUDENT AT ORG SESSION KAPAG NASA ADMIN ROUTE
      localStorage.removeItem('sjc-session');
      localStorage.removeItem('sjcm_org_session');
      localStorage.removeItem('sjc-org-session');

      // 1. Check sa localStorage backup
      const savedAuth = localStorage.getItem('sjcm_admin_auth');
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          const backupEmail = parsed?.user?.email;
          if (backupEmail && isAllowedAdminEmail(backupEmail)) {
            setIsAuthorized(true);
            return;
          }
        } catch (e) {}
      }

      // 2. Check sa adminSession store
      if (adminSession) {
        const email = (adminSession as any)?.email || (adminSession as any)?.user?.email || '';
        if (email && isAllowedAdminEmail(email)) {
          setIsAuthorized(true);
          return;
        }
      }

      // 3. Check sa Supabase JWT
      const { data: { session } } = await supabase.auth.getSession();
      const currentEmail = session?.user?.email?.toLowerCase().trim();
      
      if (session && currentEmail && isAllowedAdminEmail(currentEmail)) {
        setIsAuthorized(true);
        return;
      }

      // 4. Throw out
      setIsAuthorized(false);
      window.location.replace('/login');
    }
    
    checkAdminAccess();
  }, [adminSession]);

  if (isAuthorized === null) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Verifying Clearance...</div>;
  }
  
  if (!isAuthorized) return null;
  return <Outlet />;
}

function useIsAuthRoute() {
  const location = useLocation();
  const authPaths = [
    '/login', '/register', '/forgot-password', '/org/login', 
    '/sjcm-internal-portal-2026', '/admin/otp'
  ];
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
            <Route path="/sjcm-internal-portal-2026" element={<AdminLoginPage />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          </Route>

          <Route element={<AdminOtpGuard />}>
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

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );  
}