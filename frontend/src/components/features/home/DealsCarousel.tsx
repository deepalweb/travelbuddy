import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Tag } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  discount: string;
  image: string;
  validUntil: string;
  businessName: string;
}

interface DealsCarouselProps {
  deals: Deal[];
}

const DealsCarousel: React.FC<DealsCarouselProps> = ({ deals }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getDiscountColor = (discount: string) => {
    const percentage = parseInt(discount.replace(/\D/g, ''));
    if (percentage >= 50) return 'bg-red-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h left`;
    return `${minutes}m left`;
  };

  useEffect(() => {
    if (deals.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [deals.length]);

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No deals available right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-red-100 rounded-lg">
          <Tag className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Hot Deals</h2>
        <div className="bg-red-50 px-2 py-1 rounded-full">
          <span className="text-xs font-medium text-red-600">{deals.length} Active</span>
        </div>
      </div>

      <div className="relative h-48 overflow-hidden rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative h-full bg-gray-200 rounded-xl overflow-hidden">
              {deals[currentIndex]?.image && (
                <img
                  src={deals[currentIndex].image}
                  alt={deals[currentIndex].title}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              
              {/* Discount Badge */}
              <div className={`absolute top-4 right-4 ${getDiscountColor(deals[currentIndex]?.discount)} px-3 py-1 rounded-full`}>
                <span className="text-white font-bold text-sm">{deals[currentIndex]?.discount}</span>
              </div>
              
              {/* Timer */}
              <div className="absolute top-4 left-4 bg-orange-500/90 px-2 py-1 rounded-lg flex items-center space-x-1">
                <Clock className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-medium">
                  {getTimeRemaining(deals[currentIndex]?.validUntil)}
                </span>
              </div>
              
              {/* Content */}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-1">
                  {deals[currentIndex]?.title}
                </h3>
                <p className="text-white/90 text-sm mb-3">
                  {deals[currentIndex]?.businessName}
                </p>
                <motion.button
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Claim Deal
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators */}
      {deals.length > 1 && (
        <div className="flex justify-center space-x-2">
          {deals.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-red-500 w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DealsCarousel;