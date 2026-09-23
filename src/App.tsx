import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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
import AccountPage from '@/pages/AccountPage';
import WholesalePage from '@/pages/WholesalePage';
import ConstructionToolsPage from '@/pages/ConstructionToolsPage';
import OffersPage from '@/pages/OffersPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import SearchResultsPage from '@/pages/SearchResultsPage';
import Button from '@/components/ui/Button';

const NotFound: React.FC = () => (
  <div className="container-custom py-32 text-center">
    <h1 className="text-6xl font-bold text-primary mb-6">404</h1>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
    </p>
    <Link to="/">
      <Button variant="primary">Return to Home</Button>
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow bg-surface min-h-screen">
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
            <Route path="/account" element={<AccountPage />} />
            <Route path="/wholesale" element={<WholesalePage />} />
            <Route path="/tools" element={<ConstructionToolsPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
