import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import SuspenseLoader from '../../shared/components/layout/SuspenseLoader';
// Import interno directo para evitar que PrivateRoute forme parte del contrato público de auth
import PrivateRoute from '../../domains/auth/components/PrivateRoute';
import { useAuth } from '../providers/AuthProvider';

// Landing Page (carga inmediata para primera impresión)
import { Home } from '../../app/pages/landing';

// 📦 RUTAS PRINCIPALES - LAZY LOADING
const MarketplaceBuyer = React.lazy(() =>
  import('../../domains/buyer/pages/MarketplaceBuyer')
);
const Marketplace = React.lazy(() =>
  import('../../domains/marketplace/pages/Marketplace')
);
const BuyerCart = React.lazy(() =>
  import('../../domains/buyer/pages/BuyerCart')
);
const PaymentMethod = React.lazy(() =>
  import('../../domains/checkout/pages/PaymentMethod')
);
const CheckoutSuccess = React.lazy(() =>
  import('../../domains/checkout/pages/CheckoutSuccess')
);
const CheckoutCancel = React.lazy(() =>
  import('../../domains/checkout/pages/CheckoutCancel')
);

// 📦 SUPPLIER DASHBOARD - LAZY LOADING
const ProviderHome = React.lazy(() =>
  import('../../domains/supplier/pages/home/ProviderHome')
);
const MyProducts = React.lazy(() =>
  import('../../domains/supplier/pages/my-products/MyProducts')
);
const AddProduct = React.lazy(() =>
  import('../../domains/supplier/pages/my-products/AddProduct')
);
const MyOrdersPage = React.lazy(() =>
  import('../../domains/supplier/pages/my-orders/MyOrdersPage')
);
const MarketplaceSupplier = React.lazy(() =>
  import('../../domains/supplier/pages/MarketplaceSupplier.jsx')
);

// 📦 PROFILE PAGES - LAZY LOADING
const Profile = React.lazy(() => import('../../domains/profile/pages/Profile'));

// 📦 RUTAS SECUNDARIAS - LAZY LOADING
const BuyerOrders = React.lazy(() =>
  import('../../domains/buyer/pages/BuyerOrders')
);
const BuyerPerformance = React.lazy(() =>
  import('../../domains/buyer/pages/BuyerPerformance')
);
const TechnicalSpecs = React.lazy(() =>
  import('../../domains/ProductPageView/pages/TechnicalSpecs')
);
const ProviderCatalog = React.lazy(() =>
  import('../../domains/marketplace/pages/ProviderCatalog')
);
const ProductPageWrapper = React.lazy(() =>
  import('../../domains/ProductPageView/ProductPageWrapper')
);

// 📦 AUTH & ONBOARDING - LAZY LOADING
const Login = React.lazy(() =>
  import('../../domains/auth').then(module => ({ default: module.Login }))
);
const Register = React.lazy(() =>
  import('../../domains/auth').then(module => ({ default: module.Register }))
);
const Onboarding = React.lazy(() =>
  import('../../app/pages/onboarding/Onboarding')
);
const ResetPassword = React.lazy(() =>
  import('../../domains/auth/components/ResetPassword')
);

// 📦 ERROR PAGES - LAZY LOADING
const NotFound = React.lazy(() =>
  import('../../shared/components/layout/NotFound')
);

// 📦 BAN PAGE - LAZY LOADING
const BannedPage = React.lazy(() =>
  import('../../domains/ban/pages/BanPageView')
);

// 📦 TERMS AND PRIVACY PAGES - LAZY LOADING
const TermsAndConditionsPage = React.lazy(() =>
  import('../../app/pages/legal/TermsAndConditionsPage')
);
const PrivacyPolicyPage = React.lazy(() =>
  import('../../app/pages/legal/PrivacyPolicyPage')
);

// 📦 ADMIN PAGES - LAZY LOADING
const AdminLogin = React.lazy(() =>
  import('../../domains/admin').then(module => ({ default: module.AdminLogin }))
);
const AdminDashboard = React.lazy(() =>
  import('../../domains/admin').then(module => ({
    default: module.AdminDashboard,
  }))
);
const AdminPanelHome = React.lazy(() =>
  import('../../domains/admin').then(module => ({
    default: module.AdminPanelHome,
  }))
);
const AdminMetrics = React.lazy(() =>
  import('../../domains/admin').then(module => ({
    default: module.AdminMetrics,
  }))
);

