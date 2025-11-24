import React, { Suspense } from 'react';
const CategoryDictionary = React.lazy(() =>
  import('../../ui-components/imports/CategoryDictionary')
);
const RegionDictionary = React.lazy(() =>
  import('../../ui-components/imports/RegionDictionary')
);
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import SuspenseLoader from '../../shared/components/layout/SuspenseLoader';
// Import interno directo para evitar que PrivateRoute forme parte del contrato público de auth
import PrivateRoute from '../../workspaces/auth/guards/components/PrivateRoute';
import { useAuth } from '../providers';

// Landing Page (carga inmediata para primera impresión)
import { Home } from '../../workspaces/landing';

// 📦 RUTAS PRINCIPALES - LAZY LOADING
const MarketplaceBuyer = React.lazy(() =>
  import('../../workspaces/buyer/marketplace').then(module => ({
    default: module.MarketplaceBuyer,
  }))
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
  import('../../workspaces/supplier/home/components/Home')
);
const MyProducts = React.lazy(() =>
  import('../../workspaces/supplier/my-products/components/MyProducts')
);
const AddProduct = React.lazy(() =>
  import('../../workspaces/supplier/create-product/components/AddProduct')
);
const MyOrdersPage = React.lazy(() =>
  import('../../workspaces/supplier/my-requests/components/MyOrdersPage')
);
// TODO: MarketplaceSupplier component was removed during workspace reorganization
// const MarketplaceSupplier = React.lazy(() =>
//   import('../../domains/supplier').then(module => ({
//     default: module.MarketplaceSupplier,
//   }))
// );
const SupplierOffers = React.lazy(() =>
  import('../../workspaces/supplier/my-offers/components/SupplierOffers')
);

// 📦 PROFILE PAGES - LAZY LOADING
const Profile = React.lazy(() => import('../../domains/profile/pages/Profile'));

// 📦 RUTAS SECUNDARIAS - LAZY LOADING
const BuyerOrders = React.lazy(() =>
  import('../../workspaces/buyer/my-orders').then(module => ({
    default: module.BuyerOrders,
  }))
);
// BuyerPerformance was removed; reuse MarketplaceBuyer for now to keep route functional
const BuyerPerformance = MarketplaceBuyer;
const BuyerOffers = React.lazy(() =>
  import('../../workspaces/buyer/my-offers').then(module => ({
    default: module.BuyerOffers,
  }))
);
// Eliminado: TechnicalSpecs como página propia. Usaremos redirect desde /technicalspecs a la ruta unificada.
const ProviderCatalog = React.lazy(() =>
  import('../../domains/marketplace/pages/ProviderCatalog')
);
const ProductPageWrapper = React.lazy(() =>
  import('../../workspaces/product/product-page-view/ProductPageWrapper')
);

// 📦 AUTH & ONBOARDING - LAZY LOADING
const Login = React.lazy(() =>
  import('../../workspaces/auth').then(module => ({ default: module.Login }))
);
const Register = React.lazy(() =>
  import('../../workspaces/auth').then(module => ({ default: module.Register }))
);
const Onboarding = React.lazy(() =>
  import('../../workspaces/auth/onboarding').then(module => ({
    default: module.Onboarding,
  }))
);
const ResetPassword = React.lazy(() =>
  import('../../workspaces/auth/account-recovery/components/ResetPassword')
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
  import('../../workspaces/legal').then(module => ({
    default: module.TermsAndConditionsPage,
  }))
);
const PrivacyPolicyPage = React.lazy(() =>
  import('../../workspaces/legal').then(module => ({
    default: module.PrivacyPolicyPage,
  }))
);

// 📦 AUTH CALLBACK - LAZY LOADING
// AuthCallback también se importa directo para mantener el barrel público mínimo
const AuthCallback = React.lazy(() =>
  import('../../workspaces/auth/login/services/AuthCallback')
);

export const AppRouter = ({ scrollTargets }) => {
  const { session, needsOnboarding, loadingUserStatus, refreshUserProfile } =
    useAuth();

  // Redirect component: legacy /technicalspecs/:productSlug -> /marketplace/product/:id
  const RedirectTechnicalSpecs = () => {
    const { productSlug } = useParams();
    try {
      const {
        extractProductIdFromSlug,
      } = require('../../shared/utils/product/productUrl');
      const id = extractProductIdFromSlug(productSlug);
      if (id) {
        // Try to derive name part after UUID for better SEO, else redirect with just id
        const dashIdx = productSlug.indexOf(id) + id.length;
        const rest = productSlug.slice(dashIdx).replace(/^[-\s\/]+/, '');
        if (rest)
          return <Navigate to={`/marketplace/product/${id}/${rest}`} replace />;
        return <Navigate to={`/marketplace/product/${id}`} replace />;
      }
    } catch (_) {}
    return <Navigate to="/marketplace" replace />;
  };

  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Diccionario de categorías (pública) */}
        <Route
          path="/ui-components/imports/category-dictionary"
          element={<CategoryDictionary />}
        />
        <Route
          path="/ui-components/imports/region-dictionary"
          element={<RegionDictionary />}
        />
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

        {/* Redirect legacy technicalspecs to unified marketplace product route */}
        <Route
          path="/technicalspecs/:productSlug"
          element={<RedirectTechnicalSpecs />}
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
          path="/buyer/offers"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <BuyerOffers />
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
          path="/supplier/offers"
          element={
            <PrivateRoute
              isAuthenticated={!!session}
              needsOnboarding={needsOnboarding}
              loading={loadingUserStatus}
              redirectTo="/"
            >
              <SupplierOffers />
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
        {/* TODO: MarketplaceSupplier route temporarily disabled - component was removed during workspace reorganization */}
        {/* <Route
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
        /> */}
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
