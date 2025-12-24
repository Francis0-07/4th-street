import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';

const ReturnItem = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orderId: orderId || '',
    reason: 'wrong_size',
    comments: '',
    resolution: 'refund'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`http://localhost:5000/orders/${formData.orderId}/return`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                token: localStorage.token 
            },
            body: JSON.stringify({
                reason: formData.reason,
                comments: formData.comments,
                resolution: formData.resolution
            })
        });

        if (response.ok) {
            alert("Return request submitted successfully. We will review it shortly.");
            navigate('/dashboard', { state: { activeTab: 'orders' } });
        } else {
            const err = await response.json();
            alert("Failed to submit return: " + err);
        }
    } catch (err) {
        console.error(err);
        alert("Error submitting return request");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Return Item</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={formData.orderId}
                  onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                  className="pl-10 w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 border p-2.5"
                  placeholder="e.g. 123"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return</label>
              <select 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 border p-2.5"
              >
                <option value="wrong_size">Wrong Size</option>
                <option value="damaged">Damaged Item</option>
                <option value="not_as_described">Not as Described</option>
                <option value="changed_mind">Changed Mind</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Resolution</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="resolution" 
                    value="refund"
                    checked={formData.resolution === 'refund'}
                    onChange={(e) => setFormData({...formData, resolution: e.target.value})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Refund</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="resolution" 
                    value="exchange"
                    checked={formData.resolution === 'exchange'}
                    onChange={(e) => setFormData({...formData, resolution: e.target.value})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Exchange</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
              <textarea 
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                rows="4"
                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 border p-2.5"
                placeholder="Please provide more details..."
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnItem;
