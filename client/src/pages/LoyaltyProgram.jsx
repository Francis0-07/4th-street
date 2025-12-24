import { Award, ShoppingBag, Gift, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoyaltyProgram = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-indigo-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <Award className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            4th-street Rewards
          </h1>
          <p className="text-xl text-indigo-200 mb-8">
            Earn points with every purchase and unlock exclusive benefits.
          </p>
          <Link to="/register" className="inline-block bg-white text-indigo-900 font-bold py-3 px-8 rounded-lg hover:bg-indigo-50 transition-colors">
            Join for Free
          </Link>
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How it Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">1. Shop</h3>
            <p className="text-gray-600">Earn 1 point for every ₦10,000 you spend on our latest collections.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <TrendingUp size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">2. Earn</h3>
            <p className="text-gray-600">Watch your points accumulate in your dashboard.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Gift size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">3. Redeem</h3>
            <p className="text-gray-600">Use your points for discounts at checkout. 1 Point = ₦100 Off.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgram;
