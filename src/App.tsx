import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/ui/PageTransition';
import ProductCompareBar from '@/components/product/ProductCompareBar';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Root Landing Page (eager loaded for instant first paint)
import HomePage from '@/pages/HomePage';

// Lazy Loaded Storefront & Customer Pages
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const CategoryProductsPage = lazy(() => import('@/pages/CategoryProductsPage'));
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetailsPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const AccountSetupPage = lazy(() => import('@/pages/AccountSetupPage'));
const WholesalePage = lazy(() => import('@/pages/WholesalePage'));
const RFQListPage = lazy(() => import('@/pages/RFQListPage'));
const RFQDetailPage = lazy(() => import('@/pages/RFQDetailPage'));
const QuoteDetailPage = lazy(() => import('@/pages/QuoteDetailPage'));
const ConstructionToolsPage = lazy(() => import('@/pages/ConstructionToolsPage'));
const OffersPage = lazy(() => import('@/pages/OffersPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'));
const ProjectsDashboardPage = lazy(() => import('@/pages/ProjectsDashboardPage'));
const CreateProjectPage = lazy(() => import('@/pages/CreateProjectPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const ProjectBOQPage = lazy(() => import('@/pages/ProjectBOQPage'));
const CostCalculatorPage = lazy(() => import('@/pages/CostCalculatorPage'));
const EstimatesPage = lazy(() => import('@/pages/EstimatesPage'));
const EstimateDetailsPage = lazy(() => import('@/pages/EstimateDetailsPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));

// Admin Architecture & Lazy Loaded Pages
import AdminRoute from '@/components/admin/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminProjectsPage = lazy(() => import('@/pages/admin/AdminProjectsPage'));
const AdminBOQsPage = lazy(() => import('@/pages/admin/AdminBOQsPage'));
const AdminEstimatesPage = lazy(() => import('@/pages/admin/AdminEstimatesPage'));
const AdminQuotesPage = lazy(() => import('@/pages/admin/AdminQuotesPage'));
const AdminSuppliersPage = lazy(() => import('@/pages/admin/AdminSuppliersPage'));
const AdminPricingPage = lazy(() => import('@/pages/admin/AdminPricingPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

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

const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-accent rounded-full animate-spin mb-3" />
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
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
          <Suspense fallback={<PageFallback />}>
            <Routes>
            {/* Public Storefront & Customer Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<CategoryProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/setup" element={<AccountSetupPage />} />
            <Route path="/wholesale" element={<WholesalePage />} />
            <Route path="/rfqs" element={<RFQListPage />} />
            <Route path="/rfqs/:rfqId" element={<RFQDetailPage />} />
            <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
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
              path="/admin/categories"
              element={
                <AdminRoute requiredPermission="categories.view">
                  <AdminLayout>
                    <AdminCategoriesPage />
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
              path="/admin/payments"
              element={
                <AdminRoute requiredPermission="payments.view">
                  <AdminLayout>
                    <AdminPaymentsPage />
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
              path="/admin/estimates"
              element={
                <AdminRoute requiredPermission="estimates.view">
                  <AdminLayout>
                    <AdminEstimatesPage />
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
          </Suspense>
        </PageTransition>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ProductCompareBar />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SmoothScrollProvider>
        <AppContent />
      </SmoothScrollProvider>
    </ErrorBoundary>
  );
}

export default App;
