import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, PackagePlus } from 'lucide-react';

const ReturnsManagement = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/returns', {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      setReturns(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this return as ${newStatus}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:5000/admin/returns/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            token: localStorage.token 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchReturns();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestock = async (id) => {
    if (!window.confirm("Restock items from this return? Inventory counts will be increased.")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/admin/returns/${id}/restock`, {
        method: 'POST',
        headers: { token: localStorage.token }
      });

      if (response.ok) {
        alert("Inventory updated successfully");
      } else {
        const err = await response.json();
        alert("Failed to restock: " + err);
      }
    } catch (err) {
      console.error(err);
      alert("Error restocking items");
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
        case 'approved': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
        case 'rejected': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
        case 'completed': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Completed</span>;
        default: return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Returns Management</h2>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="p-6 text-center">Loading...</td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No return requests found.</td></tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.return_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{ret.return_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:underline">
                        <Link to={`/orders/${ret.order_id}`}>#{ret.order_id}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{ret.user_name}</div>
                        <div className="text-xs">{ret.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium capitalize">{ret.reason.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-400">{ret.resolution}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ret.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ret.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {ret.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleStatusUpdate(ret.return_id, 'approved')} className="text-green-600 hover:text-green-900" title="Approve">
                                    <CheckCircle size={18} />
                                </button>
                                <button onClick={() => handleStatusUpdate(ret.return_id, 'rejected')} className="text-red-600 hover:text-red-900" title="Reject">
                                    <XCircle size={18} />
                                </button>
                            </div>
                        )}
                        {ret.status === 'approved' && (
                            <div className="flex justify-end gap-3">
                                <button onClick={() => handleRestock(ret.return_id)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1" title="Restock Inventory">
                                    <PackagePlus size={16} /> Restock
                                </button>
                                <button onClick={() => handleStatusUpdate(ret.return_id, 'completed')} className="text-blue-600 hover:text-blue-900 flex items-center gap-1" title="Mark Completed">
                                    <Clock size={16} /> Complete
                                </button>
                            </div>
                        )}
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

export default ReturnsManagement;