import React, { useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/ui/PageTransition';
import ProductCompareBar from '@/components/product/ProductCompareBar';

// Pages
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import CategoriesPage from '@/pages/CategoriesPage';
import CategoryProductsPage from '@/pages/CategoryProductsPage';
import ProductDetailsPage from '@/pages/ProductDetailsPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import WishlistPage from '@/pages/WishlistPage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import AccountPage from '@/pages/AccountPage';
import WholesalePage from '@/pages/WholesalePage';
import ConstructionToolsPage from '@/pages/ConstructionToolsPage';
import OffersPage from '@/pages/OffersPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import SearchResultsPage from '@/pages/SearchResultsPage';
import ProjectsDashboardPage from '@/pages/ProjectsDashboardPage';
import CreateProjectPage from '@/pages/CreateProjectPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import ProjectBOQPage from '@/pages/ProjectBOQPage';
import CostCalculatorPage from '@/pages/CostCalculatorPage';
import EstimatesPage from '@/pages/EstimatesPage';
import EstimateDetailsPage from '@/pages/EstimateDetailsPage';

import AccountSetupPage from '@/pages/AccountSetupPage';

// Admin Architecture & Pages
import AdminRoute from '@/components/admin/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import AdminInventoryPage from '@/pages/admin/AdminInventoryPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminCustomersPage from '@/pages/admin/AdminCustomersPage';
import AdminProjectsPage from '@/pages/admin/AdminProjectsPage';
import AdminBOQsPage from '@/pages/admin/AdminBOQsPage';
import AdminQuotesPage from '@/pages/admin/AdminQuotesPage';
import AdminSuppliersPage from '@/pages/admin/AdminSuppliersPage';
import AdminPricingPage from '@/pages/admin/AdminPricingPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

// Lenis smooth scroll and scroll restoration provider
function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -8 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
      wheelMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Smooth scroll to top on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    // Refresh ScrollTrigger calculations
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return <>{children}</>;
}

const NotFound: React.FC = () => (
  <div className="container-custom py-32 text-center">
    <h1 className="text-6xl font-bold text-primary mb-6">404</h1>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
    </p>
    <Link to="/" className="btn-primary inline-block">
      Return to Home
    </Link>
  </div>
);

function AppContent() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Header />}

      <main className="flex-grow">
        <PageTransition>
          <Routes>
            {/* Public Storefront & Customer Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<CategoryProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/setup" element={<AccountSetupPage />} />
            <Route path="/wholesale" element={<WholesalePage />} />
            <Route path="/tools" element={<ConstructionToolsPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/projects" element={<ProjectsDashboardPage />} />
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/projects/:projectId/boq" element={<ProjectBOQPage />} />
            <Route path="/calculator" element={<CostCalculatorPage />} />
            <Route path="/estimates" element={<EstimatesPage />} />
            <Route path="/estimates/:estimateId" element={<EstimateDetailsPage />} />

            {/* Internal Admin Routes with RBAC Guard & Dedicated Admin Layout */}
            <Route
              path="/admin"
              element={
                <AdminRoute requiredPermission="dashboard.view">
                  <AdminLayout>
                    <AdminOverviewPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute requiredPermission="products.view">
                  <AdminLayout>
                    <AdminProductsPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute requiredPermission="inventory.view">
                  <AdminLayout>
                    <AdminInventoryPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute requiredPermission="orders.view">
                  <AdminLayout>
                    <AdminOrdersPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <AdminRoute requiredPermission="customers.view">
                  <AdminLayout>
                    <AdminCustomersPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <AdminRoute requiredPermission="projects.view">
                  <AdminLayout>
                    <AdminProjectsPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/boqs"
              element={
                <AdminRoute requiredPermission="boq.view">
                  <AdminLayout>
                    <AdminBOQsPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/quotes"
              element={
                <AdminRoute requiredPermission="quotes.view">
                  <AdminLayout>
                    <AdminQuotesPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/suppliers"
              element={
                <AdminRoute requiredPermission="suppliers.view">
                  <AdminLayout>
                    <AdminSuppliersPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <AdminRoute requiredPermission="pricing.view">
                  <AdminLayout>
                    <AdminPricingPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <AdminRoute requiredPermission="reports.view">
                  <AdminLayout>
                    <AdminReportsPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute requiredPermission="settings.manage">
                  <AdminLayout>
                    <AdminSettingsPage />
                  </AdminLayout>
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ProductCompareBar />}
    </div>
  );
}

function App() {
  return (
    <SmoothScrollProvider>
      <AppContent />
    </SmoothScrollProvider>
  );
}

export default App;
