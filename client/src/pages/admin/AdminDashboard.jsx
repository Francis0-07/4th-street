import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, Banknote, Search, Bell, HelpCircle, Calendar, Download, MoreVertical, ArrowUp, Truck, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNaira } from '../../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    products: 0,
    sales: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getDateRangeParams = (range) => {
    const endDate = new Date();
    let startDate = new Date();
    switch (range) {
        case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
        case '30d':
        default:
            startDate.setDate(endDate.getDate() - 30);
            break;
    }
    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/stats`, {
          headers: { token: localStorage.token }
        });
        
        if (response.status === 403) {
            alert("Access Denied: You are not an admin.");
            navigate("/dashboard");
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to fetch stats");
        }

        const data = await response.json();
        setStats(data);

        // Fetch Recent Orders
        const ordersResponse = await fetch(`${API_URL}/admin/orders`, {
            headers: { token: localStorage.token }
        });
        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setRecentOrders(ordersData.slice(0, 5));
        }

        // Fetch Analytics for Chart
        const { startDate, endDate } = getDateRangeParams(dateRange);
        const analyticsResponse = await fetch(`${API_URL}/admin/analytics?startDate=${startDate}&endDate=${endDate}`, {
          headers: { token: localStorage.token }
        });
        if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            const formattedData = analyticsData.sales.map(item => ({
                name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                total: parseFloat(item.total)
            }));
            setChartData(formattedData);
        }
      } catch (err) {
        console.error(err.message);
        alert("Error loading stats: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate, dateRange]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/admin/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Section 1: Summary Stats
    csvContent += "Store Summary\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Revenue,${parseFloat(stats.sales).toFixed(2)}\n`;
    csvContent += `New Orders,${stats.orders}\n`;
    csvContent += `Active Customers,${stats.users}\n`;
    csvContent += `Total Products,${stats.products}\n\n`;


    // Section 2: Recent Orders
    csvContent += "Recent Orders\n";
    csvContent += "Order ID,Customer,Email,Date,Status,Total\n";
    recentOrders.forEach(order => {
        const row = [
            order.order_id,
            `"${order.user_name}"`,
            order.user_email,
            new Date(order.created_at).toLocaleDateString(),
            order.status,
            order.total_amount
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `4th-street_report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#0e121b] font-sans">
      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col h-full relative overflow-hidden bg-[#f6f6f8]">
        
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-white px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4 lg:hidden">
            <span className="font-bold text-lg text-indigo-600">MODERN GENT</span>
          </div>
          <div className="hidden lg:flex w-full max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={20} />
              </div>
              <input 
                className="block w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" 
                placeholder="Search products..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full bg-gray-50 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <button className="rounded-full bg-gray-50 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl flex flex-col gap-8">
            
            {/* Page Heading */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-[#0e121b]">Dashboard Overview</h2>
                <p className="text-[#506795] mt-1">Summary of store performance for {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="appearance-none flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white pl-4 pr-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                  <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  <Download size={20} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {loading ? <p>Loading stats...</p> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/admin/analytics" className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm hover:shadow-md transition-shadow block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#506795]">Total Revenue</p>
                    <Banknote className="text-gray-400" size={24} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#0e121b]">{formatNaira(stats.sales)}</p>
                    <span className="inline-flex items-baseline rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <ArrowUp size={12} className="mr-0.5" />
                      12%

                    </span>
                  </div>
                </Link>
                <Link to="/admin/orders" className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm hover:shadow-md transition-shadow block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#506795]">New Orders</p>
                    <ShoppingBag className="text-gray-400" size={24} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#0e121b]">{stats.orders}</p>
                    <span className="inline-flex items-baseline rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <ArrowUp size={12} className="mr-0.5" />
                      5%
                    </span>
                  </div>
                </Link>
                <Link to="/admin/customers" className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm hover:shadow-md transition-shadow block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#506795]">Active Customers</p>
                    <Users className="text-gray-400" size={24} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#0e121b]">{stats.users}</p>
                    <span className="inline-flex items-baseline rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <ArrowUp size={12} className="mr-0.5" />
                      2%
                    </span>
                  </div>
                </Link>
                <Link to="/admin/products" className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm hover:shadow-md transition-shadow block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#506795]">Total Products</p>
                    <Package className="text-gray-400" size={24} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#0e121b]">{stats.products}</p>
                    <span className="inline-flex items-baseline rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      On Track
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* Charts & Top Products Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Revenue Chart Placeholder */}
              <div className="lg:col-span-2 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <Link to="/admin/analytics" className="group">
                    <h3 className="text-lg font-bold text-[#0e121b] group-hover:text-indigo-600 transition-colors">Revenue Analytics</h3>
                    <p className="text-sm text-gray-500">Gross earnings over time</p>
                  </Link>
                  <select className="block rounded-lg border-0 bg-gray-50 py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>This Year</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                  axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                                    tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#111827', fontWeight: 600 }}
                                    formatter={(value) => [formatNaira(value), 'Revenue']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>

                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-400">No revenue data available</p>
                        </div>
                    )}
                </div>
              </div>

              {/* Top Selling Products Placeholder */}
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm flex flex-col h-full">
                <Link to="/admin/analytics" className="group mb-6 block">
                    <h3 className="text-lg font-bold text-[#0e121b] group-hover:text-indigo-600 transition-colors">Top Selling Items</h3>
                </Link>
                <div className="flex flex-col gap-4 flex-1">
                  {/* Item 1 */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 bg-cover bg-center" style={{ backgroundImage: 'url("https://placehold.co/100x100?text=Product")' }}></div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="text-sm font-semibold text-[#0e121b]">Merino Wool Sweater</h4>
                      <p className="text-xs text-gray-500">Navy Blue, Medium</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0e121b]">{formatNaira(120)}</p>
                      <p className="text-xs text-gray-500">32 sold</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  {/* Item 2 */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 bg-cover bg-center" style={{ backgroundImage: 'url("https://placehold.co/100x100?text=Product")' }}></div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="text-sm font-semibold text-[#0e121b]">Oxford Shirt</h4>
                      <p className="text-xs text-gray-500">White, Slim Fit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0e121b]">{formatNaira(85)}</p>
                      <p className="text-xs text-gray-500">28 sold</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  {/* Item 3 */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 bg-cover bg-center" style={{ backgroundImage: 'url("https://placehold.co/100x100?text=Product")' }}></div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="text-sm font-semibold text-[#0e121b]">Stretch Chino</h4>
                      <p className="text-xs text-gray-500">Khaki, 32x32</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0e121b]">{formatNaira(95)}</p>
                      <p className="text-xs text-gray-500">24 sold</p>
                    </div>
                  </div>
                  <Link to="/admin/products" className="mt-auto w-full rounded-lg border border-[#e5e7eb] py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 text-center block">
                    View All Products
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Orders Table Placeholder */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
              <div className="border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#0e121b]">Recent Orders</h3>
                <Link to="/admin/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold" scope="col">Order ID</th>
                      <th className="px-6 py-3 font-semibold" scope="col">Customer</th>
                      <th className="px-6 py-3 font-semibold" scope="col">Date</th>
                      <th className="px-6 py-3 font-semibold" scope="col">Status</th>
                      <th className="px-6 py-3 font-semibold text-right" scope="col">Total</th>
                      <th className="px-6 py-3 font-semibold text-center" scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {recentOrders.length === 0 ? (
                        <tr><td colSpan="6" className="p-6 text-center text-gray-500">No recent orders found.</td></tr>
                    ) : (
                        recentOrders.map((order) => (
                            <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-[#0e121b]">#{order.order_id}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {order.user_name ? order.user_name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-[#0e121b]">{order.user_name}</span>
                                    <span className="text-xs text-gray-500">{order.user_email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${order.status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                    {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-[#0e121b]">{formatNaira(order.total_amount)}</td>
                              <td className="px-6 py-4 text-center">
                                <Link to={`/orders/${order.order_id}`} className="text-gray-400 hover:text-indigo-600 inline-block">
                                  <MoreVertical size={20} />
                                </Link>
                              </td>
                            </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;