import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Plus, Trash2, Power } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/promotions`, {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      setPromotions(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        await fetch(`${API_URL}/admin/promotions/${id}`, {
          method: "DELETE",
          headers: { token: localStorage.token }
        });
        fetchPromotions();
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await fetch(`${API_URL}/admin/promotions/${promo.promotion_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", token: localStorage.token },
        body: JSON.stringify({ ...promo, is_active: !promo.is_active })
      });
      fetchPromotions();
    } catch (err) { console.error(err.message); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Promotions & Discounts</h2>
        <Link to="/admin/promotions/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2" size={16} /> Create Promotion
        </Link>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center">Loading...</td></tr>
              ) : (
                promotions.map((promo) => (
                  <tr key={promo.promotion_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promo.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{promo.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleToggleActive(promo)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Toggle Active"><Power size={16} /></button>
                      <button onClick={() => handleDelete(promo.promotion_id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionsManagement;