import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Tag, BarChart, Settings, ShieldCheck, RotateCcw } from 'lucide-react';

const AdminLayout = ({ setAuth }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/user", {
          headers: { token: localStorage.token }
        });
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error(err.message);
      }
    };
    fetchUser();
  }, []);

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setAuth(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold font-serif">4th-street Admin</h1>
          {user?.is_super_admin && (
            <div className="mt-2 inline-block px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded shadow-sm">
              Super Admin
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {/* Helper to check permissions */}
          {(() => {
            const hasPermission = (key) => user?.is_super_admin || (user?.permissions && user.permissions[key]);
            return (
              <>
                {hasPermission('viewReports') && (
                  <Link to="/admin" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname === '/admin' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <LayoutDashboard className="mr-3" size={20} /> Dashboard
                  </Link>
                )}
                {hasPermission('manageProducts') && (
                  <Link to="/admin/products" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/products') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <Package className="mr-3" size={20} /> Products
                  </Link>
                )}
                {hasPermission('processOrders') && (
                  <Link to="/admin/orders" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/orders') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <ShoppingBag className="mr-3" size={20} /> Orders
                  </Link>
                )}
                {hasPermission('processOrders') && (
                  <Link to="/admin/returns" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/returns') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <RotateCcw className="mr-3" size={20} /> Returns
                  </Link>
                )}
                {hasPermission('managePromotions') && (
                  <Link to="/admin/promotions" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/promotions') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <Tag className="mr-3" size={20} /> Promotions
                  </Link>
                )}
                {hasPermission('viewReports') && (
                  <Link to="/admin/analytics" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/analytics') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <BarChart className="mr-3" size={20} /> Analytics
                  </Link>
                )}
              </>
            );
          })()}

          <Link to="/admin/customers" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/customers') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Users className="mr-3" size={20} /> Customers
          </Link>
          {/* Only show Roles & Permissions to Super Admins (or specific email) */}
          {user?.is_super_admin && (
            <Link to="/admin/roles" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/roles') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <ShieldCheck className="mr-3" size={20} /> Roles & Permissions
            </Link>
          )}
          <Link to="/admin/settings" className={`flex items-center px-4 py-3 rounded-md transition ${location.pathname.startsWith('/admin/settings') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Settings className="mr-3" size={20} /> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-white transition">
            <LogOut className="mr-3" size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;