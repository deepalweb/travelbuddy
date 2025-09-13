import React from 'react';
import { Colors } from '../constants.ts';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4"
        style={{ borderColor: Colors.primary, borderTopColor: Colors.primaryGradientEnd }}
      ></div>
      <p className="ml-4 text-xl font-semibold" style={{color: Colors.text}}>Loading...</p>
    </div>
  );
};

export default LoadingSpinner;