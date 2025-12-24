import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react';
import { formatNaira } from '../utils/formatCurrency';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:5000/orders/${id}`, {
          headers: { token: localStorage.token }
        });
        const data = await response.json();
        if (response.ok) {
            setOrder(data);
        }
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center">Order not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <Link to="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
                <ArrowLeft className="mr-2" size={20} /> Back to Dashboard
            </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Order #{order.order_id}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                    {order.status}
                </span>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Items</h4>
                <ul className="divide-y divide-gray-200 mb-8">
                    {order.items.map((item, index) => (
                        <li key={index} className="py-4 flex">
                            <img className="h-16 w-16 rounded-md object-cover" src={item.image_url} alt={item.name} onError={(e) => { e.target.src = "https://placehold.co/100x100?text=Product"; }} />
                            <div className="ml-4 flex-1">
                                <div className="flex justify-between">
                                    <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                                    <p className="text-sm font-medium text-gray-900">{formatNaira(item.price_at_purchase)}</p>
                                </div>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="border-t border-gray-200 pt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                            <MapPin className="mr-2 h-4 w-4 text-gray-400" /> Shipping Address
                        </h4>
                        <div className="text-sm text-gray-500">
                            <p>{order.shipping_address.fullName}</p>
                            <p>{order.shipping_address.address}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.country} {order.shipping_address.pickupStation || order.shipping_address.postalCode}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                            <CreditCard className="mr-2 h-4 w-4 text-gray-400" /> Payment Summary
                        </h4>
                        <div className="text-sm text-gray-500 flex justify-between max-w-xs">
                            <span>Total Amount:</span>
                            <span className="font-bold text-gray-900">{formatNaira(order.total_amount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;