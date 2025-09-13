

import React from 'react';
import { Colors } from '../constants.ts';

const CommunityPhotoCardSkeleton: React.FC = () => {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: Colors.cardBackground,
        boxShadow: Colors.boxShadow,
      }}
      aria-hidden="true"
    >
      <div className="w-full h-56 bg-gray-300 animate-pulse" style={{backgroundColor: `${Colors.text_secondary}20`}}></div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="h-4 w-3/4 mb-2 bg-gray-300 animate-pulse rounded" style={{backgroundColor: `${Colors.text_secondary}20`}}></div>
        <div className="h-3 w-1/2 mb-3 bg-gray-300 animate-pulse rounded" style={{backgroundColor: `${Colors.text_secondary}10`}}></div>
        <div className="flex justify-between items-center">
          <div className="h-5 w-16 bg-gray-300 animate-pulse rounded" style={{backgroundColor: `${Colors.text_secondary}20`}}></div>
          <div className="h-8 w-20 bg-gray-300 animate-pulse rounded-lg" style={{backgroundColor: `${Colors.text_secondary}20`}}></div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPhotoCardSkeleton;
