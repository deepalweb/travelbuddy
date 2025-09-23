import React from 'react';

interface Deal {
  _id: string;
  title: string;
  discount: string;
  description: string;
  businessName: string;
  businessType: string;
  businessPhone?: string;
  businessWebsite?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  images?: string[];
  validUntil: string;
  views: number;
  claims: number;
}

interface DealDetailModalProps {
  deal: Deal;
  onClose: () => void;
  onClaim: (dealId: string) => void;
}

const DealDetailModal: React.FC<DealDetailModalProps> = ({ deal, onClose, onClaim }) => {
  const handleClaim = () => {
    onClaim(deal._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{deal.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Deal Image */}
          {deal.images?.[0] && (
            <img
              src={deal.images[0]}
              alt={deal.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          {/* Discount Badge */}
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-center font-bold text-lg mb-4">
            {deal.discount}
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-4">{deal.description}</p>

          {/* Business Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="font-semibold text-gray-800">{deal.businessName}</h3>
            <p className="text-sm text-gray-600 capitalize">{deal.businessType}</p>
            
            {/* Contact Options */}
            <div className="flex gap-2 mt-3">
              {deal.businessPhone && (
                <a
                  href={`tel:${deal.businessPhone}`}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                >
                  📞 Call
                </a>
              )}
              
              {deal.businessWebsite && (
                <a
                  href={deal.businessWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  🌐 Website
                </a>
              )}
              
              {deal.location && (
                <a
                  href={`https://maps.google.com/?q=${deal.location.lat},${deal.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                >
                  📍 Directions
                </a>
              )}
            </div>
            
            {/* Location Address */}
            {deal.location?.address && (
              <p className="text-xs text-gray-500 mt-2">📍 {deal.location.address}</p>
            )}
          </div>

          {/* Deal Stats */}
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>{deal.views} views</span>
            <span>{deal.claims} claimed</span>
            <span>Valid until {new Date(deal.validUntil).toLocaleDateString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClaim}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Claim Deal
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailModal;