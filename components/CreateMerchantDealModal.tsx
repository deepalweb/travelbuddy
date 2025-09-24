import React, { useState } from 'react';
import { Colors } from '../constants.ts';

interface CreateMerchantDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dealData: any) => void;
  currentUser?: any;
}

const CreateMerchantDealModal: React.FC<CreateMerchantDealModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    businessType: currentUser?.merchantInfo?.businessType || 'restaurant',
    validUntil: '',
    originalPrice: '',
    discountedPrice: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dealData = {
        ...formData,
        businessName: currentUser?.merchantInfo?.businessName || currentUser?.username || 'My Business',
        businessAddress: currentUser?.merchantInfo?.businessAddress || '',
        merchantId: currentUser?.mongoId || currentUser?._id,
        isActive: true,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined
      };

      await onSubmit(dealData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        discount: '',
        businessType: currentUser?.merchantInfo?.businessType || 'restaurant',
        validUntil: '',
        originalPrice: '',
        discountedPrice: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold" style={{ color: Colors.text }}>
              Create New Deal
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                Deal Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 20% Off All Meals"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe your deal..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                Discount *
              </label>
              <input
                type="text"
                required
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 20% OFF, Buy 1 Get 1 Free"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                Business Type
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="cafe">Cafe</option>
                <option value="shop">Shop</option>
                <option value="attraction">Attraction</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                  Original Price
                </label>
                <input
                  type="text"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                  Deal Price
                </label>
                <input
                  type="text"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.text }}>
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMerchantDealModal;