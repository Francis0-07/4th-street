import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PromotionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    is_active: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/admin/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: localStorage.token
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/admin/promotions');
      } else {
        alert('Failed to create promotion.');
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link to="/admin/promotions" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="mr-2" size={20} /> Back to Promotions
        </Link>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Create New Promotion</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6 max-w-lg">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">Discount Code</label>
          <input type="text" name="code" id="code" required value={formData.code} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
            <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">Value</label>
            <input type="number" name="value" id="value" step="0.01" required value={formData.value} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
        </div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="is_active" className="font-medium text-gray-700">Activate this promotion</label>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700">
            Create Promotion
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionForm;