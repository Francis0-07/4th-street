import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  CreditCard, 
  Heart, 
  Settings, 
  LogOut, 
  Edit, 
  ChevronRight,
  Award, 
  Truck, 
  Wallet,
  Plus,
  Trash2,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';
import { formatNaira } from '../utils/formatCurrency';

const JUMIA_STATIONS = [
    "Ikeja - 123 Allen Avenue",
    "Lekki - 45 Admiralty Way",
    "Yaba - 20 Commercial Road",
    "Surulere - 15 Ojuelegba Road",
    "Victoria Island - 10 Ozumba Mbadiwe",
    "Abuja Central - 5 Garki Area",
    "Port Harcourt - 8 Aba Road",
    "Ibadan - 30 Trans Amadi"
];

const Dashboard = ({ setAuth }) => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const location = useLocation();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [activeOrderTab, setActiveOrderTab] = useState('All Orders');

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  });

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setAuth(false);
    navigate("/login");
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch("http://localhost:5000/wishlist", {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      if (Array.isArray(data)) setWishlist(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await fetch(`http://localhost:5000/wishlist/${productId}`, {
        method: "DELETE",
        headers: { token: localStorage.token }
      });
      fetchWishlist();
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("http://localhost:5000/addresses", {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      if (Array.isArray(data)) setAddresses(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { token: localStorage.token };
        
        const userRes = await fetch("http://localhost:5000/user", { headers });
        const userData = await userRes.json();
        setUser(userData);

        const ordersRes = await fetch("http://localhost:5000/orders", { headers });
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) setOrders(ordersData);
        
        // Initial wishlist fetch
        const wishlistRes = await fetch("http://localhost:5000/wishlist", { headers });
        const wishlistData = await wishlistRes.json();
        if (Array.isArray(wishlistData)) setWishlist(wishlistData);

        // Initial addresses fetch
        const addressesRes = await fetch("http://localhost:5000/addresses", { headers });
        const addressesData = await addressesRes.json();
        if (Array.isArray(addressesData)) setAddresses(addressesData);

        // Fetch Points History
        const pointsRes = await fetch("http://localhost:5000/user/points-history", { headers });
        const pointsData = await pointsRes.json();
        if (Array.isArray(pointsData)) setPointsHistory(pointsData);

      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/user", {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify({ name: user.name, phone: user.phone_number })
      });
      
      if (response.ok) {
          alert("Profile updated successfully");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/user", {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify({ 
            currentPassword: passwordForm.currentPassword, 
            newPassword: passwordForm.newPassword 
        })
      });
      
      const parseRes = await response.json();
      
      if (response.ok) {
          alert(parseRes);
          setPasswordForm({ currentPassword: '', newPassword: '' });
          setShowPasswordChange(false);
      } else {
          alert(parseRes);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!localStorage.token) {
        alert("You are not logged in.");
        return;
      }

      const response = await fetch("http://localhost:5000/addresses", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify(addressForm)
      });
      
      if (response.ok) {
          alert("Address added successfully");
          setAddressForm({ full_name: '', address_line1: '', city: '', state: '', postal_code: '', country: '', is_default: false });
          setShowAddressForm(false);
          fetchAddresses();
      } else {
          const errorText = await response.text();
          alert("Failed to save address: " + errorText);
      }
    } catch (err) {
      console.error(err.message);
      alert("Error saving address: " + err.message);
    }
  };

  const deleteAddress = async (id) => {
    if(!window.confirm("Are you sure you want to delete this address?")) return;
    try {
        await fetch(`http://localhost:5000/addresses/${id}`, {
            method: "DELETE",
            headers: { token: localStorage.token }
        });
        fetchAddresses();
    } catch (err) {
        console.error(err.message);
    }
  };

  // Refresh wishlist when tab becomes active
  useEffect(() => {
    if (activeTab === 'wishlist') {
        fetchWishlist();
    }
    if (activeTab === 'addresses') {
        fetchAddresses();
    }
  }, [activeTab]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  const activeOrdersCount = orders.filter(o => 
    o.status !== 'delivered' && 
    o.status !== 'cancelled' && 
    o.status !== 'returned' &&
    o.status !== 'return_requested' &&
    o.status !== 'return_approved'
  ).length;

  // Calculate points earned this month
  const pointsThisMonth = orders.reduce((acc, order) => {
    const orderDate = new Date(order.created_at);
    const now = new Date();
    if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
        return acc + Math.floor(Number(order.total_amount) / 10);
    }
    return acc;
  }, 0);

  const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_id.toString().includes(orderSearchTerm) || 
                          order.status.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    let matchesTab = true;
    if (activeOrderTab === 'Processing') matchesTab = order.status === 'paid' || order.status === 'processing';
    else if (activeOrderTab === 'Shipped') matchesTab = order.status === 'shipped';
    else if (activeOrderTab === 'Delivered') matchesTab = order.status === 'delivered';
    
    return matchesSearch && matchesTab;
  });

