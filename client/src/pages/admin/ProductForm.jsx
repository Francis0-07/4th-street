import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Save, Image as ImageIcon, Link as LinkIcon, List, Type, Bold, Italic, Underline } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
    images: [],
    sizes: []
  });

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`${API_URL}/products/${id}`);
          const data = await response.json();
          setFormData({
            ...data,
            images: data.images || [],
            sizes: data.sizes || []
          });
        } catch (err) {
          console.error(err.message);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Image Handlers
  const handleAddImage = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };
  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };
  const handleRemoveImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  // Size Handlers
  const handleAddSize = () => {
    setFormData({ ...formData, sizes: [...formData.sizes, { size: '', stock: 0 }] });
  };
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = value;
    setFormData({ ...formData, sizes: newSizes });
  };
  const handleRemoveSize = (index) => {
    setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== index) });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset file input
  };

  const triggerFileInput = () => {
    document.getElementById('file-upload').click();
  };

  const handleAdditionalFileUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...formData.images];
        newImages[index] = reader.result;
        setFormData({ ...formData, images: newImages });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset file input
  };

  const triggerAdditionalFileInput = (index) => {
    document.getElementById(`file-upload-${index}`).click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure main image is set if images array exists
    const finalData = { ...formData };
    if (finalData.images.length > 0 && !finalData.image_url) {
        finalData.image_url = finalData.images[0];
    }

    const url = isEditing ? `${API_URL}/admin/products/${id}` : `${API_URL}/admin/products`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          token: localStorage.token
        },
        body: JSON.stringify(finalData)
      });

      if (response.ok) {
        navigate('/admin/products');
      } else {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          alert(`Failed: ${errorData.message || JSON.stringify(errorData)}`);
        } catch {
          alert(`Failed: ${text || response.statusText}`);
        }
      }
    } catch (err) {
      console.error(err.message);
      alert(`An error occurred: ${err.message}`);
    }
  };

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#0e121b] font-sans">
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 lg:p-10">
        {/* Breadcrumbs & Actions Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <span className="text-gray-300">/</span>
              <Link to="/admin/products" className="hover:text-indigo-600 transition-colors">Products</Link>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-800">{isEditing ? 'Edit Product' : 'New Product'}</span>
            </nav>
            <h1 className="text-3xl font-black tracking-tight text-[#0e121b]">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/products" className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Save size={18} />
              Save Product
            </button>
          </div>
        </div>

        {/* Main Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Product Info & Variants */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* General Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-lg text-[#0e121b]">Product Details</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500" htmlFor="name">Product Name</label>
                  <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-gray-50 border-gray-200 focus:border-indigo-600 focus:ring-0 text-[#0e121b] placeholder-gray-400 text-base transition-all outline-none border" placeholder="e.g. Oxford Cotton Button Down" />
                </div>
                
                {/* Rich Text Editor Mockup */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                  <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                      <button type="button" className="p-1.5 rounded text-gray-500 hover:text-indigo-600 transition-colors"><Bold size={20} /></button>
                      <button type="button" className="p-1.5 rounded text-gray-500 hover:text-indigo-600 transition-colors"><Italic size={20} /></button>
                      <button type="button" className="p-1.5 rounded text-gray-500 hover:text-indigo-600 transition-colors"><Underline size={20} /></button>
                      <div className="w-px h-4 bg-gray-300 mx-2"></div>
                      <button type="button" className="p-1.5 rounded text-gray-500 hover:text-indigo-600 transition-colors"><List size={20} /></button>
                      <div className="w-px h-4 bg-gray-300 mx-2"></div>
                      <button type="button" className="p-1.5 rounded text-gray-500 hover:text-indigo-600 transition-colors"><LinkIcon size={20} /></button>
                      <button type="button" className="p-1.5 rounded text-gray-500 hover:text-indigo-600 transition-colors"><ImageIcon size={20} /></button>
                    </div>
                    {/* Content Area */}
                    <textarea name="description" id="description" rows="8" value={formData.description} onChange={handleChange} className="w-full p-4 bg-white border-none focus:ring-0 text-gray-700 text-sm leading-relaxed outline-none resize-none" placeholder="Write your product story here..."></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-lg text-[#0e121b]">Product Variants (Sizes)</h2>
              </div>
              <div className="p-6">
                <div className="border rounded-lg border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                      <tr>
                        <th className="px-6 py-3" scope="col">Size</th>
                        <th className="px-6 py-3" scope="col">Stock</th>
                        <th className="px-6 py-3 text-right" scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.sizes.map((item, index) => (
                        <tr key={index} className="bg-white hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <input 
                                type="text" 
                                value={item.size} 
                                onChange={(e) => handleSizeChange(index, 'size', e.target.value)} 
                                placeholder="Size (e.g. S, M)" 
                                className="w-full px-2 py-1 rounded border border-gray-200 text-sm bg-transparent focus:border-indigo-600 focus:ring-0 outline-none" 
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input 
                                type="number" 
                                value={item.stock} 
                                onChange={(e) => handleSizeChange(index, 'stock', e.target.value)} 
                                placeholder="0" 
                                className="w-full px-2 py-1 rounded border border-gray-200 text-sm bg-transparent focus:border-indigo-600 focus:ring-0 outline-none" 
                            />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button type="button" onClick={() => handleRemoveSize(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={handleAddSize} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1">
                  <Plus size={18} /> Add another size
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (Media, Organization, Pricing) */}
          <div className="space-y-8 flex flex-col h-full">
            
            {/* Media Gallery */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-[#0e121b] mb-4">Media</h3>
              {/* Upload Box */}
              <div onClick={triggerFileInput} className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors mb-4 group/upload">
                <Upload className="text-gray-400 group-hover/upload:text-indigo-600 mb-2 transition-colors" size={32} />
                <p className="text-sm font-medium text-gray-700">Click to upload main image</p>
                <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              
              {/* Images Grid */}
              <div className="grid grid-cols-3 gap-3">
                {formData.image_url && (
                    <div className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-indigo-500">
                        <img src={formData.image_url} alt="Main" className="w-full h-full object-cover" />
                    </div>
                )}
                {formData.images.map((img, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {img ? (
                            <>
                                <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => handleRemoveImage(index)} className="text-white hover:text-red-400"><Trash2 size={20} /></button>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200" onClick={() => triggerAdditionalFileInput(index)}>
                                <Plus className="text-gray-400" />
                                <input type="file" id={`file-upload-${index}`} className="hidden" accept="image/*" onChange={(e) => handleAdditionalFileUpload(index, e)} />
                            </div>
                        )}
                    </div>
                ))}
                <button type="button" onClick={handleAddImage} className="aspect-square rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-[#0e121b] mb-4">Pricing</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Price</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input type="number" name="price" step="0.01" required value={formData.price} onChange={handleChange} className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-50 border-gray-200 text-sm focus:border-indigo-600 focus:ring-0 outline-none border" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Sale Price</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input type="number" name="sale_price" step="0.01" value={formData.sale_price || ''} onChange={handleChange} className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-50 border-gray-200 text-sm focus:border-indigo-600 focus:ring-0 outline-none border" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Stock</label>
                    <input type="number" name="stock_quantity" required value={formData.stock_quantity} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-50 border-gray-200 text-sm focus:border-indigo-600 focus:ring-0 outline-none border" placeholder="0" />
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-[#0e121b] mb-4">Organization</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm focus:border-indigo-600 focus:ring-0 outline-none border p-2">
                    <option>Select a category</option>
                    <option>Clothing</option>
                    <option>Shoes</option>
                    <option>Suits</option>
                    <option>Shirts</option>
                    <option>Pants</option>
                    <option>Jackets</option>
                    <option>Accessories</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductForm;