import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RelatedProducts = ({ cartItems }) => {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (cartItems.length === 0) {
        setRelated([]);
        return;
      }

      // Get unique categories from cart
      const categories = [...new Set(cartItems.map(item => item.category))];
      // Get IDs of items already in cart to exclude them
      const excludeIds = cartItems.map(item => item.product_id).join(',');
      
      // For simplicity, we'll just use the first category to find related items
      const primaryCategory = categories[0];

      if (!primaryCategory) return;

      try {
        const response = await fetch(`http://localhost:5000/products?category=${primaryCategory}&exclude=${excludeIds}&limit=4`);
        const data = await response.json();
        // If no related items in the same category, fetch any other 4 items
        if (data.length === 0 && cartItems.length > 0) {
            const fallbackResponse = await fetch(`http://localhost:5000/products?exclude=${excludeIds}&limit=4`);
            const fallbackData = await fallbackResponse.json();
            setRelated(fallbackData);
        } else {
            setRelated(data);
        }
      } catch (err) {
        console.error("Failed to fetch related products:", err);
      }
    };

    fetchRelated();
  }, [cartItems]);

  if (related.length === 0) {
    return null; // Don't render anything if there are no related products
  }

  return (
    <div className="mt-24">
      <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">You might also like</h2>
      <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        {related.map((product) => (
          <div key={product.product_id} className="group relative">
            <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                onError={(e) => { e.target.src = "https://placehold.co/400x400?text=Product"; }}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-sm text-gray-700">
                  <Link to={`/products/${product.product_id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-gray-500">{product.category}</p>
              </div>
              <p className="text-sm font-medium text-gray-900">${product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;