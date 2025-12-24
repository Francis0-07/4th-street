import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderDetails from './pages/OrderDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './pages/admin/AdminLayout';
import ProductManagement from './pages/admin/ProductManagement';
import ProductForm from './pages/admin/ProductForm';
import OrderManagement from './pages/admin/OrderManagement';
import ReturnsManagement from './pages/admin/ReturnsManagement';
import PromotionsManagement from './pages/admin/PromotionsManagement';
import PromotionForm from './pages/admin/PromotionForm';
import Analytics from './pages/admin/Analytics';
import CustomerManagement from './pages/admin/CustomerManagement';
import CustomerProfile from './pages/admin/CustomerProfile';
import Settings from './pages/admin/Settings';
import AdminRoles from './pages/AdminRoles';
import LoyaltyProgram from './pages/LoyaltyProgram';
import ResetPassword from './pages/ResetPassword';
import ReturnItem from './pages/ReturnItem';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const setAuth = (boolean) => {
    setIsAuthenticated(boolean);
    if (boolean) {
      setIsLoading(true);
      isAuth(); // Re-check status (including admin role) on login
    } else {
      setIsAdmin(false);
    }
  };

  // Check if token is valid on page load
  async function isAuth() {
    try {
      if (!localStorage.token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/auth/is-verify", {
        method: "GET",
        headers: { token: localStorage.token }
      });

      const parseRes = await response.json();

      if (parseRes.auth === true) {
        setIsAuthenticated(true);
        setIsAdmin(parseRes.isAdmin);
        setIsSuperAdmin(parseRes.isSuperAdmin);
        setPermissions(parseRes.permissions || {});
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setPermissions({});
      }
    } catch (err) {
      console.error(err.message);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }

  const updateCartCount = async () => {
    if (localStorage.token) {
        try {
            const response = await fetch("http://localhost:5000/cart", {
                headers: { token: localStorage.token }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const count = data.reduce((acc, item) => acc + item.quantity, 0);
                    setCartCount(count);
                }
            }
        } catch (err) { console.error(err); }
    } else {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const count = guestCart.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, [isAuthenticated]);

  // Helper to determine the best landing page for an admin
  const getAdminHome = () => {
    if (isSuperAdmin || permissions.globalAdmin || permissions.viewReports) return "/admin"; // Dashboard
    if (permissions.manageProducts) return "/admin/products";
    if (permissions.processOrders) return "/admin/orders";
    if (permissions.managePromotions) return "/admin/promotions"; // Assuming you might have this
    
    // Fallback if they have no major permissions
    return "/admin/settings"; 
  };

  useEffect(() => {
    isAuth();
  }, []);

  // Show loading spinner while checking auth to prevent premature redirects
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-medium">Loading...</div>;
  }

  // Hide Navbar/Footer on Login and Register pages
  const hideNav = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname.startsWith('/admin');

  return (
      <div className="font-sans text-primary flex flex-col min-h-screen">
        {!hideNav && <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} setAuth={setAuth} cartCount={cartCount} />}
        <Routes>
          <Route 
            path="/" 
            element={<Home />} 
          />
          <Route 
            path="/shop" 
            element={<Shop />} 
          />
          <Route 
            path="/about" 
            element={<About />} 
          />
          <Route 
            path="/loyalty" 
            element={<LoyaltyProgram />} 
          />
          <Route 
            path="/return/:orderId?" 
            element={<ReturnItem />} 
          />
          <Route 
            path="/contact" 
            element={<Contact />} 
          />
          <Route 
            path="/faq" 
            element={<FAQ />} 
          />
          <Route 
            path="/terms" 
            element={<Terms />} 
          />
          <Route 
            path="/privacy" 
            element={<Privacy />} 
          />
          <Route 
            path="/products/:id" 
            element={<ProductDetail />} 
          />
          <Route 
            path="/cart" 
            element={isAuthenticated ? <Cart /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/checkout" 
            element={isAuthenticated ? <Checkout /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/order-confirmation/:id" 
            element={isAuthenticated ? <OrderConfirmation /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/orders/:id" 
            element={isAuthenticated ? <OrderDetails /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login setAuth={setAuth} /> : <Navigate to={isAdmin ? getAdminHome() : "/shop"} />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register setAuth={setAuth} /> : <Navigate to={isAdmin ? getAdminHome() : "/shop"} />} 
          />
          <Route 
            path="/forgot-password" 
            element={<ForgotPassword />} 
          />
          <Route 
            path="/reset-password/:token" 
            element={<ResetPassword />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard setAuth={setAuth} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin"
            element={isAuthenticated && isAdmin ? <AdminLayout setAuth={setAuth} /> : <Navigate to="/login" />}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="promotions" element={<PromotionsManagement />} />
            <Route path="promotions/new" element={<PromotionForm />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="returns" element={<ReturnsManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="roles" element={<AdminRoles />} />
          </Route>
          {/* Default redirect to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        {!hideNav && <Footer />}
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
