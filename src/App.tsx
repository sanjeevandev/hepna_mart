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

function App() {
  return (
    <SmoothScrollProvider>
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">
          <PageTransition>
            <Routes>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </main>

        <Footer />
        <ProductCompareBar />
      </div>
    </SmoothScrollProvider>
  );
}

export default App;
