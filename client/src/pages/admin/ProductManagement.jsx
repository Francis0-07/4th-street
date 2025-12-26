import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const location = useLocation();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearchTerm(q);
  }, [location.search]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await fetch(`${API_URL}/admin/products/${id}`, {
          method: "DELETE",
          headers: { token: localStorage.token }
        });
        fetchProducts(); // Refresh the list
      } catch (err) {
        console.error(err.message);
        alert("Failed to delete product.");
      }
    }
  };

  // Filtering logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Stats calculation
  const totalProducts = products.length;
  const totalValue = products.reduce((acc, curr) => acc + (parseFloat(curr.price) * (curr.stock_quantity || 0)), 0);
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#0e121b] font-sans">
      <div className="flex h-screen w-full overflow-hidden">
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f6f8] relative">
          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
              
              {/* Page Header */}
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-black text-[#0e121b] tracking-tight">Inventory</h2>
                  <p className="text-[#506795] text-sm md:text-base">Manage your product catalog, stock levels, and variants.</p>
                </div>
                <Link to="/admin/products/new" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-all active:scale-95">
                  <Plus size={20} />
                  <span className="text-sm font-semibold">Add Product</span>
                </Link>
              </header>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#506795]">Total Products</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-[#0e121b]">{totalProducts}</h3>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#506795]">Total Value</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-[#0e121b]">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+5%</span>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#506795]">Low Stock</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-[#0e121b]">{lowStock}</h3>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Needs Attention</span>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#506795]">Out of Stock</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-[#0e121b]">{outOfStock}</h3>
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Urgent</span>
                  </div>
                </div>
              </div>

              {/* Filters & Toolbar */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#506795]">
                    <Search size={20} />
                  </span>
                  <input 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 placeholder:text-[#506795] outline-none" 
                    placeholder="Search by name..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative min-w-[160px]">
                    <select 
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none cursor-pointer"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option>All Categories</option>
                      <option>Clothing</option>
                      <option>Shoes</option>
                      <option>Suits</option>
                      <option>Shirts</option>
                      <option>Pants</option>
                      <option>Jackets</option>
                      <option>Accessories</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#506795] pointer-events-none text-base">▼</span>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#e5e7eb]">
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795] w-16">Image</th>
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795] min-w-[200px]">Product Name</th>
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795]">Category</th>
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795] text-right">Price</th>
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795] text-center">Stock</th>
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795] w-24">Status</th>
                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-[#506795] text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {loading ? (
                        <tr><td colSpan="7" className="p-6 text-center text-[#506795]">Loading...</td></tr>
                      ) : currentItems.length === 0 ? (
                        <tr><td colSpan="7" className="p-6 text-center text-[#506795]">No products found.</td></tr>
                      ) : (
                        currentItems.map((product) => (
                          <tr key={product.product_id} className="hover:bg-gray-50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="w-10 h-10 rounded bg-gray-100 bg-cover bg-center border border-gray-200 overflow-hidden">
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/40x40?text=Img"; }} />
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm font-medium text-[#0e121b]">{product.name}</p>
                              <p className="text-xs text-[#506795] mt-0.5 truncate max-w-[200px]">{product.description}</p>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {product.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm font-medium text-[#0e121b] text-right">${product.price}</td>
                            <td className="py-4 px-6 text-sm text-[#0e121b] text-center">{product.stock_quantity}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center">
                                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${product.stock_quantity > 10 ? 'bg-green-500' : product.stock_quantity > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                <span className={`text-xs font-medium ${product.stock_quantity > 10 ? 'text-green-700' : product.stock_quantity > 0 ? 'text-amber-700' : 'text-red-700'}`}>
                                  {product.stock_quantity > 10 ? 'In Stock' : product.stock_quantity > 0 ? 'Low' : 'Empty'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link to={`/admin/products/edit/${product.product_id}`} className="text-[#506795] hover:text-indigo-600 p-1 rounded hover:bg-gray-100">
                                  <Edit size={20} />
                                </Link>
                                <button onClick={() => handleDelete(product.product_id)} className="text-[#506795] hover:text-red-600 p-1 rounded hover:bg-gray-100">
                                  <Trash2 size={20} />
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e7eb] bg-gray-50">
                  <span className="text-sm text-[#506795]">
                    Showing <span className="font-semibold text-[#0e121b]">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)}</span> of <span className="font-semibold text-[#0e121b]">{filteredProducts.length}</span>
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => paginate(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-[#e5e7eb] bg-white text-sm text-[#506795] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ChevronLeft size={16} className="mr-1" /> Previous
                    </button>
                    <button 
                      onClick={() => paginate(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded border border-[#e5e7eb] bg-white text-sm text-[#506795] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      Next <ChevronRight size={16} className="ml-1" />
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

export default ProductManagement;
