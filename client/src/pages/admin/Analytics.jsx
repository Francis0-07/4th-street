import { useState, useEffect } from 'react';
import { TrendingUp, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Analytics = () => {
  const [data, setData] = useState({ sales: [], topProducts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/analytics`, {
          headers: { token: localStorage.token }
        });
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to find max value for chart scaling
  const maxSales = data.sales.length > 0 ? Math.max(...data.sales.map(d => parseFloat(d.total))) : 1;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Analytics & Reports</h2>

      {loading ? <p>Loading data...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sales Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Sales Trend (Last 30 Days)</h3>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            
            {data.sales.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales data available yet.</p>
            ) : (
              <div className="h-64 flex space-x-4 items-end border-b border-gray-100 pb-4">
                {data.sales.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <div className="w-full flex flex-col justify-end items-center h-full relative">
                      <div 
                        className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all relative max-w-[40px]"
                        style={{ height: `${(parseFloat(day.total) / maxSales) * 100}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 pointer-events-none">
                          ${day.total}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 w-full text-center truncate">{new Date(day.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products List */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
              <Award className="text-yellow-500" size={20} />
            </div>
            <ul className="divide-y divide-gray-200">
              {data.topProducts.map((product, index) => (
                <li key={index} className="py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{index + 1}. {product.name}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.sold} sold
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;