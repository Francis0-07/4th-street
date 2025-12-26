import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Home } from 'lucide-react';
import { formatNaira } from '../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/orders/${id}`, {
          headers: { token: localStorage.token }
        });
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center">Order not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your order #{order.order_id} has been placed.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
              <Package className="mr-2 h-4 w-4" />
              View Order
            </Link>
            <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              <Home className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Order Details</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                <dd className="mt-1 text-sm text-gray-900">#{order.order_id}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Date Placed</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm font-bold text-gray-900">{formatNaira(order.total_amount)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{order.status}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.shipping_address?.fullName}<br />
                  {order.shipping_address?.address}<br />
                  {order.shipping_address?.city}, {order.shipping_address?.country}<br />
                  Pickup: {order.shipping_address?.pickupStation}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
