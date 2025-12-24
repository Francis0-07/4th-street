import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, Award } from 'lucide-react';
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

const Checkout = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [user, setUser] = useState(null);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    pickupStation: '',
    country: ''
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch("http://localhost:5000/cart", {
          headers: { token: localStorage.token }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
            if (data.length === 0) {
                navigate('/cart'); // Redirect if empty
            }
            setCartItems(data);
            const sum = data.reduce((acc, item) => acc + (parseFloat(item.sale_price || item.price) * item.quantity), 0);
            setTotal(sum);
        }
      } catch (err) {
        console.error(err.message);
      }
    };
    fetchCart();

    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/user", {
          headers: { token: localStorage.token }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) { console.error(err); }
    };
    fetchUser();

    const fetchAddresses = async () => {
      if (!localStorage.token) return;
      try {
        const [addrRes, ordersRes] = await Promise.all([
            fetch("http://localhost:5000/addresses", { headers: { token: localStorage.token } }),
            fetch("http://localhost:5000/orders", { headers: { token: localStorage.token } })
        ]);

        let combined = [];

        // Process Saved Addresses
        if (addrRes.ok) {
            const addrs = await addrRes.json();
            if (Array.isArray(addrs)) {
                combined = addrs.map(a => ({
                    fullName: a.full_name,
                    address: a.address_line1,
                    city: a.city,
                    country: a.country,
                    pickupStation: a.postal_code, // Map stored postal code to pickup station
                    is_default: a.is_default,
                    label: `${a.full_name} - ${a.address_line1} (Saved)`
                }));
            }
        }

        // Process Previous Orders
        if (ordersRes.ok) {
            const orders = await ordersRes.json();
            if (Array.isArray(orders)) {
                orders.forEach(o => {
                    const sa = o.shipping_address;
                    if (sa && !combined.some(c => c.address === sa.address)) {
                        combined.push({
                            fullName: sa.fullName,
                            address: sa.address,
                            city: sa.city,
                            country: sa.country,
                            pickupStation: sa.pickupStation || sa.postalCode,
                            label: `${sa.fullName} - ${sa.address} (Previous Order)`
                        });
                    }
                });
            }
        }
        setSavedAddresses(combined);
        
        // Auto-fill default
        const defaultAddr = combined.find(a => a.is_default);
        if (defaultAddr) selectAddress(defaultAddr);

      } catch (err) { console.error(err); }
    };
    fetchAddresses();
  }, [navigate]);

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
  };

  const selectAddress = (addr) => {
    setShippingInfo({
        fullName: addr.fullName || '',
        address: addr.address || '',
        city: addr.city || '',
        pickupStation: addr.pickupStation || '',
        country: addr.country || ''
    });
  };

  const handleAddressSelect = (e) => {
    const index = e.target.value;
    if (index === "") {
        setShippingInfo({ fullName: '', address: '', city: '', pickupStation: '', country: '' });
        return;
    }
    selectAddress(savedAddresses[index]);
  };

  const nextStep = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const applyPromo = async () => {
    try {
      const response = await fetch('http://localhost:5000/cart/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: localStorage.token
        },
        body: JSON.stringify({ code: promoCode })
      });

      const data = await response.json();

      if (response.ok) {
        let discountAmount = 0;
        if (data.type === 'percentage') {
          discountAmount = (total * parseFloat(data.value)) / 100;
        } else {
          discountAmount = parseFloat(data.value);
        }
        setDiscount(discountAmount);
        alert(`Promotion applied: ${data.code}`);
      } else {
        alert(data);
        setDiscount(0);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handlePointsChange = (e) => {
    const points = parseInt(e.target.value) || 0;
    const maxPoints = user?.loyalty_points || 0;
    // 1 point = ₦100. Max points can't make total negative.
    const maxPointsForOrder = Math.floor((total - discount) / 100);
    
    const pointsToUse = Math.min(points, maxPoints, maxPointsForOrder);
    
    setPointsRedeemed(pointsToUse);
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    const pointsValue = pointsRedeemed * 100;
    try {
      const response = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify({ 
            total_amount: Math.max(0, total - discount - pointsValue),
            shipping_address: shippingInfo,
            points_redeemed: pointsRedeemed
        })
      });
      
      const parseRes = await response.json();
      
      if (parseRes.order_id) {
          window.dispatchEvent(new Event("cartUpdated")); // Clear cart badge
          navigate(`/order-confirmation/${parseRes.order_id}`);
      } else {
          alert("Failed to place order: " + JSON.stringify(parseRes));
      }
    } catch (err) {
      console.error(err.message);
      alert("Error processing order");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-8">
          <ol role="list" className="flex items-center justify-center space-x-8">
            <li className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <Truck className="w-6 h-6" />
              <span className="ml-2 font-medium">Shipping</span>
            </li>
            <li className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <CheckCircle className="w-6 h-6" />
              <span className="ml-2 font-medium">Review</span>
            </li>
            <li className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <CreditCard className="w-6 h-6" />
              <span className="ml-2 font-medium">Payment</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            {step === 1 && (
                <form onSubmit={nextStep}>
                    {savedAddresses.length > 0 && (
                        <div className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Use a saved address</label>
                            <select onChange={handleAddressSelect} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="">Select an address...</option>
                                {savedAddresses.map((addr, idx) => (
                                    <option key={idx} value={idx}>{addr.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" name="fullName" id="fullName" required value={shippingInfo.fullName} onChange={handleShippingChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="sm:col-span-6">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                            <input type="text" name="address" id="address" required value={shippingInfo.address} onChange={handleShippingChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                            <input type="text" name="city" id="city" required value={shippingInfo.city} onChange={handleShippingChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                            <input type="text" name="country" id="country" required value={shippingInfo.country} onChange={handleShippingChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="pickupStation" className="block text-sm font-medium text-gray-700">Closest Jumia Pickup Station</label>
                            <select name="pickupStation" id="pickupStation" required value={shippingInfo.pickupStation} onChange={handleShippingChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="">Select a station</option>
                                {JUMIA_STATIONS.map((station) => (
                                    <option key={station} value={station}>{station}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Continue to Review
                        </button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                    <div className="border-t border-gray-200 py-4">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {shippingInfo.fullName}<br />
                                    {shippingInfo.address}<br />
                                    {shippingInfo.city}, {shippingInfo.country}<br />
                                    Pickup: {shippingInfo.pickupStation}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div className="border-t border-gray-200 py-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Items</h3>
                        <ul className="divide-y divide-gray-200">
                            {cartItems.map((item) => (
                                <li key={item.cart_item_id} className="flex py-4">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{formatNaira(parseFloat(item.price) * item.quantity)}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatNaira(total)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Discount</span>
                                    <span>-{formatNaira(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>{formatNaira(total - discount)}</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <label htmlFor="promo" className="block text-sm font-medium text-gray-700">Promo Code</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input type="text" name="promo" id="promo" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300" placeholder="Enter code" />
                                <button type="button" onClick={applyPromo} className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Loyalty Points Section */}
                        {user?.loyalty_points > 0 && (
                          <div className="mt-6 border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <label htmlFor="points" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Award size={16} className="text-indigo-600" />
                                Redeem Loyalty Points
                              </label>
                              <span className="text-xs text-gray-500">Available: {user.loyalty_points} points</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="number" id="points" min="0" max={user.loyalty_points} value={pointsRedeemed} onChange={handlePointsChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Points to use" />
                              <span className="text-sm text-gray-500 whitespace-nowrap">= {formatNaira(pointsRedeemed * 100)} off</span>
                            </div>
                          </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-between">
                        <button type="button" onClick={prevStep} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Back
                        </button>
                        <button onClick={nextStep} className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Continue to Payment
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <form onSubmit={handlePlaceOrder}>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h2>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card Number</label>
                            <input type="text" name="cardNumber" id="cardNumber" required value={paymentInfo.cardNumber} onChange={handlePaymentChange} placeholder="0000 0000 0000 0000" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="sm:col-span-3">
                            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">Expiration Date (MM/YY)</label>
                            <input type="text" name="expiry" id="expiry" required value={paymentInfo.expiry} onChange={handlePaymentChange} placeholder="MM/YY" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="sm:col-span-3">
                            <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                            <input type="text" name="cvc" id="cvc" required value={paymentInfo.cvc} onChange={handlePaymentChange} placeholder="123" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                        <button type="button" onClick={prevStep} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Back
                        </button>
                        <button type="submit" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Place Order
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;