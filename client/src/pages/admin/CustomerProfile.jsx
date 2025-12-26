import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, User, Mail, Phone, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    role_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { token: localStorage.token };

        // Fetch Current User to check permissions
        const userRes = await fetch(`${API_URL}/user`, { headers });
        const userData = await userRes.json();
        if (userRes.ok) setCurrentUser(userData);
        
        // 1. Fetch Customer Details
        const customerRes = await fetch(`${API_URL}/admin/customers/${id}`, { headers });
        const customerData = await customerRes.json();
        
        if (customerRes.ok) {
            setCustomer(customerData.customer);
            setOrders(customerData.orders);
            setFormData({
                name: customerData.customer.name,
                email: customerData.customer.email,
                phone_number: customerData.customer.phone_number || '',
                role_id: customerData.customer.is_admin ? 'ADMIN' : (customerData.customer.role_id || '')
            });
        }

        // 2. Fetch Available Roles
        const rolesRes = await fetch(`${API_URL}/roles`, { headers });
        const rolesData = await rolesRes.json();
        if (rolesRes.ok) {
            setRoles(rolesData);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const payload = { ...formData };
        
        if (payload.role_id === 'ADMIN') {
            payload.is_admin = true;
            payload.role_id = null;
        } else {
            if (payload.role_id && payload.role_id !== "") {
                payload.is_admin = true;
            } else {
                payload.is_admin = false;
                payload.role_id = null;
            }
        }

        const response = await fetch(`${API_URL}/admin/customers/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                token: localStorage.token 
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Customer updated successfully");
            const updated = await response.json();
            setCustomer(updated);
        } else {
            alert("Failed to update customer");
        }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!customer) return <div className="p-8">Customer not found</div>;

  return (
    <div className="p-8">
      <button onClick={() => navigate('/admin/customers')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={20} className="mr-2" /> Back to Customers
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Edit Form */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    name="phone_number" 
                                    value={formData.phone_number} 
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                            </div>
                        </div>
                        
                        {/* Role Selection */}
                        {currentUser?.is_super_admin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select 
                                    name="role_id" 
                                    value={formData.role_id} 
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <option value="">No Role (Standard User)</option>
                                    <option value="ADMIN">Admin (Full Access)</option>
                                    {roles.map(role => (
                                        <option key={role.role_id} value={role.role_id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <Save size={18} className="mr-2" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* Order History Sidebar (Read Only) */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-4">Order History</h3>
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <p className="text-gray-500 text-sm">No orders found.</p>
                    ) : orders.map(order => (
                        <div key={order.order_id} className="border-b border-gray-100 pb-3 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">#{order.order_id}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                <span>${order.total_amount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;