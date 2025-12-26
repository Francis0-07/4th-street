import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, ChevronRight, Star, CheckCircle, ArrowRight, ZoomIn, ChevronDown, ChevronUp, X, ChevronLeft } from 'lucide-react';
import RelatedProducts from '../components/RelatedProducts';
import { formatNaira } from '../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SizeSelector = ({ sizes, selectedSize, onSelect }) => {
    if (!sizes || sizes.length === 0) return null;

    return (
        <div>
            <div className="flex justify-between mb-3">
                <span className="text-sm font-semibold text-[#111317]">Size</span>
                <button className="text-sm text-indigo-600 hover:underline font-medium">Size Guide</button>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {sizes.map((s) => {
                    const isOutOfStock = parseInt(s.stock) <= 0;
                    return (
                        <button
                            key={s.size}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => onSelect(s.size)}
                            className={`h-12 border rounded-lg transition-all font-medium text-sm relative overflow-hidden
                                ${isOutOfStock 
                                    ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed' 
                                    : selectedSize === s.size 
                                        ? 'bg-indigo-600 text-white shadow-md border-indigo-600 ring-2 ring-indigo-600/20' 
                                        : 'border-gray-200 hover:border-indigo-600 hover:text-indigo-600 bg-white text-gray-900'
                                }
                            `}
                        >
                            {s.size}
                            {isOutOfStock && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-px bg-gray-300 rotate-45 transform scale-110"></div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
                <CheckCircle size={14} />
                In stock, ready to ship
            </p>
        </div>
    );
};

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();
        setProduct(data);
        setActiveImage(data.image_url);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    // Check if product is in wishlist
    const checkWishlist = async () => {
      if (!localStorage.token) return;
      try {
        const response = await fetch(`${API_URL}/wishlist`, {
          headers: { token: localStorage.token }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setIsInWishlist(data.some(item => item.product_id === parseInt(id)));
        }
      } catch (err) {
        console.error(err.message);
      }
    };
    checkWishlist();
  }, [id]);

  const addToCart = async () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        alert("Please select a size.");
        return;
    }

    if (!localStorage.token) {
        // Guest Cart Logic
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingItemIndex = guestCart.findIndex(item => item.product_id === product.product_id && item.size === selectedSize);
        
        if (existingItemIndex > -1) {
            guestCart[existingItemIndex].quantity += 1;
        } else {
            guestCart.push({
                cart_item_id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                sale_price: product.sale_price,
                image_url: product.image_url || (product.images && product.images[0]),
                size: selectedSize,
                quantity: 1
            });
        }
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        alert("Item added to cart");
        window.dispatchEvent(new Event("cartUpdated"));
        return;
    }

    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            token: localStorage.token 
        },
        body: JSON.stringify({ product_id: product.product_id, quantity: 1, size: selectedSize })
      });
      const parseRes = await response.json();
      alert(parseRes); // "Item added to cart"
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error(err.message);
    }
  };

  const toggleWishlist = async () => {
    if (!localStorage.token) {
      alert("Please log in to manage your wishlist.");
      return;
    }
    try {
      if (isInWishlist) {
        await fetch(`${API_URL}/wishlist/${product.product_id}`, {
          method: "DELETE",
          headers: { token: localStorage.token }
        });
        setIsInWishlist(false);
      } else {
        const response = await fetch(`${API_URL}/wishlist`, {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              token: localStorage.token 
          },
          body: JSON.stringify({ product_id: product.product_id })
        });
        if (response.ok) setIsInWishlist(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="bg-[#f6f6f8] text-[#111317] font-sans transition-colors duration-200 min-h-screen">
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-indigo-600 transition-colors">Shop</Link>
          <ChevronRight size={12} />
          <span className="text-[#111317] font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allImages.map((img, index) => (
                <div key={index} className="bg-gray-100 rounded-lg overflow-hidden group relative aspect-[3/4]">
                  <img 
                    src={img} 
                    alt={`${product.name} view ${index + 1}`} 
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = "https://placehold.co/600x800?text=Product"; }}
                  />
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openLightbox(index)} className="bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm hover:bg-white transition-colors">
                      <ZoomIn size={20} className="text-gray-800" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Product Details (Sticky) */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="lg:sticky lg:top-24 flex flex-col gap-6">
              {/* Title & Price */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-[#111317] tracking-tight">{product.name}</h1>
                  <button onClick={toggleWishlist} className={`text-gray-400 hover:text-red-500 transition-colors ${isInWishlist ? 'text-red-500' : ''}`}>
                    <Heart className={isInWishlist ? 'fill-current' : ''} size={24} />
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  {product.sale_price ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-medium text-red-600">{formatNaira(product.sale_price)}</span>
                        <span className="text-lg text-gray-500 line-through">{formatNaira(product.price)}</span>
                    </div>
                  ) : (
                    <span className="text-xl font-medium text-[#111317]">{formatNaira(product.price)}</span>
                  )}
                  <div className="flex items-center gap-1 text-yellow-500 text-sm">
                    {[...Array(4)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
                    <Star size={16} className="fill-current text-gray-300" />
                    <span className="text-gray-500 ml-1 underline cursor-pointer hover:text-indigo-600">(124 Reviews)</span>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Size Selection */}
              <SizeSelector sizes={product.sizes} selectedSize={selectedSize} onSelect={setSelectedSize} />

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <button 
                    onClick={addToCart}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
                >
                  <span>Add to Cart</span>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <p className="text-xs text-center text-gray-500">Free shipping on orders over {formatNaira(50000)}. Free returns within 30 days.</p>
              </div>

              {/* Accordions */}
              <div className="border-t border-gray-200 mt-6">
                <div className="border-b border-gray-200">
                    <button 
                        onClick={() => toggleAccordion('features')}
                        className="flex justify-between items-center w-full py-4 font-medium text-[#111317] focus:outline-none"
                    >
                        <span>Product Features</span>
                        {openAccordion === 'features' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openAccordion === 'features' && (
                        <div className="text-gray-600 text-sm pb-4 pl-4 animate-fadeIn">
                            <ul className="list-disc space-y-2">
                                <li>Premium materials</li>
                                <li>Expert craftsmanship</li>
                                <li>Designed for comfort and style</li>
                            </ul>
                        </div>
                    )}
                </div>
                <div className="border-b border-gray-200">
                    <button 
                        onClick={() => toggleAccordion('care')}
                        className="flex justify-between items-center w-full py-4 font-medium text-[#111317] focus:outline-none"
                    >
                        <span>Fabric & Care</span>
                        {openAccordion === 'care' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openAccordion === 'care' && (
                        <div className="text-gray-600 text-sm pb-4 animate-fadeIn">
                            Machine wash cold with like colors. Tumble dry low. Warm iron if needed. Do not bleach.
                        </div>
                    )}
                </div>
                <div className="border-b border-gray-200">
                    <button 
                        onClick={() => toggleAccordion('shipping')}
                        className="flex justify-between items-center w-full py-4 font-medium text-[#111317] focus:outline-none"
                    >
                        <span>Shipping & Returns</span>
                        {openAccordion === 'shipping' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openAccordion === 'shipping' && (
                        <div className="text-gray-600 text-sm pb-4 animate-fadeIn">
                            Orders placed before 2pm EST ship same day. We offer free returns and exchanges within 30 days of purchase.
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-24 mb-16">
            <RelatedProducts cartItems={[product]} />
        </div>

        {/* Lightbox */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10">
              <X size={32} />
            </button>
            
            {allImages.length > 1 && (
              <button onClick={prevImage} className="absolute left-4 text-white hover:text-gray-300 p-2 z-10">
                <ChevronLeft size={48} />
              </button>
            )}
            
            <img 
              src={allImages[lightboxIndex]} 
              alt="Full screen product" 
              className="max-h-[90vh] max-w-[90vw] object-contain select-none" 
              onClick={(e) => e.stopPropagation()}
            />

            {allImages.length > 1 && (
              <button onClick={nextImage} className="absolute right-4 text-white hover:text-gray-300 p-2 z-10">
                <ChevronRight size={48} />
              </button>
            )}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
