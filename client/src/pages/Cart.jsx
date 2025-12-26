import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import RelatedProducts from '../components/RelatedProducts';
import { formatNaira } from '../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchCart = async () => {
    try {
      if (!localStorage.token) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        setCartItems(guestCart);
        calculateTotal(guestCart);
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_URL}/cart`, {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setCartItems(data);
        calculateTotal(data);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (parseFloat(item.sale_price || item.price) * item.quantity), 0);
    setTotal(sum);
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    if (!localStorage.token) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const updatedCart = guestCart.map(item => {
            if (item.cart_item_id === id) return { ...item, quantity: newQuantity };
            return item;
        });
        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        calculateTotal(updatedCart);
        window.dispatchEvent(new Event("cartUpdated"));
        return;
    }

    try {
      await fetch(`${API_URL}/cart/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      fetchCart(); // Refresh cart
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error(err.message);
    }
  };

  const removeItem = async (id) => {
    if (!localStorage.token) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const updatedCart = guestCart.filter(item => item.cart_item_id !== id);
        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        calculateTotal(updatedCart);
        window.dispatchEvent(new Event("cartUpdated"));
        return;
    }

    try {
      await fetch(`${API_URL}/cart/${id}`, {
        method: "DELETE",
        headers: { token: localStorage.token }
      });
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading cart...</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-6">Your cart is empty.</p>
            <Link to="/shop" className="text-indigo-600 font-medium hover:text-indigo-500">Continue Shopping &rarr;</Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            <section className="lg:col-span-7">
              <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.cart_item_id} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-24 h-24 rounded-md object-center object-cover sm:w-48 sm:h-48" onError={(e) => { e.target.src = "https://placehold.co/200x200?text=Product"; }} />
                    </div>
                    <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm"><Link to={`/products/${item.product_id}`} className="font-medium text-gray-700 hover:text-gray-800">{item.name}</Link></h3>
                          </div>
                          {item.size && <p className="mt-1 text-sm text-gray-500">Size: {item.size}</p>}
                          <div className="mt-1 flex items-baseline gap-2">
                            {item.sale_price ? (
                                <><span className="text-sm font-medium text-red-600">{formatNaira(item.sale_price)}</span><span className="text-xs text-gray-500 line-through">{formatNaira(item.price)}</span></>
                            ) : <span className="text-sm font-medium text-gray-900">{formatNaira(item.price)}</span>}
                          </div>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="flex items-center border border-gray-300 rounded-md w-max">
                            <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} className="p-2 hover:bg-gray-100"><Minus size={16} /></button>
                            <span className="px-4 text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} className="p-2 hover:bg-gray-100"><Plus size={16} /></button>
                          </div>
                          <div className="absolute top-0 right-0">
                            <button onClick={() => removeItem(item.cart_item_id)} className="-m-2 p-2 inline-flex text-gray-400 hover:text-gray-500"><span className="sr-only">Remove</span><Trash2 size={20} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Order Summary */}
            <section className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5">
              <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Order total</dt>
                  <dd className="text-base font-medium text-gray-900">{formatNaira(total)}</dd>
                </div>
              </div>
              <div className="mt-6">
                <Link to="/checkout" className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500 flex justify-center">
                  Checkout
                </Link>
              </div>
            </section>
          </div>
        )}

        {/* Related Products Section */}
        <RelatedProducts cartItems={cartItems} />
      </div>
    </div>
  );
};

export default Cart;