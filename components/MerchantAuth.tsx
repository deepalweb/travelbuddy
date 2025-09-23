import React, { useState } from 'react';

interface MerchantAuthProps {
  onLogin: (merchant: any) => void;
}

const MerchantAuth: React.FC<MerchantAuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    businessType: 'restaurant',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication
    const mockMerchant = {
      id: Date.now().toString(),
      businessName: formData.businessName || 'Demo Business',
      email: formData.email,
      verified: true
    };
    
    onLogin(mockMerchant);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Merchant Login' : 'Register Your Business'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Business Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Business Name"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="cafe">Cafe</option>
                <option value="shop">Shop</option>
                <option value="attraction">Attraction</option>
              </select>
              
              <input
                type="text"
                placeholder="Business Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {isLogin ? 'Login' : 'Register Business'}
          </button>
        </form>
        
        <p className="text-center mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default MerchantAuth;