// 📦 AUTH CALLBACK - LAZY LOADING
// AuthCallback también se importa directo para mantener el barrel público mínimo
const AuthCallback = React.lazy(() =>
  import('../../domains/auth/components/AuthCallback')
);

export const AppRouter = ({ scrollTargets }) => {
  const { session, needsOnboarding, loadingUserStatus, refreshUserProfile } =
    useAuth();

  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Rutas Públicas / Generales */}
        <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
          path="/marketplace/product/:id"
          element={<ProductPageWrapper isLoggedIn={!!session} />}
        />
        <Route
          path="/marketplace/product/:id/:slug"
          element={<ProductPageWrapper isLoggedIn={!!session} />}
        />

        {/* TechnicalSpecs puede ser accedido sin iniciar sesión, si es contenido común */}
        <Route
          path="/technicalspecs/:productSlug"
          element={<TechnicalSpecs isLoggedIn={!!session} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/crear-cuenta" element={<Register />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* RUTAS DE TÉRMINOS Y POLÍTICAS */}
        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditionsPage />}
        />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* RUTAS ADMINISTRATIVAS - ACCESO VISUAL PARA TESTING */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminPanelHome />} />
        <Route path="/admin-panel/dashboard" element={<AdminDashboard />} />
        <Route path="/admin-panel/metrics" element={<AdminMetrics />} />

        {/* Ruta para página de ban (acceso directo para testing) */}
        <Route path="/banned" element={<BannedPage />} />

        {/* Ruta para testing de 404 (solo desarrollo) */}
        <Route path="/404" element={<NotFound />} />

        {/* Ruta de callback de autenticación Supabase */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Todas estas rutas están ahora protegidas SÓLO por autenticación y onboarding */}
        <Route
          path="/onboarding"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <Onboarding />
            </PrivateRoute>
          }
        />

        {/* RUTAS DEL DASHBOARD DEL COMPRADOR - Ahora protegidas por PrivateRoute */}
        <Route
          path="/buyer/marketplace"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <MarketplaceBuyer />
            </PrivateRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <BuyerOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/buyer/performance"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <BuyerPerformance />
            </PrivateRoute>
          }
        />
        <Route
          path="/buyer/cart"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <BuyerCart />
            </PrivateRoute>
          }
        />

        {/* RUTA DEL CHECKOUT - MÉTODO DE PAGO */}
        <Route
          path="/buyer/paymentmethod"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <PaymentMethod />
            </PrivateRoute>
          }
        />

        {/* RUTA DEL CHECKOUT - ÉXITO */}
        <Route
          path="/checkout/success"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <CheckoutSuccess />
            </PrivateRoute>
          }
        />

        {/* RUTA DEL CHECKOUT - CANCELACIÓN */}
        <Route
          path="/checkout/cancel"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <CheckoutCancel />
            </PrivateRoute>
          }
        />

        {/* RUTA DEL CATÁLOGO DEL PROVEEDOR - Protegida por PrivateRoute */}
        <Route
          path="/catalog/:userNm/:userId"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <ProviderCatalog />
            </PrivateRoute>
          }
        />

        {/* RUTAS DEL DASHBOARD DEL PROVEEDOR - Ya protegidas por PrivateRoute */}
        <Route
          path="/supplier/home"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <ProviderHome />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/myproducts"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <MyProducts />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/addproduct"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <AddProduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/my-orders"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <MyOrdersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/profile"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <Profile onProfileUpdated={refreshUserProfile} />
            </PrivateRoute>
          }
        />
        {/* Marketplace para el proveedor: igual que el del comprador pero con SideBar de proveedor */}
        <Route
          path="/supplier/marketplace"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <MarketplaceSupplier />
            </PrivateRoute>
          }
        />
        <Route
          path="/buyer/profile"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <Profile onProfileUpdated={refreshUserProfile} />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier/myproducts/product/:productSlug"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <ProductPageWrapper isLoggedIn={!!session} />
            </PrivateRoute>
          }
        />
        {/* Ruta de fallback para rutas no encontradas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
