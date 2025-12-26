import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, Award, Lock } from 'lucide-react';
import { formatNaira } from '../utils/formatCurrency';
import { JUMIA_STATIONS } from '../data/jumiaStations';
import { usePaystackPayment } from 'react-paystack';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [isPaying, setIsPaying] = useState(false);
  const orderProcessed = useRef(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch(`${API_URL}/cart`, {
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
        const response = await fetch(`${API_URL}/user`, {
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
            fetch(`${API_URL}/addresses`, { headers: { token: localStorage.token } }),
            fetch(`${API_URL}/orders`, { headers: { token: localStorage.token } })
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
    if (step === 1) {
        if (!JUMIA_STATIONS.includes(shippingInfo.pickupStation)) {
            alert("Please select a valid pickup station from the list.");
            return;
        }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const applyPromo = async () => {
    try {
      const response = await fetch(`${API_URL}/cart/validate-promo`, {
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

  // Paystack Configuration
  const pointsValue = pointsRedeemed * 100;
  const finalAmount = Math.max(0, total - discount - pointsValue);
  
  // Use state for reference to ensure it persists across renders but updates on retry
  const [paystackReference, setPaystackReference] = useState((new Date()).getTime().toString());

  const paystackConfig = useMemo(() => ({
    reference: paystackReference,
    email: user?.email || "customer@example.com",
    amount: finalAmount * 100, // Paystack expects amount in Kobo (Naira * 100)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here',
    metadata: {
        user_id: user?.user_id,
        shipping_address: shippingInfo,
        points_redeemed: pointsRedeemed,
        points_earned: Math.floor(finalAmount / 10000), // 1 point per 10k
        custom_fields: [] // Can add cart summary here if needed for email receipt
    }
  }), [paystackReference, user, finalAmount, shippingInfo, pointsRedeemed]);

  const initializePayment = usePaystackPayment(paystackConfig);

  const onPaystackSuccess = (reference) => {
      console.log("Paystack Success Data:", reference);
      handlePlaceOrder(reference);
  };

  const onPaystackClose = () => {
      alert("Payment cancelled");
      setIsPaying(false);
      setPaystackReference((new Date()).getTime().toString()); // Generate new ref for next attempt
  };

  const handlePlaceOrder = async (paymentData) => {
    if (orderProcessed.current) return;

    if (paymentData && paymentData.preventDefault) paymentData.preventDefault();
    
    const pointsValue = pointsRedeemed * 100;
    // Robustly extract reference: try paymentData, then fallback to state
    const refFromData = paymentData?.reference || (typeof paymentData === 'string' ? paymentData : null);
    const paymentReference = refFromData || paystackReference;

    console.log("Attempting to place order with Ref:", paymentReference);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify({ 
            total_amount: Math.max(0, total - discount - pointsValue),
            shipping_address: shippingInfo,
            points_redeemed: pointsRedeemed,
            payment_reference: paymentReference
        })
      });
      
      const parseRes = await response.json();
      
      if (parseRes.order_id) {
          console.log("Order Created Successfully:", parseRes.order_id);
          orderProcessed.current = true;
          window.dispatchEvent(new Event("cartUpdated")); // Clear cart badge
          navigate(`/order-confirmation/${parseRes.order_id}`);
      } else {
          console.error("Order Creation Failed:", parseRes);
          alert("Failed to place order: " + (parseRes.message || JSON.stringify(parseRes)));
      }
    } catch (err) {
      console.error(err.message);
      alert("Error processing order");
    }
  };

  // Polling Effect: Check if order was created via Webhook (Fallback for when callback fails)
  useEffect(() => {
    let interval;
    if (isPaying && !orderProcessed.current) {
      interval = setInterval(async () => {
        if (orderProcessed.current) return;
        try {
          const response = await fetch(`http://localhost:5000/orders/ref/${paystackReference}`, {
            headers: { token: localStorage.token }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.order_id && !orderProcessed.current) {
              orderProcessed.current = true;
              clearInterval(interval);
              window.dispatchEvent(new Event("cartUpdated"));
              navigate(`/order-confirmation/${data.order_id}`);
            }
          }
        } catch (err) { /* Ignore polling errors to reduce console noise */ }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isPaying, paystackReference, navigate]);

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
                            <input 
                                list="jumia-stations-checkout"
                                type="text" 
                                name="pickupStation" 
                                id="pickupStation" 
                                required 
                                value={shippingInfo.pickupStation} 
                                onChange={handleShippingChange} 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Select or Search Station"
                            />
                            <datalist id="jumia-stations-checkout">
                                {JUMIA_STATIONS.map((station) => (
                                    <option key={station} value={station} />
                                ))}
                            </datalist>
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
                <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Complete Payment</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CreditCard className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Payment Required</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>You are about to pay <strong>{formatNaira(finalAmount)}</strong> securely via Paystack.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manual Verification Button (Backup for Localhost/Network issues) */}
                    {isPaying && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md animate-pulse">
                            <p className="text-sm text-yellow-800 mb-2 font-medium">
                                Payment completed but page didn't redirect?
                            </p>
                            <button 
                                type="button"
                                onClick={() => handlePlaceOrder({ reference: paystackReference })}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-500 underline focus:outline-none"
                            >
                                Click here to confirm your payment
                            </button>
                        </div>
                    )}

                    <div className="mt-6 flex justify-between">
                        <button type="button" onClick={prevStep} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Back
                        </button>
                        <button 
                            onClick={() => {
                                setIsPaying(true);
                                initializePayment(onPaystackSuccess, onPaystackClose);
                            }}
                            className="flex items-center bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-8 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Pay {formatNaira(finalAmount)}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;