const OrderProgressBar = ({ status }) => {
    const steps = ['paid', 'shipped', 'delivered'];
    const currentStepIndex = steps.indexOf(status);

    if (currentStepIndex === -1) {
        if (['return_requested', 'return_approved'].includes(status)) {
            return <div className="text-sm text-yellow-600 font-medium mt-2">Return in progress...</div>;
        }
        if (['returned', 'cancelled'].includes(status)) {
            return <div className="text-sm text-gray-500 font-medium mt-2">Order {status}.</div>;
        }
        return null; // For 'pending' or other statuses
    }

    return (
        <div className="w-full my-4">
            <div className="flex justify-between mb-2 text-xs font-medium text-gray-500">
                <span className={currentStepIndex >= 0 ? 'text-indigo-600' : ''}>Processing</span>
                <span className={currentStepIndex >= 1 ? 'text-indigo-600' : ''}>Shipped</span>
                <span className={currentStepIndex >= 2 ? 'text-indigo-600' : ''}>Delivered</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full">
                <div 
                    className="absolute top-0 left-0 h-2 bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                ></div>
            </div>
        </div>
    );
};

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#111621] font-sans antialiased">
      {/* Breadcrumbs Header */}
      <div className="w-full bg-white border-b border-[#e5e7eb]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-500">
            <Link to="/" className="hover:text-[#194cb3] transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#111621] font-medium">My Account</span>
          </nav>
        </div>
      </div>

      <main className="flex-grow max-w-[1280px] mx-auto w-full px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-8">
              {/* User Snippet */}
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-full bg-[#194cb3]/10 flex items-center justify-center text-[#194cb3] text-xl font-bold border border-[#194cb3]/20">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <h3 className="font-bold text-[#111621]">{user?.name}</h3>
                  <p className="text-xs text-[#194cb3] font-medium uppercase tracking-wider">Member</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left group ${activeTab === 'dashboard' ? 'bg-[#194cb3] text-white shadow-md shadow-[#194cb3]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <LayoutDashboard size={20} className={activeTab === 'dashboard' ? '' : 'group-hover:text-[#194cb3] transition-colors'} />
                  <span className="font-medium">Dashboard</span>
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left group ${activeTab === 'orders' ? 'bg-[#194cb3] text-white shadow-md shadow-[#194cb3]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Package size={20} className={activeTab === 'orders' ? '' : 'group-hover:text-[#194cb3] transition-colors'} />
                  <span className="font-medium">My Orders</span>
                </button>
                <button 
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left group ${activeTab === 'addresses' ? 'bg-[#194cb3] text-white shadow-md shadow-[#194cb3]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <MapPin size={20} className={activeTab === 'addresses' ? '' : 'group-hover:text-[#194cb3] transition-colors'} />
                  <span className="font-medium">Addresses</span>
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left group ${activeTab === 'payments' ? 'bg-[#194cb3] text-white shadow-md shadow-[#194cb3]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <CreditCard size={20} className={activeTab === 'payments' ? '' : 'group-hover:text-[#194cb3] transition-colors'} />
                  <span className="font-medium">Payment Methods</span>
                </button>
                <button 
                  onClick={() => setActiveTab('wishlist')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left group ${activeTab === 'wishlist' ? 'bg-[#194cb3] text-white shadow-md shadow-[#194cb3]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Heart size={20} className={activeTab === 'wishlist' ? '' : 'group-hover:text-[#194cb3] transition-colors'} />
                  <span className="font-medium">Wishlist</span>
                </button>
                <div className="h-px bg-gray-200 my-2 mx-4"></div>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left group ${activeTab === 'settings' ? 'bg-[#194cb3] text-white shadow-md shadow-[#194cb3]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Settings size={20} className={activeTab === 'settings' ? '' : 'group-hover:text-[#194cb3] transition-colors'} />
                  <span className="font-medium">Settings</span>
                </button>
                
                {/* Admin Link - Only visible if user is admin */}
                {user?.is_admin && (
                  <Link to="/admin/roles" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors w-full text-left group">
                    <ShieldCheck size={20} className="group-hover:text-[#194cb3] transition-colors" />
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                )}

                <button 
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left group"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
                  <div>
                    <h1 className="text-3xl font-bold text-[#111621] tracking-tight mb-2">Hello, {user?.name.split(' ')[0]}</h1>
                    <p className="text-gray-500">Welcome back to your account dashboard. Here's what's happening.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium text-white transition-colors bg-[#194cb3] rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#194cb3]"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-white rounded-xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-[#194cb3]">
                        <Award size={24} />
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">+{pointsThisMonth} this month</span>
                    </div>
                    <p className="text-3xl font-bold text-[#111621] mb-1">{user?.loyalty_points || 0}</p>
                    <p className="text-sm text-gray-500">Loyalty Points Available</p>
                    <button onClick={() => setShowPointsModal(true)} className="text-xs text-[#194cb3] hover:underline mt-1 inline-block">View History</button>
                  </div>
                  <div className="p-5 bg-white rounded-xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-[#194cb3]">
                        <Truck size={24} />
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">In Progress</span>
                    </div>
                    <p className="text-3xl font-bold text-[#111621] mb-1">{activeOrdersCount}</p>
                    <p className="text-sm text-gray-500">Active Orders</p>
                  </div>
                  <div className="p-5 bg-white rounded-xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-[#194cb3]">
                        <Wallet size={24} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#111621] mb-1">{formatNaira(0)}</p>
                    <p className="text-sm text-gray-500">Store Credit Balance</p>
                  </div>
                </div>

                {/* Recent Orders Section */}
                <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#e5e7eb] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#111621]">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-sm font-medium text-[#194cb3] hover:text-blue-700">View All Orders</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 font-medium">
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Total</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {orders.slice(0, 3).map(order => (
                          <tr key={order.order_id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-medium text-[#111621]">#{order.order_id}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'delivered' ? 'bg-green-600' : 'bg-blue-600'}`}></span>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-[#111621]">{formatNaira(order.total_amount)}</td>
                            <td className="px-6 py-4 text-right">
                              <Link to={`/orders/${order.order_id}`} className="text-gray-400 hover:text-[#194cb3] transition-colors">
                                <ChevronRight size={20} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Personal Info & Address Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profile Card */}
                  <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="font-bold text-[#111621] text-lg">Personal Information</h3>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="p-2 hover:bg-gray-100 rounded-full text-[#194cb3] transition-colors"
                      >
                        <Edit size={20} />
                      </button>
                    </div>
                    <div className="space-y-4 flex-grow">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                        <p className="text-[#111621] font-medium">{user?.name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                        <p className="text-[#111621] font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                        <p className={`font-medium ${user?.phone_number ? 'text-[#111621]' : 'text-gray-400 italic'}`}>{user?.phone_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 flex flex-col h-full relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6 z-10">
                      <h3 className="font-bold text-[#111621] text-lg">Default Address</h3>
                      <button 
                        onClick={() => setActiveTab('addresses')}
                        className="text-sm font-medium text-[#194cb3] hover:text-blue-700"
                      >
                        Manage
                      </button>
                    </div>
                    <div className="flex-grow z-10">
                      {defaultAddress ? (
                        <>
                          <div className="inline-block px-2 py-1 mb-4 text-xs font-medium text-green-800 bg-green-100 rounded">
                            {defaultAddress.is_default ? 'Default Shipping' : 'Recent Address'}
                          </div>
                          <address className="not-italic text-gray-600 space-y-1">
                            <p className="font-medium text-[#111621]">{defaultAddress.full_name}</p>
                            <p>{defaultAddress.address_line1}</p>
                            <p>{defaultAddress.city}, {defaultAddress.state}</p>
                            <p className="text-sm text-gray-500 mt-1">Pickup Station: {defaultAddress.postal_code}</p>
                            <p>{defaultAddress.country}</p>
                          </address>
                        </>
                      ) : (
                        <address className="not-italic text-gray-600 space-y-1">
                          <p className="font-medium text-[#111621]">{user?.name}</p>
                          <p className="text-gray-400 italic">No address saved</p>
                        </address>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'orders' && (
               <div className="space-y-8">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
                    <div>
                        <h1 className="text-3xl font-bold text-[#111621] tracking-tight mb-2">Order History</h1>
                        <p className="text-gray-500">Track current shipments and review past purchases.</p>
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        {['All Orders', 'Processing', 'Shipped', 'Delivered'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveOrderTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                                    activeOrderTab === tab 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'text-gray-600 bg-white border border-[#e5e7eb] hover:bg-gray-50'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-72 group">
                        <input 
                            className="pl-4 pr-4 py-2 w-full bg-white border border-[#e5e7eb] focus:border-[#194cb3] focus:ring-1 focus:ring-[#194cb3] rounded-md text-sm transition-all placeholder-gray-500" 
                            placeholder="Search by Order ID or Status" 
                            type="text"
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                        />
                    </div>
                 </div>

                 <div className="space-y-6">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-[#e5e7eb]">
                            <p className="text-gray-500">No orders found matching your search.</p>
                        </div>
                    ) : filteredOrders.map((order) => (
                        <div key={order.order_id} className={`border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 ${order.status === 'returned' ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-white border-[#e5e7eb]'}`}>
                            <div className={`px-6 py-4 border-b flex flex-wrap gap-y-4 justify-between items-center text-sm ${order.status === 'returned' ? 'bg-slate-100 border-slate-200' : 'bg-gray-50 border-[#e5e7eb]'}`}>
                                <div className="flex gap-x-8 gap-y-2 flex-wrap">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Order Placed</p>
                                        <p className="font-medium text-[#111621]">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                                        <p className="font-medium text-[#111621]">{formatNaira(order.total_amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Order #</p>
                                        <p className="font-medium text-[#111621]">ORD-{order.order_id}</p>
                                    </div>
                                    {order.status === 'return_approved' && (
                                        <div className="bg-green-50 border border-green-200 rounded px-3 py-1">
                                            <p className="text-xs font-bold text-green-700">RETURN APPROVED</p>
                                        </div>
                                    )}
                                    {order.status === 'returned' && (
                                        <div className="bg-slate-200 border border-slate-300 rounded px-3 py-1">
                                            <p className="text-xs font-bold text-slate-600">RETURNED</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                    <span className="text-xs text-gray-500">View Invoice</span>
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    <Link to={`/orders/${order.order_id}`} className="font-medium text-[#194cb3] hover:text-blue-800 hover:underline">View Order Details</Link>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6 md:justify-between md:items-start">
                                    <div className="flex-grow space-y-4">
                                        <h3 className={`font-bold text-lg capitalize ${order.status === 'returned' ? 'text-slate-500' : 'text-[#111621]'}`}>{order.status.replace('_', ' ')}</h3>
                                        <OrderProgressBar status={order.status} />
                                            <span className="text-sm text-gray-500 ml-1">
                                                {order.status === 'delivered' ? `Delivered on ${new Date(order.created_at).toLocaleDateString()}` : 'Estimated delivery soon'}
                                            </span>
                                            {order.status === 'return_approved' && (
                                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                                                    <p className="font-bold flex items-center gap-1"><Info size={14}/> Return Instructions:</p>
                                                    <p>Please ship items to: <strong>123 Fashion Ave, NY 10012</strong>. Include Order #{order.order_id} in the box.</p>
                                                </div>
                                            )}
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 min-w-[160px]">
                                        <button className={`flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium text-white border border-transparent rounded-lg transition-colors shadow-sm ${order.status === 'returned' ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#194cb3] hover:bg-blue-700'}`} disabled={order.status === 'returned'}>
                                            Track Package
                                        </button>
                                        {order.status !== 'returned' && order.status !== 'return_requested' && order.status !== 'return_approved' && (
                                            <Link to={`/return/${order.order_id}`} className="flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition-colors">
                                                Return Item
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
               </div>
            )}

            {activeTab === 'addresses' && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#111621]">Saved Addresses</h3>
                        <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm font-medium text-[#194cb3] hover:text-blue-700 flex items-center gap-1">
                            <Plus size={16} /> Add New
                        </button>
                    </div>

                    {showAddressForm && (
                        <form onSubmit={handleAddressSubmit} className="mb-8 p-4 border border-[#e5e7eb] rounded-lg bg-gray-50">
                            <h4 className="text-sm font-bold text-[#111621] mb-4">New Address</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input required type="text" placeholder="Full Name" value={addressForm.full_name} onChange={(e) => setAddressForm({...addressForm, full_name: e.target.value})} className="p-2 border border-gray-300 rounded text-sm" />
                                <input required type="text" placeholder="Address Line 1" value={addressForm.address_line1} onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})} className="p-2 border border-gray-300 rounded text-sm" />
                                <input required type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="p-2 border border-gray-300 rounded text-sm" />
                                <input type="text" placeholder="State/Province" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} className="p-2 border border-gray-300 rounded text-sm" />
                                <select required value={addressForm.postal_code} onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})} className="p-2 border border-gray-300 rounded text-sm">
                                    <option value="">Select Pickup Station</option>
                                    {JUMIA_STATIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <input required type="text" placeholder="Country" value={addressForm.country} onChange={(e) => setAddressForm({...addressForm, country: e.target.value})} className="p-2 border border-gray-300 rounded text-sm" />
                            </div>
                            <div className="flex items-center mb-4">
                                <input type="checkbox" id="is_default" checked={addressForm.is_default} onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})} className="mr-2" />
                                <label htmlFor="is_default" className="text-sm text-gray-700">Set as default address</label>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-[#194cb3] text-white text-sm font-medium rounded hover:bg-blue-700">Save Address</button>
                                <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50">Cancel</button>
                            </div>
                        </form>
                    )}

                    {addresses.length === 0 ? (
                        <div className="p-4 border border-[#e5e7eb] rounded-lg bg-gray-50 text-center text-gray-500">
                            No addresses saved yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map(addr => (
                                <div key={addr.address_id} className="border border-[#e5e7eb] rounded-lg p-4 relative group hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-[#111621] text-sm">{addr.full_name}</span>
                                        {addr.is_default && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">Default</span>}
                                    </div>
                                    <p className="text-sm text-gray-600">{addr.address_line1}</p>
                                    <p className="text-sm text-gray-600">{addr.city}, {addr.state}</p>
                                    <p className="text-sm text-gray-600">Pickup Station: {addr.postal_code}</p>
                                    <p className="text-sm text-gray-600">{addr.country}</p>
                                    
                                    <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => deleteAddress(addr.address_id)} className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                        {!addr.is_default && (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await fetch(`http://localhost:5000/addresses/${addr.address_id}/default`, {
                                                            method: "PUT",
                                                            headers: { token: localStorage.token }
                                                        });
                                                        fetchAddresses();
                                                    } catch (err) { console.error(err); }
                                                }}
                                                className="text-xs text-[#194cb3] hover:text-blue-800 font-medium"
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#111621]">Payment Methods</h3>
                        <button className="text-sm font-medium text-[#194cb3] hover:text-blue-700">Add New</button>
                    </div>
                    <div className="p-4 border border-[#e5e7eb] rounded-lg bg-gray-50 text-center text-gray-500">
                        No payment methods saved.
                    </div>
                </div>
            )}

            {activeTab === 'wishlist' && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#111621]">My Wishlist</h3>
                    </div>
                    {wishlist.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <Heart className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-[#111621]">Your wishlist is empty</h3>
                            <p className="mt-1 text-gray-500">Save items you want to buy later.</p>
                            <Link to="/shop" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#194cb3] hover:bg-blue-700">Start Shopping</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishlist.map(item => (
                                <div key={item.wishlist_id} className="group relative border border-[#e5e7eb] rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75 h-48">
                                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover object-center" onError={(e) => { e.target.src = "https://placehold.co/200x200?text=Product"; }} />
                                    </div>
                                    <div className="mt-4 flex justify-between">
                                        <div>
                                            <h3 className="text-sm text-gray-700">
                                                <Link to={`/products/${item.product_id}`}>
                                                    <span aria-hidden="true" className="absolute inset-0" />
                                                    {item.name}
                                                </Link>
                                            </h3>
                                            <p className="mt-1 text-sm font-medium text-[#111621]">{formatNaira(item.sale_price || item.price)}</p>
                                        </div>
                                        <button onClick={(e) => { e.preventDefault(); removeFromWishlist(item.product_id); }} className="z-10 text-gray-400 hover:text-red-500"><Trash2 size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <>
                  <div className="border-b border-[#e5e7eb] pb-6">
                    <h1 className="text-3xl font-bold text-[#111621] tracking-tight">Profile Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your personal details and account preferences.</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
                    <form onSubmit={updateProfile} className="divide-y divide-[#e5e7eb]">
                      <div className="p-6 lg:p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-blue-50 rounded-lg text-[#194cb3]">
                            <Edit size={20} />
                          </div>
                          <h2 className="text-lg font-bold text-[#111621]">Personal Information</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">Full Name</label>
                            <input 
                                className="w-full rounded-lg border-gray-300 bg-white text-[#111621] focus:border-[#194cb3] focus:ring-[#194cb3] shadow-sm text-sm py-2.5 transition-colors border outline-none px-3" 
                                id="name" 
                                type="text" 
                                value={user?.name || ''} 
                                onChange={(e) => setUser({...user, name: e.target.value }) }
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">Email Address</label>
                            <input 
                                className="w-full rounded-lg border-gray-300 bg-gray-50 text-gray-500 shadow-sm text-sm py-2.5 transition-colors border outline-none px-3" 
                                id="email" 
                                type="email" 
                                disabled
                                value={user?.email || ''} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">Phone Number</label>
                            <input 
                                className="w-full rounded-lg border-gray-300 bg-white text-[#111621] focus:border-[#194cb3] focus:ring-[#194cb3] shadow-sm text-sm py-2.5 transition-colors border outline-none px-3" 
                                id="phone" 
                                type="tel" 
                                value={user?.phone_number || ''} 
                                onChange={(e) => setUser({...user, phone_number: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 lg:p-8 bg-gray-50 flex flex-col-reverse sm:flex-row items-center gap-4">
                        <button 
                            className="w-full sm:w-auto px-6 py-2.5 bg-[#194cb3] hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#194cb3] shadow-sm shadow-[#194cb3]/30" 
                            type="submit"
                        >
                            Save Changes
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden mt-8">
                    <div className="p-6 lg:p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-blue-50 rounded-lg text-[#194cb3]">
                            <Settings size={20} />
                          </div>
                          <h2 className="text-lg font-bold text-[#111621]">Security & Password</h2>
                        </div>
                        
                        {!showPasswordChange ? (
                            <div className="flex gap-3">
                                <button onClick={() => setShowPasswordChange(true)} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                                    Change Password
                                </button>
                                <button onClick={() => navigate('/forgot-password')} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                                    Forgot Password
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={updatePassword} className="space-y-4 max-w-md bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                                    <input type="password" id="currentPassword" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#194cb3] focus:border-[#194cb3] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                                    <input type="password" id="newPassword" required minLength="8" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#194cb3] focus:border-[#194cb3] sm:text-sm" />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" className="bg-[#194cb3] border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none">Update Password</button>
                                    <button type="button" onClick={() => setShowPasswordChange(false)} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                  </div>
                </>
            )}

          </div>
        </div>
      </main>

      {/* Points History Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Points History</h3>
                    <button onClick={() => setShowPointsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {pointsHistory.length === 0 ? (
                        <p className="text-center text-gray-500">No points activity yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {pointsHistory.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {item.type === 'earned' ? 'Purchase Reward' : 
                                             item.type === 'redeemed' ? 'Redeemed at Checkout' : 'Refunded Points'}
                                        </p>
                                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()} • Order #{item.orderId}</p>
                                    </div>
                                    <span className={`font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <Link to="/loyalty" className="block w-full text-center text-sm text-indigo-600 font-medium hover:underline">View Loyalty Program Benefits</Link>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
