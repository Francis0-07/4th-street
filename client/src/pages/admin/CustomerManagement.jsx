import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, TrendingUp, DollarSign, Search, Filter, Edit, Lock, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/customers', {
          headers: { token: localStorage.token }
        });
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#0e121b] font-sans">
      <div className="flex h-screen w-full overflow-hidden">
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f6f8] relative">
          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-[1400px] flex flex-col gap-8">
              
              {/* Page Heading */}
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-[#0e121b] tracking-tight mb-1">Customer Management</h2>
                  <p className="text-[#506795] text-sm">View, edit and manage your customer relationships.</p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
                  <UserPlus size={20} />
                  <span>Add New Customer</span>
                </button>
              </header>

              {/* Stats Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm border border-[#e5e7eb]">
                  <div className="flex items-center justify-between">
                    <p className="text-[#506795] text-sm font-medium uppercase tracking-wider">Total Customers</p>
                    <Users className="text-gray-300" size={24} />
                  </div>
                  <div className="flex items-end gap-3 mt-2">
                    <p className="text-[#0e121b] text-3xl font-bold">{customers.length}</p>
                    <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-semibold mb-1">
                      <TrendingUp size={14} />
                      5.2%
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm border border-[#e5e7eb]">
                  <div className="flex items-center justify-between">
                    <p className="text-[#506795] text-sm font-medium uppercase tracking-wider">New This Month</p>
                    <UserPlus className="text-gray-300" size={24} />
                  </div>
                  <div className="flex items-end gap-3 mt-2">
                    <p className="text-[#0e121b] text-3xl font-bold">+12</p>
                    <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-semibold mb-1">
                      <TrendingUp size={14} />
                      12%
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm border border-[#e5e7eb]">
                  <div className="flex items-center justify-between">
                    <p className="text-[#506795] text-sm font-medium uppercase tracking-wider">Average LTV</p>
                    <DollarSign className="text-gray-300" size={24} />
                  </div>
                  <div className="flex items-end gap-3 mt-2">
                    <p className="text-[#0e121b] text-3xl font-bold">$450.00</p>
                    <div className="flex items-center gap-0.5 text-[#506795] bg-gray-100 px-1.5 py-0.5 rounded text-xs font-semibold mb-1">
                      0.0%
                    </div>
                  </div>
                </div>
              </section>

              {/* Filters and Table Container */}
              <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-[#e5e7eb] flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
                  {/* Search */}
                  <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="text-gray-400" size={20} />
                    </div>
                    <input 
                      className="block w-full rounded-lg border-gray-300 bg-white text-[#0e121b] pl-10 pr-4 py-2.5 sm:text-sm focus:border-indigo-600 focus:ring-indigo-600 shadow-sm border outline-none" 
                      placeholder="Search by name, email..." 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {/* Dropdown Filters */}
                  <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="relative min-w-[140px]">
                      <select className="appearance-none block w-full rounded-lg border-gray-300 bg-white text-[#0e121b] pl-3 pr-10 py-2.5 sm:text-sm focus:border-indigo-600 focus:ring-indigo-600 shadow-sm cursor-pointer border outline-none">
                        <option>All Statuses</option>
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>VIP</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        ▼
                      </div>
                    </div>
                    <button className="flex items-center justify-center p-2.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                      <Filter size={20} />
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-gray-50/80">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-[300px]">Customer</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Registration Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">Role</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {loading ? (
                        <tr><td colSpan="5" className="p-6 text-center text-gray-500">Loading...</td></tr>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <tr 
                            key={customer.user_id} 
                            className="group hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/admin/customers/${customer.user_id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="bg-indigo-100 rounded-full size-10 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-sm font-semibold text-[#0e121b] truncate">{customer.name}</p>
                                  <a className="text-xs text-[#506795] hover:text-indigo-600 transition-colors truncate" href={`mailto:${customer.email}`} onClick={(e) => e.stopPropagation()}>{customer.email}</a>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                              {new Date(customer.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#0e121b] text-right font-medium">
                              {customer.is_admin ? <span className="text-indigo-600 font-bold">Admin</span> : 'Customer'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Edit Customer" onClick={(e) => e.stopPropagation()}>
                                  <Edit size={20} />
                                </button>
                                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Reset Password" onClick={(e) => e.stopPropagation()}>
                                  <Lock size={20} />
                                </button>
                                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="More Options" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e7eb]">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium text-[#0e121b]">1</span> to <span className="font-medium text-[#0e121b]">{customers.length}</span> of <span className="font-medium text-[#0e121b]">{customers.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                      Previous
                    </button>
                    <button className="px-3 py-1.5 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerManagement;